using System.Collections.Generic;
using Game.Scripts.Gameplay.Core;
using GhostVillage.Gameplay.Monsters.OngKe;
using Photon.Pun;
using Game.Core.Interaction;
using TMPro;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.UI;

public class ChickenHuntPuzzle : MonoBehaviourPun, IPuzzleInteractTarget
{
    private sealed class ChickenMoverState
    {
        public ChickenCandidateInteractable Candidate;
        public Transform Transform;
        public Rigidbody Rb;
        public NavMeshAgent Agent;
        public bool IsReal;
        public Vector3 ManualTarget;
        public float NextRepathTime;
    }

    [Header("Reward")]
    [SerializeField] private KeyItemSO keyItemReward;
    [SerializeField] private float rewardDropHeight = 0.45f;
    [SerializeField] private bool useChickenVisualForRewardPickup = true;
    [SerializeField] private string rewardChickenVisualPrefabPath = "chicken_rig";

    [Header("Chicken Setup")]
    [SerializeField] private List<ChickenCandidateInteractable> candidates = new List<ChickenCandidateInteractable>();
    [SerializeField] private int realChickenIndex = 0;

    [Header("Catch Rules")]
    [SerializeField] private float captureRequired = 1f;
    [SerializeField] private float spacePressContribution = 0.08f;
    [SerializeField] private float captureDistance = 3f;

    [Header("Fake Chicken Alarm")]
    [SerializeField] private float ongKeForceChaseDuration = 12f;
    [SerializeField] private float fakeChickenAlarmCooldown = 1.2f;

    [Header("Real Chicken Movement")]
    [SerializeField] private bool useNavMeshForRealChicken = true;
    [SerializeField] private float coopRoamRadius = 10f;
    [SerializeField] private float roamSpeed = 1.4f;
    [SerializeField] private float evadeSpeed = 3.8f;
    [SerializeField] private float roamRepathInterval = 2.2f;
    [SerializeField] private float evadeRepathInterval = 0.3f;
    [SerializeField] private float fleeTurnSpeed = 10f;
    [SerializeField] private Transform arenaCenter;
    [SerializeField] private float arenaRadius = 10f;

    [Header("UI (optional)")]
    [SerializeField] private Slider captureProgressSlider;
    [SerializeField] private TextMeshProUGUI statusText;

    private bool _isSolved;
    private bool _isCatchPhase;
    private float _captureProgress;
    private Transform _realChickenTf;
    private readonly List<ChickenMoverState> _movers = new List<ChickenMoverState>();
    private readonly List<ChickenCandidateInteractable> _fakeChickens = new List<ChickenCandidateInteractable>();
    private int _winnerActorNumber = -1;
    private OngKeMonster _ongKeMonster;
    private bool _isInitialized;
    private float _nextFakeAlarmAllowedTime;
    private bool _rewardPickupSpawned;

    private bool CanUsePhotonRpc => PhotonNetwork.IsConnectedAndReady && photonView != null && photonView.ViewID != 0;

    private void Awake()
    {
        _ongKeMonster = FindObjectOfType<OngKeMonster>();

        InitializeCandidates();
    }

    public void ConfigureCandidates(List<ChickenCandidateInteractable> runtimeCandidates, int runtimeRealChickenIndex)
    {
        if (runtimeCandidates == null || runtimeCandidates.Count == 0)
        {
            Debug.LogWarning("[ChickenHunt] ConfigureCandidates called with empty list.");
            return;
        }

        candidates = runtimeCandidates;
        realChickenIndex = runtimeRealChickenIndex;
        
        // Track fake chickens separately so we don't destroy them on puzzle completion
        _fakeChickens.Clear();
        for (int i = 0; i < candidates.Count; i++)
        {
            if (i != realChickenIndex)
            {
                _fakeChickens.Add(candidates[i]);
            }
        }
        
        InitializeCandidates();
    }

    private void InitializeCandidates()
    {
        _isInitialized = false;
        _realChickenTf = null;
        _movers.Clear();

        if (candidates.Count == 0)
        {
            candidates.AddRange(GetComponentsInChildren<ChickenCandidateInteractable>(true));
        }

        if (candidates.Count == 0)
        {
            Debug.LogWarning("[ChickenHunt] No chicken candidates assigned.");
            return;
        }

        realChickenIndex = Mathf.Clamp(realChickenIndex, 0, candidates.Count - 1);

        for (int i = 0; i < candidates.Count; i++)
        {
            bool isReal = i == realChickenIndex;
            ChickenCandidateInteractable candidate = candidates[i];
            if (candidate == null) continue;

            candidate.Setup(this, i, isReal);
            if (isReal)
            {
                _realChickenTf = candidate.transform;
            }

            _movers.Add(CreateMoverState(candidate, isReal));
        }

        EnsureMovementCenterDefaults();

        _isInitialized = true;
        UpdateUI();
    }

    private void Update()
    {
        if (_isSolved) return;

        if (!PhotonNetwork.IsConnectedAndReady || PhotonNetwork.IsMasterClient)
        {
            UpdateChickenMovement();
        }
    }

    private ChickenMoverState CreateMoverState(ChickenCandidateInteractable candidate, bool isReal)
    {
        var state = new ChickenMoverState
        {
            Candidate = candidate,
            Transform = candidate.transform,
            Rb = candidate.GetComponent<Rigidbody>(),
            Agent = null,
            IsReal = isReal,
            ManualTarget = candidate.transform.position,
            NextRepathTime = 0f
        };

        if (state.Rb == null)
        {
            state.Rb = candidate.gameObject.AddComponent<Rigidbody>();
        }

        state.Rb.useGravity = true;
        state.Rb.angularDamping = 8f;
        state.Rb.linearDamping = 2f;
        state.Rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationZ;

        if (useNavMeshForRealChicken)
        {
            state.Agent = candidate.GetComponent<NavMeshAgent>();
            if (state.Agent == null)
            {
                state.Agent = candidate.gameObject.AddComponent<NavMeshAgent>();
            }

            state.Agent.speed = roamSpeed;
            state.Agent.angularSpeed = 720f;
            state.Agent.acceleration = 18f;
            state.Agent.stoppingDistance = 0.15f;
            state.Agent.autoBraking = false;
            state.Agent.updateUpAxis = true;
            state.Agent.updateRotation = true;

            // Avoid physics and NavMesh fighting each other.
            state.Rb.isKinematic = true;
        }

        return state;
    }

    private void EnsureMovementCenterDefaults()
    {
        if (_realChickenTf == null) return;

        if (arenaCenter == null)
        {
            arenaCenter = transform;
        }

        if (arenaRadius <= 0f)
        {
            arenaRadius = coopRoamRadius > 0f ? coopRoamRadius : 10f;
        }
    }

    private void UpdateChickenMovement()
    {
        for (int i = 0; i < _movers.Count; i++)
        {
            ChickenMoverState mover = _movers[i];
            if (mover == null || mover.Transform == null) continue;

            if (_isCatchPhase)
            {
                if (mover.IsReal)
                {
                    UpdateEvadeMovement(mover);
                }
                else
                {
                    StopMover(mover);
                }
            }
            else
            {
                UpdateRoamMovement(mover);
            }
        }
    }

    private void UpdateRoamMovement(ChickenMoverState mover)
    {
        if (mover == null || mover.Transform == null) return;

        if (mover.Agent != null && mover.Agent.isOnNavMesh)
        {
            mover.Agent.speed = roamSpeed;

            bool shouldPickNewDestination = Time.time >= mover.NextRepathTime
                || !mover.Agent.hasPath
                || mover.Agent.remainingDistance <= (mover.Agent.stoppingDistance + 0.15f);

            if (shouldPickNewDestination)
            {
                Vector3 roamCenter = arenaCenter != null ? arenaCenter.position : transform.position;
                if (TryGetNavMeshPointInRadius(roamCenter, Mathf.Max(1f, coopRoamRadius), out Vector3 roamTarget))
                {
                    mover.Agent.SetDestination(roamTarget);
                }

                mover.NextRepathTime = Time.time + Mathf.Max(0.2f, roamRepathInterval);
            }

            return;
        }

        if (Time.time >= mover.NextRepathTime || Vector3.Distance(mover.Transform.position, mover.ManualTarget) < 0.35f)
        {
            Vector3 roamCenter = arenaCenter != null ? arenaCenter.position : transform.position;
            Vector2 random2D = Random.insideUnitCircle * Mathf.Max(1f, coopRoamRadius);
            mover.ManualTarget = ClampToArena(roamCenter + new Vector3(random2D.x, 0f, random2D.y));
            mover.NextRepathTime = Time.time + Mathf.Max(0.25f, roamRepathInterval);
        }

        MoveMoverTowards(mover, mover.ManualTarget, roamSpeed);
    }

    private void UpdateEvadeMovement(ChickenMoverState mover)
    {
        if (mover == null || mover.Transform == null) return;

        if (mover.Agent != null && mover.Agent.isOnNavMesh)
        {
            mover.Agent.speed = evadeSpeed;

            if (Time.time >= mover.NextRepathTime)
            {
                Vector3 fleeDir = ComputeFleeDirection(mover.Transform);
                if (fleeDir.sqrMagnitude > 0.001f)
                {
                    Vector3 desired = mover.Transform.position + fleeDir * Mathf.Max(3f, coopRoamRadius * 0.7f);
                    desired = ClampToArena(desired);

                    if (TryGetNavMeshPointNear(desired, 2f, out Vector3 navTarget))
                    {
                        mover.Agent.SetDestination(navTarget);
                    }
                }

                mover.NextRepathTime = Time.time + Mathf.Max(0.15f, evadeRepathInterval);
            }

            return;
        }

        Vector3 evadeDir = ComputeFleeDirection(mover.Transform);
        if (evadeDir.sqrMagnitude < 0.001f) return;

        Vector3 target = mover.Transform.position + evadeDir * Mathf.Max(3f, coopRoamRadius * 0.7f);
        target = ClampToArena(target);
        MoveMoverTowards(mover, target, evadeSpeed);
    }

    private void MoveMoverTowards(ChickenMoverState mover, Vector3 target, float moveSpeed)
    {
        if (mover == null || mover.Transform == null) return;

        Vector3 delta = target - mover.Transform.position;
        delta.y = 0f;
        if (delta.sqrMagnitude < 0.0001f) return;

        Vector3 dir = delta.normalized;
        Vector3 nextPos = mover.Transform.position + dir * Mathf.Max(0f, moveSpeed) * Time.deltaTime;
        nextPos = ClampToArena(nextPos);

        Quaternion lookRot = Quaternion.LookRotation(dir, Vector3.up);
        Quaternion nextRot = Quaternion.Slerp(mover.Transform.rotation, lookRot, fleeTurnSpeed * Time.deltaTime);

        if (mover.Rb != null && !mover.Rb.isKinematic)
        {
            mover.Rb.MovePosition(nextPos);
            mover.Rb.MoveRotation(nextRot);
            return;
        }

        mover.Transform.position = nextPos;
        mover.Transform.rotation = nextRot;
    }

    private void StopMover(ChickenMoverState mover)
    {
        if (mover == null) return;

        if (mover.Agent != null && mover.Agent.isOnNavMesh)
        {
            mover.Agent.ResetPath();
        }
    }

    public void Interact(GameObject actor)
    {
        // Puzzle root interaction is optional. Real flow is on each chicken candidate.
        if (_isSolved) return;
        if (statusText != null)
        {
            statusText.text = _isCatchPhase
                ? "Con ga that dang bo chay! Lai gan va spam F de bat."
                : "Tim con ga that trong bay ga.";
        }
    }

    public string GetPromptMessage()
    {
        if (_isSolved) return "Da bat duoc ga";
        if (_isCatchPhase) return "Ga that dang chay! Spam F de bat";
        return "Tim con ga that";
    }

    public string GetCandidatePrompt(ChickenCandidateInteractable candidate)
    {
        if (_isSolved) return "Da giai";

        if (!_isCatchPhase)
        {
            return "Kiem tra con ga (F)";
        }

        return candidate.IsRealChicken ? "Con ga that! Lai gan va spam F" : "Ga gia";
    }

    public void OnCandidateInteracted(ChickenCandidateInteractable candidate, GameObject actor)
    {
        Debug.Log($"[ChickenHunt] OnCandidateInteracted called - candidate: {(candidate != null ? candidate.name : "NULL")}, actor: {(actor != null ? actor.name : "NULL")}");

        if (!_isInitialized || _isSolved || candidate == null || actor == null) return;

        PhotonView actorPv = actor.GetComponent<PhotonView>();
        if (actorPv != null && !actorPv.IsMine) return;

        if (!_isCatchPhase)
        {
            if (!candidate.IsRealChicken)
            {
                TriggerFakeChickenAlarm(candidate, actor, actorPv);
                if (statusText != null)
                {
                    statusText.text = "Ga gia keu len! Ong Ke dang toi.";
                }
                return;
            }

            if (CanUsePhotonRpc)
            {
                photonView.RPC(nameof(StartCatchPhaseRPC), RpcTarget.AllBuffered);
            }
            else
            {
                StartCatchPhaseRPC();
            }
            return;
        }

        // During catch phase, players repeatedly interact (F) to contribute progress.
        if (!candidate.IsRealChicken)
        {
            TryTriggerFakeAlarmWithCooldown(candidate, actor, actorPv);
            if (statusText != null)
            {
                statusText.text = "Ga gia keu len! Ong Ke dang toi.";
            }
            return;
        }

        TryAddCaptureProgressByInteract(actor);

        if (statusText != null)
        {
            statusText.text = "Spam F vao ga that de bat!";
        }
    }

    private void TryAddCaptureProgressByInteract(GameObject actor)
    {
        if (!_isCatchPhase || _realChickenTf == null || actor == null) return;

        float dist = Vector3.Distance(actor.transform.position, _realChickenTf.position);
        Debug.Log($"[ChickenHunt] TryAddCaptureProgressByInteract - distance to real chicken: {dist:F2}, captureDistance: {captureDistance}");
        
        if (dist > captureDistance)
        {
            Debug.Log($"[ChickenHunt]  Too far from real chicken to capture");
            return;
        }

        int actorNumber = PhotonNetwork.IsConnectedAndReady ? PhotonNetwork.LocalPlayer.ActorNumber : 0;
        Debug.Log($"[ChickenHunt]  Adding capture progress, actor: {actorNumber}");

        if (CanUsePhotonRpc)
        {
            photonView.RPC(nameof(AddCaptureProgressRPC), RpcTarget.MasterClient, spacePressContribution, actorNumber);
        }
        else
        {
            AddCaptureProgressRPC(spacePressContribution, actorNumber);
        }
    }

    private void TryTriggerFakeAlarmWithCooldown(ChickenCandidateInteractable candidate, GameObject actor, PhotonView actorPv)
    {
        if (candidate == null || candidate.IsRealChicken) return;
        if (Time.time < _nextFakeAlarmAllowedTime) return;

        _nextFakeAlarmAllowedTime = Time.time + Mathf.Max(0f, fakeChickenAlarmCooldown);
        TriggerFakeChickenAlarm(candidate, actor, actorPv);
    }

    private void TriggerFakeChickenAlarm(ChickenCandidateInteractable candidate, GameObject actor, PhotonView actorPv)
    {
        int candidateIndex = candidate.CandidateIndex;
        int actorViewId = actorPv != null ? actorPv.ViewID : -1;
        Vector3 alarmPosition = candidate.transform.position;

        if (PhotonNetwork.IsConnectedAndReady)
        {
            photonView.RPC(nameof(PlayFakeChickenCryRPC), RpcTarget.All, candidateIndex);

            if (PhotonNetwork.IsMasterClient)
            {
                ForceOngKeFromAlarm(actorViewId, alarmPosition);
            }
            else
            {
                photonView.RPC(nameof(RequestMasterAlarmRPC), RpcTarget.MasterClient, actorViewId, alarmPosition);
            }
            return;
        }

        candidate.PlayFakeChickenCry();
        Transform fallbackTarget = actor != null ? actor.transform : null;
        ForceOngKeToTarget(fallbackTarget, alarmPosition);
    }

    [PunRPC]
    private void PlayFakeChickenCryRPC(int candidateIndex)
    {
        if (candidateIndex < 0 || candidateIndex >= candidates.Count) return;

        ChickenCandidateInteractable candidate = candidates[candidateIndex];
        if (candidate == null || candidate.IsRealChicken) return;

        candidate.PlayFakeChickenCry();
    }

    [PunRPC]
    private void RequestMasterAlarmRPC(int actorViewId, Vector3 alarmPosition)
    {
        if (!PhotonNetwork.IsMasterClient) return;
        ForceOngKeFromAlarm(actorViewId, alarmPosition);
    }

    private void ForceOngKeFromAlarm(int actorViewId, Vector3 alarmPosition)
    {
        Transform target = null;
        if (actorViewId > 0)
        {
            PhotonView view = PhotonView.Find(actorViewId);
            if (view != null) target = view.transform;
        }

        ForceOngKeToTarget(target, alarmPosition);
    }

    private void ForceOngKeToTarget(Transform preferredTarget, Vector3 alarmPosition)
    {
        if (_ongKeMonster == null)
        {
            _ongKeMonster = FindObjectOfType<OngKeMonster>();
            if (_ongKeMonster == null)
            {
                Debug.LogWarning("[ChickenHunt] No OngKeMonster found to respond to fake chicken alarm.");
                return;
            }
        }

        // Nếu có target (player) → Force Chase (cổ vật bắt được gà thật)
        if (preferredTarget != null)
        {
            _ongKeMonster.ForceChasePlayer(preferredTarget, ongKeForceChaseDuration);
        }
        else
        {
            // Nếu không có target → là gà giả, ông kẹ chuyển sang Investigate tại vị trí tiếng kêu
            _ongKeMonster.OnFakeChickenAlarm(alarmPosition);
        }
    }

    private Transform FindClosestPlayerTransform(Vector3 origin)
    {
        GameObject[] players = GameObject.FindGameObjectsWithTag("Player");
        Transform best = null;
        float bestDistance = float.MaxValue;

        for (int i = 0; i < players.Length; i++)
        {
            if (players[i] == null || !players[i].activeInHierarchy) continue;

            float d = (players[i].transform.position - origin).sqrMagnitude;
            if (d < bestDistance)
            {
                bestDistance = d;
                best = players[i].transform;
            }
        }

        return best;
    }

    [PunRPC]
    private void StartCatchPhaseRPC()
    {
        if (_isSolved) return;

        _isCatchPhase = true;
        _captureProgress = 0f;
        UpdateUI();

        if (statusText != null)
        {
            statusText.text = "Da tim thay ga that! Ga dang bo chay. Spam F de bat.";
        }
    }

    [PunRPC]
    private void AddCaptureProgressRPC(float amount, int actorNumber)
    {
        Debug.Log($"[ChickenHunt] AddCaptureProgressRPC called - amount: {amount}, progress before: {_captureProgress:F2}");

        if (_isSolved || !_isCatchPhase) 
        {
            Debug.LogWarning($"[ChickenHunt] AddCaptureProgressRPC rejected: isSolved={_isSolved}, isCatchPhase={_isCatchPhase}");
            return;
        }
        if (PhotonNetwork.IsConnectedAndReady && !PhotonNetwork.IsMasterClient) 
        {
            Debug.Log("[ChickenHunt] AddCaptureProgressRPC: not master client");
            return;
        }

        _captureProgress = Mathf.Clamp01(_captureProgress + Mathf.Max(0.001f, amount));
        Debug.Log($"[ChickenHunt]  Progress updated to {_captureProgress:F2} / {captureRequired}");

        if (CanUsePhotonRpc)
        {
            photonView.RPC(nameof(SyncProgressRPC), RpcTarget.Others, _captureProgress);
        }
        else
        {
            SyncProgressRPC(_captureProgress);
        }

        if (_captureProgress >= captureRequired)
        {
            Debug.Log($"[ChickenHunt] 🎉 Puzzle completed! Progress reached required amount");
            _winnerActorNumber = actorNumber;
            if (CanUsePhotonRpc)
            {
                photonView.RPC(nameof(CompletePuzzleRPC), RpcTarget.AllBuffered, _winnerActorNumber);
            }
            else
            {
                CompletePuzzleRPC(_winnerActorNumber);
            }
        }
    }

    [PunRPC]
    private void SyncProgressRPC(float progress)
    {
        _captureProgress = Mathf.Clamp01(progress);
        UpdateUI();
    }

    [PunRPC]
    private void CompletePuzzleRPC(int winnerActorNumber)
    {
        if (_isSolved) return;

        _isSolved = true;
        _isCatchPhase = false;
        _captureProgress = captureRequired;
        _winnerActorNumber = winnerActorNumber;

        Vector3 rewardSpawnOrigin = _realChickenTf != null ? _realChickenTf.position : transform.position;

        // Only destroy REAL chicken, keep FAKE chickens in scene and moving
        if (realChickenIndex >= 0 && realChickenIndex < candidates.Count)
        {
            ChickenCandidateInteractable realCandidate = candidates[realChickenIndex];
            if (realCandidate != null)
            {
                // Remove real chicken's mover from movement list (keep fakes moving)
                _movers.RemoveAll(m => m.Candidate == realCandidate);
                Destroy(realCandidate.gameObject);
                Debug.Log("[ChickenHunt]  Destroyed real chicken after capture");
            }
        }

        // Disable fake chickens' interactability but keep them moving
        for (int i = 0; i < _fakeChickens.Count; i++)
        {
            if (_fakeChickens[i] == null) continue;
            _fakeChickens[i].enabled = false; // Prevent interaction but allow movement
            Debug.Log($"[ChickenHunt] Disabled fake chicken {i} (keep moving)");
        }

        // Keep remaining movers so fake chickens continue to roam

        if (PhotonNetwork.IsConnectedAndReady)
        {
            if (PhotonNetwork.IsMasterClient)
            {
                SpawnRewardPickup(rewardSpawnOrigin);
            }
        }
        else
        {
            SpawnRewardPickup(rewardSpawnOrigin);
        }

        // Directly grant reward to winner's inventory
        TryGrantRewardToWinnerLocal();

        Debug.Log("[ChickenHunt] Invoking OnPuzzleSolved event...");
        GameplayEvents.OnPuzzleSolved?.Invoke();
        UpdateUI();

        if (statusText != null)
        {
            statusText.text = "Da bat duoc ga that!";
        }

        Debug.Log($"[ChickenHunt] Puzzle completed by actor {winnerActorNumber}.");
    }

    private void SpawnRewardPickup(Vector3 spawnOrigin)
    {
        if (_rewardPickupSpawned) return;

        ItemDataSO rewardItem = ResolveRewardItem();
        if (rewardItem == null)
        {
            Debug.LogError("[ChickenHunt] Unable to resolve reward item for pickup.");
            return;
        }

        Debug.Log($"[ChickenHunt] Spawning reward pickup for item: {rewardItem.itemName}");

        Vector3 spawnPos = spawnOrigin + Vector3.up * Mathf.Max(0f, rewardDropHeight);
        Quaternion spawnRot = Quaternion.identity;

        GameObject pickupGo = null;
        if (rewardItem.itemWorldPrefab != null)
        {
            if (PhotonNetwork.IsConnectedAndReady)
            {
                pickupGo = PhotonNetwork.Instantiate(rewardItem.itemWorldPrefab.name, spawnPos, spawnRot);
            }
            else
            {
                pickupGo = Object.Instantiate(rewardItem.itemWorldPrefab, spawnPos, spawnRot);
            }
        }

        if (pickupGo == null)
        {
            pickupGo = CreateFallbackRewardPickup(spawnPos, spawnRot);
        }

        ConfigurePickupData(pickupGo, rewardItem);
        ApplyChickenVisualToPickup(pickupGo);
        _rewardPickupSpawned = pickupGo != null;
        
        if (_rewardPickupSpawned)
        {
            Debug.Log($"[ChickenHunt]  Reward pickup spawned at {spawnPos}, object: {pickupGo.name}");
        }
    }

    private ItemDataSO ResolveRewardItem()
    {
        if (keyItemReward != null) return keyItemReward;

        // Priority 1: Load KeyItemChicken (chicken-specific reward)
        KeyItemSO chickenReward = Resources.Load<KeyItemSO>("KeyItems/KeyItemChicken");
        if (chickenReward != null && chickenReward.itemIcon != null)
        {
            Debug.Log($"[ChickenHunt]  Loaded KeyItemChicken reward: {chickenReward.itemName}");
            keyItemReward = chickenReward;
            return keyItemReward;
        }

        // Priority 2: Try load KeyItem_Thread as fallback
        KeyItemSO directLoad = Resources.Load<KeyItemSO>("KeyItems/KeyItem_Thread");
        if (directLoad != null && directLoad.itemIcon != null)
        {
            Debug.Log($"[ChickenHunt]  Loaded KeyItem from Resources: {directLoad.itemName}");
            keyItemReward = directLoad;
            return keyItemReward;
        }

        // Priority 3: Search all KeyItemSO in Resources for one with icon
        KeyItemSO[] availableRewards = Resources.LoadAll<KeyItemSO>(string.Empty);
        if (availableRewards != null && availableRewards.Length > 0)
        {
            for (int i = 0; i < availableRewards.Length; i++)
            {
                if (availableRewards[i] == null) continue;
                if (availableRewards[i].itemIcon != null)
                {
                    keyItemReward = availableRewards[i];
                    Debug.LogWarning($"[ChickenHunt] keyItemReward was null. Using fallback asset reward: {keyItemReward.itemName}.");
                    return keyItemReward;
                }
            }

            keyItemReward = availableRewards[0];
            Debug.LogWarning($"[ChickenHunt] keyItemReward was null. Using first available reward asset: {keyItemReward.itemName}.");
            return keyItemReward;
        }

        // Priority 4: Final fallback - create runtime reward
        KeyItemSO runtimeReward = ScriptableObject.CreateInstance<KeyItemSO>();
        runtimeReward.itemId = "mock_chicken_reward";
        runtimeReward.itemName = "Con ga";
        runtimeReward.description = "Con ga bat duoc";
        runtimeReward.itemType = ItemType.KeyItem;

        keyItemReward = runtimeReward;
        Debug.LogWarning($"[ChickenHunt] keyItemReward was null. Using runtime fallback reward item. Icon: {(runtimeReward.itemIcon != null ? "" : "")}");
        return keyItemReward;
    }

    private void ConfigurePickupData(GameObject pickupGo, ItemDataSO rewardItem)
    {
        if (pickupGo == null || rewardItem == null) return;

        ItemPickup itemPickup = pickupGo.GetComponent<ItemPickup>();
        if (itemPickup != null)
        {
            itemPickup.data = rewardItem;
        }

        KeyItemPickup keyItemPickup = pickupGo.GetComponent<KeyItemPickup>();
        if (keyItemPickup != null)
        {
            keyItemPickup.data = rewardItem;
            keyItemPickup.promptText = "Nhặt gà";
        }
    }

    private GameObject CreateFallbackRewardPickup(Vector3 spawnPos, Quaternion spawnRot)
    {
        var pickupGo = new GameObject("ChickenRewardPickup");
        pickupGo.transform.SetPositionAndRotation(spawnPos, spawnRot);

        int interactableLayer = LayerMask.NameToLayer("Interactable");
        pickupGo.layer = interactableLayer >= 0 ? interactableLayer : 0;

        SphereCollider col = pickupGo.AddComponent<SphereCollider>();
        col.isTrigger = false;
        col.radius = 0.5f;

        Rigidbody rb = pickupGo.AddComponent<Rigidbody>();
        rb.useGravity = true;
        rb.isKinematic = false;
        rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationZ;

        if (pickupGo.GetComponent<PhotonView>() == null)
        {
            pickupGo.AddComponent<PhotonView>();
        }

        if (pickupGo.GetComponent<KeyItemPickup>() == null)
        {
            pickupGo.AddComponent<KeyItemPickup>();
        }

        return pickupGo;
    }

    private void ApplyChickenVisualToPickup(GameObject pickupGo)
    {
        if (!useChickenVisualForRewardPickup || pickupGo == null) return;

        if (string.IsNullOrWhiteSpace(rewardChickenVisualPrefabPath)) return;

        GameObject chickenVisualPrefab = Resources.Load<GameObject>(rewardChickenVisualPrefabPath);
        if (chickenVisualPrefab == null)
        {
            Debug.LogWarning($"[ChickenHunt] Reward chicken visual prefab not found at Resources/{rewardChickenVisualPrefabPath}.");
            return;
        }

        // Keep pickup logic/collider on root, replace only visuals by chicken model.
        Renderer[] rootRenderers = pickupGo.GetComponentsInChildren<Renderer>(true);
        for (int i = 0; i < rootRenderers.Length; i++)
        {
            if (rootRenderers[i] == null) continue;
            rootRenderers[i].enabled = false;
        }

        Transform oldVisual = pickupGo.transform.Find("ChickenRewardVisual");
        if (oldVisual != null)
        {
            Destroy(oldVisual.gameObject);
        }

        GameObject visual = Instantiate(chickenVisualPrefab, pickupGo.transform);
        visual.name = "ChickenRewardVisual";
        visual.transform.localPosition = Vector3.zero;
        visual.transform.localRotation = Quaternion.identity;
        visual.transform.localScale = Vector3.one;

        Collider[] visualColliders = visual.GetComponentsInChildren<Collider>(true);
        for (int i = 0; i < visualColliders.Length; i++)
        {
            if (visualColliders[i] == null) continue;
            visualColliders[i].enabled = false;
        }

        Rigidbody[] visualBodies = visual.GetComponentsInChildren<Rigidbody>(true);
        for (int i = 0; i < visualBodies.Length; i++)
        {
            if (visualBodies[i] == null) continue;
            visualBodies[i].isKinematic = true;
            visualBodies[i].useGravity = false;
        }

        ChickenCandidateInteractable[] candidateComponents = visual.GetComponentsInChildren<ChickenCandidateInteractable>(true);
        for (int i = 0; i < candidateComponents.Length; i++)
        {
            if (candidateComponents[i] == null) continue;
            candidateComponents[i].enabled = false;
        }

        NavMeshAgent[] visualAgents = visual.GetComponentsInChildren<NavMeshAgent>(true);
        for (int i = 0; i < visualAgents.Length; i++)
        {
            if (visualAgents[i] == null) continue;
            visualAgents[i].enabled = false;
        }
    }

    private void TryGrantRewardToWinnerLocal()
    {
        if (keyItemReward == null)
        {
            Debug.LogError("[ChickenHunt] keyItemReward is null.");
            return;
        }

        bool isWinnerLocal = !PhotonNetwork.IsConnectedAndReady
            || PhotonNetwork.LocalPlayer.ActorNumber == _winnerActorNumber;

        if (!isWinnerLocal) return;

        var inv = InventoryManager.LocalInstance;
        if (inv == null)
        {
            Debug.LogError("[ChickenHunt] Missing local inventory.");
            return;
        }

        bool added = inv.AddItem(keyItemReward);
        if (!added)
        {
            // Fallback if inventory is full.
            for (int i = 0; i < inv.items.Count; i++)
            {
                var item = inv.items[i];
                if (item == null || item.itemType == ItemType.EscapeTool) continue;

                inv.RemoveItem(item);
                if (inv.AddItem(keyItemReward))
                {
                    Debug.LogWarning($"[ChickenHunt] Replaced {item.itemName} with {keyItemReward.itemName} because inventory was full.");
                    return;
                }
            }

            Debug.LogError("[ChickenHunt] Failed to grant reward: inventory is full.");
            return;
        }

        Debug.Log($"[ChickenHunt] Granted reward {keyItemReward.itemName}.");
    }

    private Vector3 ComputeFleeDirection(Transform fromTransform)
    {
        if (fromTransform == null) return Vector3.zero;

        GameObject[] players = GameObject.FindGameObjectsWithTag("Player");
        if (players == null || players.Length == 0)
        {
            return fromTransform.forward;
        }

        Vector3 center = Vector3.zero;
        int count = 0;

        for (int i = 0; i < players.Length; i++)
        {
            if (players[i] == null || !players[i].activeInHierarchy) continue;
            center += players[i].transform.position;
            count++;
        }

        if (count == 0) return fromTransform.forward;

        center /= count;
        Vector3 away = (fromTransform.position - center);
        away.y = 0f;
        if (away.sqrMagnitude < 0.001f)
        {
            away = Random.onUnitSphere;
            away.y = 0f;
        }

        return away.normalized;
    }

    private Vector3 ClampToArena(Vector3 pos)
    {
        if (arenaCenter == null || arenaRadius <= 0f) return pos;

        Vector3 offset = pos - arenaCenter.position;
        offset.y = 0f;

        if (offset.magnitude > arenaRadius)
        {
            offset = offset.normalized * arenaRadius;
            pos.x = arenaCenter.position.x + offset.x;
            pos.z = arenaCenter.position.z + offset.z;
        }

        return pos;
    }

    private bool TryGetNavMeshPointInRadius(Vector3 center, float radius, out Vector3 point)
    {
        for (int i = 0; i < 6; i++)
        {
            Vector2 random2D = Random.insideUnitCircle * Mathf.Max(0.5f, radius);
            Vector3 candidate = center + new Vector3(random2D.x, 0f, random2D.y);
            candidate = ClampToArena(candidate);

            if (TryGetNavMeshPointNear(candidate, 2.5f, out point))
            {
                return true;
            }
        }

        point = _realChickenTf != null ? _realChickenTf.position : center;
        return false;
    }

    private bool TryGetNavMeshPointNear(Vector3 desired, float maxDistance, out Vector3 point)
    {
        if (NavMesh.SamplePosition(desired, out NavMeshHit hit, Mathf.Max(0.5f, maxDistance), NavMesh.AllAreas))
        {
            point = hit.position;
            return true;
        }

        point = desired;
        return false;
    }

    private void UpdateUI()
    {
        if (captureProgressSlider != null)
        {
            captureProgressSlider.gameObject.SetActive(_isCatchPhase || _isSolved);
            captureProgressSlider.value = captureRequired <= 0f ? 0f : Mathf.Clamp01(_captureProgress / captureRequired);
        }
    }

#if UNITY_EDITOR
    private void OnValidate()
    {
        if (captureRequired <= 0f) captureRequired = 1f;
        if (spacePressContribution <= 0f) spacePressContribution = 0.01f;
        if (captureDistance < 0.5f) captureDistance = 0.5f;
        if (ongKeForceChaseDuration < 0f) ongKeForceChaseDuration = 0f;
        if (roamSpeed < 0f) roamSpeed = 0f;
        if (evadeSpeed < 0f) evadeSpeed = 0f;
        if (fleeTurnSpeed < 0f) fleeTurnSpeed = 0f;
        if (coopRoamRadius < 1f) coopRoamRadius = 1f;
        if (roamRepathInterval < 0.1f) roamRepathInterval = 0.1f;
        if (evadeRepathInterval < 0.1f) evadeRepathInterval = 0.1f;
        if (arenaRadius < 0f) arenaRadius = 0f;
        if (fakeChickenAlarmCooldown < 0f) fakeChickenAlarmCooldown = 0f;
        if (rewardDropHeight < 0f) rewardDropHeight = 0f;
    }
#endif
}
