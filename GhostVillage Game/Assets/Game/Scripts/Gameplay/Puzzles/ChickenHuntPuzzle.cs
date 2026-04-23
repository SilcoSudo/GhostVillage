using System.Collections.Generic;
using Game.Scripts.Gameplay.Core;
using GhostVillage.Gameplay.Monsters.OngKe;
using Photon.Pun;
using Game.Core.Interaction;
using TMPro;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.UI;
using ExitGames.Client.Photon;
using System.Linq;

public class ChickenHuntPuzzle : MonoBehaviourPunCallbacks, IPuzzleInteractTarget
{
    private sealed class ChickenMoverState
    {
        public ChickenCandidateInteractable Candidate;
        public Transform Transform;
        public Rigidbody Rb;
        public NavMeshAgent Agent;
        public Animator Animator;
        public bool IsReal;
        public Vector3 ManualTarget;
        public float NextRepathTime;
        public Vector3 NetworkTargetPosition;
        public Quaternion NetworkTargetRotation;
        public bool HasNetworkTarget;
        public bool IsRunningAnimation;
    }

    [Header("Reward")]
    [SerializeField] private KeyItemSO keyItemReward;
    [SerializeField] private float rewardDropHeight = 0.45f;

    [Header("Chicken Setup")]
    [SerializeField] private List<ChickenCandidateInteractable> candidates = new List<ChickenCandidateInteractable>();
    [Tooltip("Đã tắt Random. Sẽ tự động tìm con gà không có chữ 'Fake' trong tên làm gà thật.")]
    [SerializeField] private int realChickenIndex = 0;

    [Header("Catch Rules")]
    [SerializeField] private float captureRequired = 1f;
    [SerializeField] private float spacePressContribution = 0.08f;
    [SerializeField] private float captureDistance = 3f;

    [Header("Fake Chicken Alarm")]
    [SerializeField] private float ongKeForceChaseDuration = 12f;
    [SerializeField] private float fakeChickenAlarmCooldown = 1.2f;

    [Header("Real Chicken Movement (Khu vực chuồng)")]
    [SerializeField] private BoxCollider roamAreaBounds; 
    [SerializeField] private float roamSpeed = 1.4f;
    [SerializeField] private float evadeSpeed = 3.8f;
    [SerializeField] private float roamRepathInterval = 2.2f;
    [SerializeField] private float evadeRepathInterval = 0.3f;
    [SerializeField] private float fleeTurnSpeed = 10f;

    [Header("Online Movement Sync")]
    [SerializeField] private bool syncMovementOnline = true;
    [SerializeField] private float movementSyncInterval = 0.08f;
    [SerializeField] private float movementLerpSpeed = 16f;

    [Header("Chicken Animation")]
    [SerializeField] private bool enableChickenAnimation = true;
    [SerializeField] private string idleStateName = "Idle";
    [SerializeField] private string runStateName = "Run";
    [SerializeField] private string runBoolParameter = "IsRun";
    [SerializeField] private string speedFloatParameter = "Speed";
    [SerializeField] private float animationCrossfadeDuration = 0.08f;

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
    private const string RoomKeyRuntimeViewId = "CHH_RuntimeViewId";
    private bool _realChickenIndexSynced;
    private float _nextMovementSyncTime;

    private bool CanUsePhotonRpc => PhotonNetwork.IsConnectedAndReady && photonView != null && photonView.ViewID != 0;

    private void Awake()
    {
        _ongKeMonster = FindObjectOfType<OngKeMonster>();
        EnsureRuntimePhotonViewForOnline();
        InitializeCandidates();
    }

    private void Start()
    {
        EnsureRuntimePhotonViewForOnline();
        SyncRealChickenIndexOnline();
    }

    public override void OnJoinedRoom()
    {
        base.OnJoinedRoom();
        EnsureRuntimePhotonViewForOnline();
        SyncRealChickenIndexOnline();
    }

    public override void OnRoomPropertiesUpdate(Hashtable propertiesThatChanged)
    {
        base.OnRoomPropertiesUpdate(propertiesThatChanged);
        TryApplyRuntimeViewIdFromRoomProps(propertiesThatChanged);
        SyncRealChickenIndexOnline();
    }

    private void EnsureRuntimePhotonViewForOnline()
    {
        if (!PhotonNetwork.IsConnectedAndReady) return;
        PhotonView pv = photonView;
        if (pv == null) pv = GetComponent<PhotonView>();
        if (pv == null) pv = gameObject.AddComponent<PhotonView>();
        if (pv.ViewID > 0) return;

        if (PhotonNetwork.IsMasterClient) {
            if (PhotonNetwork.AllocateViewID(pv)) {
                Hashtable props = new Hashtable { { RoomKeyRuntimeViewId, pv.ViewID } };
                PhotonNetwork.CurrentRoom?.SetCustomProperties(props);
            }
        } else {
            TryApplyRuntimeViewIdFromRoomProps(PhotonNetwork.CurrentRoom?.CustomProperties);
        }
    }

    private void TryApplyRuntimeViewIdFromRoomProps(Hashtable props)
    {
        if (props == null || !props.ContainsKey(RoomKeyRuntimeViewId)) return;
        PhotonView pv = photonView;
        if (pv == null) pv = GetComponent<PhotonView>();
        if (pv == null || pv.ViewID != 0) return;
        int syncedViewId = (int)props[RoomKeyRuntimeViewId];
        if (syncedViewId > 0) pv.ViewID = syncedViewId;
    }

    private void InitializeCandidates()
    {
        _isInitialized = false;
        _realChickenTf = null;
        _movers.Clear();
        _fakeChickens.Clear();

        if (candidates.Count == 0) candidates.AddRange(GetComponentsInChildren<ChickenCandidateInteractable>(true));
        
        if (candidates.Count == 0) {
            for (int i = 0; i < transform.childCount; i++) {
                var candidate = transform.GetChild(i).GetComponent<ChickenCandidateInteractable>();
                if (candidate != null) candidates.Add(candidate);
            }
        }

        if (candidates.Count == 0) return;

        // [SỬA LỖI TẠI ĐÂY]: Quét toàn bộ bầy gà, con nào KHÔNG có chữ "Fake" trong tên thì ÉP CHẾT nó làm gà thật!
        for (int i = 0; i < candidates.Count; i++)
        {
            if (!candidates[i].gameObject.name.ToLower().Contains("fake"))
            {
                realChickenIndex = i;
                break;
            }
        }

        int interactLayer = LayerMask.NameToLayer("Interactable");

        for (int i = 0; i < candidates.Count; i++)
        {
            GameObject chickenGO = candidates[i].gameObject;
            if (interactLayer != -1) chickenGO.layer = interactLayer;

            if (chickenGO.GetComponent<Rigidbody>() == null) {
                Rigidbody rb = chickenGO.AddComponent<Rigidbody>();
                rb.useGravity = true; rb.isKinematic = false;
                rb.angularDamping = 8f; rb.linearDamping = 2f;
                rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationZ;
            }
            
            if (chickenGO.GetComponent<Collider>() == null) {
                BoxCollider col = chickenGO.AddComponent<BoxCollider>();
                col.size = new Vector3(0.5f, 0.5f, 0.5f); col.center = new Vector3(0, 0.25f, 0);
            }

            bool isReal = (i == realChickenIndex);
            candidates[i].Setup(this, i, isReal);
            if (isReal) _realChickenTf = candidates[i].transform;
            else _fakeChickens.Add(candidates[i]);

            _movers.Add(CreateMoverState(candidates[i], isReal));
        }

        _isInitialized = true;
        UpdateUI();
    }

    private void SyncRealChickenIndexOnline()
    {
        if (!_isInitialized || candidates.Count == 0 || _realChickenIndexSynced) return;
        if (!PhotonNetwork.IsConnectedAndReady) {
            _realChickenIndexSynced = true;
            return;
        }

        if (CanUsePhotonRpc && PhotonNetwork.IsMasterClient) {
            photonView.RPC(nameof(SyncRealChickenIndexRPC), RpcTarget.AllBuffered, realChickenIndex);
        }
    }

    [PunRPC]
    private void SyncRealChickenIndexRPC(int syncedIndex)
    {
        realChickenIndex = Mathf.Clamp(syncedIndex, 0, Mathf.Max(0, candidates.Count - 1));
        _realChickenIndexSynced = true;
        InitializeCandidates();
    }

    private void Update()
    {
        if (_isSolved) return;

        bool isOnline = PhotonNetwork.IsConnectedAndReady;
        bool isMasterAuthority = !isOnline || PhotonNetwork.IsMasterClient;

        if (isMasterAuthority) {
            UpdateChickenMovement();
            TryBroadcastChickenMovementSnapshot();
        } else {
            ApplySyncedChickenMovement();
        }
    }

    private ChickenMoverState CreateMoverState(ChickenCandidateInteractable candidate, bool isReal)
    {
        var state = new ChickenMoverState {
            Candidate = candidate, Transform = candidate.transform,
            Rb = candidate.GetComponent<Rigidbody>(), Agent = null,
            Animator = candidate.GetComponentInChildren<Animator>(true), IsReal = isReal,
            ManualTarget = candidate.transform.position, NextRepathTime = 0f,
            NetworkTargetPosition = candidate.transform.position, NetworkTargetRotation = candidate.transform.rotation,
            HasNetworkTarget = false, IsRunningAnimation = false
        };

        state.Rb.useGravity = true; state.Rb.isKinematic = false;
        SetChickenAnimation(state, false);
        return state;
    }

    private void TryBroadcastChickenMovementSnapshot()
    {
        if (!syncMovementOnline || !CanUsePhotonRpc || !PhotonNetwork.IsMasterClient) return;
        if (Time.time < _nextMovementSyncTime) return;
        if (_movers.Count == 0) return;

        float[] snapshot = new float[_movers.Count * 7];
        int cursor = 0;
        for (int i = 0; i < _movers.Count; i++) {
            var mover = _movers[i];
            Vector3 pos = mover != null && mover.Transform != null ? mover.Transform.position : Vector3.zero;
            Quaternion rot = mover != null && mover.Transform != null ? mover.Transform.rotation : Quaternion.identity;
            snapshot[cursor++] = pos.x; snapshot[cursor++] = pos.y; snapshot[cursor++] = pos.z;
            snapshot[cursor++] = rot.x; snapshot[cursor++] = rot.y; snapshot[cursor++] = rot.z; snapshot[cursor++] = rot.w;
        }

        photonView.RPC(nameof(SyncChickenMovementSnapshotRPC), RpcTarget.Others, snapshot);
        _nextMovementSyncTime = Time.time + Mathf.Max(0.02f, movementSyncInterval);
    }

    [PunRPC]
    private void SyncChickenMovementSnapshotRPC(float[] snapshot)
    {
        if (snapshot == null || snapshot.Length == 0 || PhotonNetwork.IsMasterClient) return;
        if (snapshot.Length < _movers.Count * 7) return;

        int cursor = 0;
        for (int i = 0; i < _movers.Count; i++) {
            var mover = _movers[i];
            if (mover == null || mover.Transform == null) { cursor += 7; continue; }
            mover.NetworkTargetPosition = new Vector3(snapshot[cursor], snapshot[cursor + 1], snapshot[cursor + 2]);
            mover.NetworkTargetRotation = new Quaternion(snapshot[cursor + 3], snapshot[cursor + 4], snapshot[cursor + 5], snapshot[cursor + 6]);
            cursor += 7; mover.HasNetworkTarget = true;
        }
    }

    private void ApplySyncedChickenMovement()
    {
        if (_movers.Count == 0) return;
        float t = Mathf.Clamp01(Time.deltaTime * Mathf.Max(1f, movementLerpSpeed));
        for (int i = 0; i < _movers.Count; i++) {
            var mover = _movers[i];
            if (mover == null || mover.Transform == null || !mover.HasNetworkTarget) continue;

            if (mover.Rb != null) { mover.Rb.linearVelocity = Vector3.zero; mover.Rb.angularVelocity = Vector3.zero; }

            mover.Transform.position = Vector3.Lerp(mover.Transform.position, mover.NetworkTargetPosition, t);
            mover.Transform.rotation = Quaternion.Slerp(mover.Transform.rotation, mover.NetworkTargetRotation, t);

            SetChickenAnimation(mover, (mover.NetworkTargetPosition - mover.Transform.position).sqrMagnitude > 0.001f);
        }
    }

    private void UpdateChickenMovement()
    {
        for (int i = 0; i < _movers.Count; i++) {
            ChickenMoverState mover = _movers[i];
            if (mover == null || mover.Transform == null) continue;

            if (_isCatchPhase) {
                if (mover.IsReal) UpdateEvadeMovement(mover);
                else StopMover(mover);
            } else {
                UpdateRoamMovement(mover);
            }
        }
    }

    private void UpdateRoamMovement(ChickenMoverState mover)
    {
        if (mover == null || mover.Transform == null) return;

        if (Time.time >= mover.NextRepathTime || Vector3.Distance(mover.Transform.position, mover.ManualTarget) < 0.35f) {
            mover.ManualTarget = GetRandomPointInBox();
            mover.NextRepathTime = Time.time + Mathf.Max(0.25f, roamRepathInterval);
        }

        MoveMoverTowards(mover, mover.ManualTarget, roamSpeed);
        SetChickenAnimation(mover, (mover.ManualTarget - mover.Transform.position).sqrMagnitude > 0.01f);
    }

    // [GIẢI PHÓNG NAVMESH]: Chỉ cần random điểm trong Box, để Rigidbody tự lo việc đi lại
    private Vector3 GetRandomPointInBox()
    {
        if (roamAreaBounds == null) 
        {
            Vector2 rnd = Random.insideUnitCircle * 5f;
            return transform.position + new Vector3(rnd.x, 0, rnd.y);
        }

        Bounds b = roamAreaBounds.bounds;
        return new Vector3(
            Random.Range(b.min.x, b.max.x),
            b.center.y,
            Random.Range(b.min.z, b.max.z)
        );
    }

    private void UpdateEvadeMovement(ChickenMoverState mover)
    {
        if (mover == null || mover.Transform == null) return;

        Vector3 evadeDir = ComputeFleeDirection(mover.Transform);
        if (evadeDir.sqrMagnitude < 0.001f) return;
        
        Vector3 target = ClampToArena(mover.Transform.position + evadeDir * 4f);
        MoveMoverTowards(mover, target, evadeSpeed);
        SetChickenAnimation(mover, true);
    }

    private void MoveMoverTowards(ChickenMoverState mover, Vector3 target, float moveSpeed)
    {
        if (mover == null || mover.Transform == null) return;
        Vector3 delta = target - mover.Transform.position; delta.y = 0f;
        if (delta.sqrMagnitude < 0.0001f) return;

        Vector3 dir = delta.normalized;
        Vector3 nextPos = ClampToArena(mover.Transform.position + dir * Mathf.Max(0f, moveSpeed) * Time.deltaTime);
        Quaternion lookRot = Quaternion.LookRotation(dir, Vector3.up);
        Quaternion nextRot = Quaternion.Slerp(mover.Transform.rotation, lookRot, fleeTurnSpeed * Time.deltaTime);

        if (mover.Rb != null && !mover.Rb.isKinematic) {
            Vector3 newVel = (nextPos - mover.Transform.position) / Time.deltaTime; newVel.y = mover.Rb.linearVelocity.y;
            mover.Rb.linearVelocity = newVel; mover.Rb.MoveRotation(nextRot);
            return;
        }
        mover.Transform.position = nextPos; mover.Transform.rotation = nextRot;
    }

    private void StopMover(ChickenMoverState mover)
    {
        if (mover == null) return;
        SetChickenAnimation(mover, false);
    }

    private void SetChickenAnimation(ChickenMoverState mover, bool isRunning)
    {
        if (!enableChickenAnimation || mover == null || mover.Animator == null) return;
        Animator animator = mover.Animator;
        if (HasAnimatorParameter(animator, runBoolParameter, AnimatorControllerParameterType.Bool)) animator.SetBool(runBoolParameter, isRunning);
        if (HasAnimatorParameter(animator, speedFloatParameter, AnimatorControllerParameterType.Float)) animator.SetFloat(speedFloatParameter, isRunning ? 1f : 0f);
        if (mover.IsRunningAnimation == isRunning) return;

        string targetState = isRunning ? runStateName : idleStateName;
        if (!string.IsNullOrWhiteSpace(targetState)) {
            if (animator.HasState(0, Animator.StringToHash($"Base Layer.{targetState}"))) animator.CrossFade($"Base Layer.{targetState}", Mathf.Max(0f, animationCrossfadeDuration), 0);
            else if (animator.HasState(0, Animator.StringToHash(targetState))) animator.CrossFade(targetState, Mathf.Max(0f, animationCrossfadeDuration), 0);
        }
        mover.IsRunningAnimation = isRunning;
    }

    private bool HasAnimatorParameter(Animator animator, string parameterName, AnimatorControllerParameterType type)
    {
        if (animator == null || string.IsNullOrWhiteSpace(parameterName)) return false;
        foreach (var p in animator.parameters) if (p.type == type && p.name == parameterName) return true;
        return false;
    }

    public void Interact(GameObject actor)
    {
        if (_isSolved) return;
        if (statusText != null) statusText.text = _isCatchPhase ? "Con ga that dang bo chay! Lai gan va spam F de bat." : "Tim con ga that trong bay ga.";
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
        if (!_isCatchPhase) return "Kiem tra con ga (F)";
        return candidate.IsRealChicken ? "Con ga that! Lai gan va spam F" : "Ga gia";
    }

    public void OnCandidateInteracted(ChickenCandidateInteractable candidate, GameObject actor)
    {
        if (!_isInitialized || _isSolved || candidate == null || actor == null) return;
        PhotonView actorPv = actor.GetComponent<PhotonView>();
        if (actorPv != null && !actorPv.IsMine) return;

        if (!_isCatchPhase) {
            if (!candidate.IsRealChicken) {
                TriggerFakeChickenAlarm(candidate, actor, actorPv);
                if (statusText != null) statusText.text = "Ga gia keu len! Ong Ke dang toi.";
                return;
            }
            if (CanUsePhotonRpc) photonView.RPC(nameof(StartCatchPhaseRPC), RpcTarget.AllBuffered);
            else StartCatchPhaseRPC();
            return;
        }

        if (!candidate.IsRealChicken) {
            TryTriggerFakeAlarmWithCooldown(candidate, actor, actorPv);
            if (statusText != null) statusText.text = "Ga gia keu len! Ong Ke dang toi.";
            return;
        }

        TryAddCaptureProgressByInteract(actor);
        if (statusText != null) statusText.text = "Spam F vao ga that de bat!";
    }

    private void TryAddCaptureProgressByInteract(GameObject actor)
    {
        if (!_isCatchPhase || _realChickenTf == null || actor == null) return;
        int actorNumber = PhotonNetwork.IsConnectedAndReady ? PhotonNetwork.LocalPlayer.ActorNumber : 0;
        PhotonView actorPv = actor.GetComponent<PhotonView>();
        int actorViewId = actorPv != null ? actorPv.ViewID : -1;

        if (CanUsePhotonRpc) photonView.RPC(nameof(AddCaptureProgressRPC), RpcTarget.MasterClient, spacePressContribution, actorNumber, actorViewId);
        else AddCaptureProgressRPC(spacePressContribution, actorNumber, actorViewId);
    }

    private void TryTriggerFakeAlarmWithCooldown(ChickenCandidateInteractable candidate, GameObject actor, PhotonView actorPv)
    {
        if (candidate == null || candidate.IsRealChicken || Time.time < _nextFakeAlarmAllowedTime) return;
        _nextFakeAlarmAllowedTime = Time.time + Mathf.Max(0f, fakeChickenAlarmCooldown);
        TriggerFakeChickenAlarm(candidate, actor, actorPv);
    }

    private void TriggerFakeChickenAlarm(ChickenCandidateInteractable candidate, GameObject actor, PhotonView actorPv)
    {
        int candidateIndex = candidate.CandidateIndex;
        int actorViewId = actorPv != null ? actorPv.ViewID : -1;
        Vector3 alarmPosition = candidate.transform.position;

        if (PhotonNetwork.IsConnectedAndReady) {
            photonView.RPC(nameof(PlayFakeChickenCryRPC), RpcTarget.All, candidateIndex);
            if (PhotonNetwork.IsMasterClient) ForceOngKeFromAlarm(actorViewId, alarmPosition);
            else photonView.RPC(nameof(RequestMasterAlarmRPC), RpcTarget.MasterClient, actorViewId, alarmPosition);
            return;
        }

        candidate.PlayFakeChickenCry();
        ForceOngKeToTarget(actor != null ? actor.transform : null, alarmPosition);
    }

    [PunRPC]
    private void PlayFakeChickenCryRPC(int candidateIndex)
    {
        if (candidateIndex < 0 || candidateIndex >= candidates.Count) return;
        ChickenCandidateInteractable candidate = candidates[candidateIndex];
        if (candidate != null && !candidate.IsRealChicken) candidate.PlayFakeChickenCry();
    }

    [PunRPC]
    private void RequestMasterAlarmRPC(int actorViewId, Vector3 alarmPosition) { if (PhotonNetwork.IsMasterClient) ForceOngKeFromAlarm(actorViewId, alarmPosition); }

    private void ForceOngKeFromAlarm(int actorViewId, Vector3 alarmPosition)
    {
        Transform target = null;
        if (actorViewId > 0) {
            PhotonView view = PhotonView.Find(actorViewId);
            if (view != null) target = view.transform;
        }
        ForceOngKeToTarget(target, alarmPosition);
    }

    private void ForceOngKeToTarget(Transform preferredTarget, Vector3 alarmPosition)
    {
        if (_ongKeMonster == null) _ongKeMonster = FindObjectOfType<OngKeMonster>();
        if (_ongKeMonster == null) return;
        if (preferredTarget != null) _ongKeMonster.ForceChasePlayer(preferredTarget, ongKeForceChaseDuration);
        else _ongKeMonster.OnFakeChickenAlarm(alarmPosition);
    }

    [PunRPC]
    private void StartCatchPhaseRPC()
    {
        if (_isSolved) return;
        _isCatchPhase = true; _captureProgress = 0f; UpdateUI();
        if (statusText != null) statusText.text = "Da tim thay ga that! Ga dang bo chay. Spam F de bat.";
    }

    [PunRPC]
    private void AddCaptureProgressRPC(float amount, int actorNumber, int actorViewId)
    {
        if (_isSolved || !_isCatchPhase || (PhotonNetwork.IsConnectedAndReady && !PhotonNetwork.IsMasterClient)) return;

        if (PhotonNetwork.IsConnectedAndReady) {
            PhotonView actorView = actorViewId > 0 ? PhotonView.Find(actorViewId) : null;
            if (actorView == null || Vector3.Distance(actorView.transform.position, _realChickenTf.position) > captureDistance) return;
        }

        _captureProgress = Mathf.Clamp01(_captureProgress + Mathf.Max(0.001f, amount));
        if (CanUsePhotonRpc) photonView.RPC(nameof(SyncProgressRPC), RpcTarget.Others, _captureProgress);
        else SyncProgressRPC(_captureProgress);

        if (_captureProgress >= captureRequired) {
            _winnerActorNumber = actorNumber;
            if (CanUsePhotonRpc) photonView.RPC(nameof(CompletePuzzleRPC), RpcTarget.AllBuffered, _winnerActorNumber);
            else CompletePuzzleRPC(_winnerActorNumber);
        }
    }

    [PunRPC]
    private void SyncProgressRPC(float progress) { _captureProgress = Mathf.Clamp01(progress); UpdateUI(); }

    [PunRPC]
    private void CompletePuzzleRPC(int winnerActorNumber)
    {
        if (_isSolved) return;
        _isSolved = true; _isCatchPhase = false; _captureProgress = captureRequired; _winnerActorNumber = winnerActorNumber;
        Vector3 rewardSpawnOrigin = _realChickenTf != null ? _realChickenTf.position : transform.position;

        if (realChickenIndex >= 0 && realChickenIndex < candidates.Count) {
            ChickenCandidateInteractable realCandidate = candidates[realChickenIndex];
            if (realCandidate != null) {
                _movers.RemoveAll(m => m.Candidate == realCandidate);
                Destroy(realCandidate.gameObject);
            }
        }

        for (int i = 0; i < _fakeChickens.Count; i++) if (_fakeChickens[i] != null) _fakeChickens[i].enabled = false;

        if (!PhotonNetwork.IsConnectedAndReady || PhotonNetwork.IsMasterClient) SpawnRewardPickup(rewardSpawnOrigin);
        TryGrantRewardToWinnerLocal();

        GameplayEvents.OnPuzzleSolved?.Invoke();
        UpdateUI();
        if (statusText != null) statusText.text = "Da bat duoc ga that!";
    }

    private void SpawnRewardPickup(Vector3 spawnOrigin)
    {
        if (_rewardPickupSpawned) return;
        ItemDataSO rewardItem = keyItemReward;
        if (rewardItem == null) return;

        Vector3 spawnPos = spawnOrigin + Vector3.up * Mathf.Max(0f, rewardDropHeight);
        GameObject pickupGo = null;

        if (rewardItem.itemWorldPrefab != null) {
            if (PhotonNetwork.IsConnectedAndReady) pickupGo = PhotonNetwork.Instantiate(rewardItem.itemWorldPrefab.name, spawnPos, Quaternion.identity);
            else pickupGo = Object.Instantiate(rewardItem.itemWorldPrefab, spawnPos, Quaternion.identity);
        }

        if (pickupGo != null) {
            var pickupScript = pickupGo.GetComponent<KeyItemPickup>();
            if (pickupScript != null) pickupScript.data = rewardItem;
        }
        _rewardPickupSpawned = pickupGo != null;
    }

    private void TryGrantRewardToWinnerLocal()
    {
        if (keyItemReward == null || (PhotonNetwork.IsConnectedAndReady && PhotonNetwork.LocalPlayer.ActorNumber != _winnerActorNumber)) return;
        var inv = InventoryManager.LocalInstance;
        if (inv != null) inv.AddItem(keyItemReward);
    }

    private Vector3 ComputeFleeDirection(Transform fromTransform)
    {
        if (fromTransform == null) return Vector3.zero;
        GameObject[] players = GameObject.FindGameObjectsWithTag("Player");
        if (players == null || players.Length == 0) return fromTransform.forward;

        Vector3 center = Vector3.zero; int count = 0;
        for (int i = 0; i < players.Length; i++) {
            if (players[i] == null || !players[i].activeInHierarchy) continue;
            center += players[i].transform.position; count++;
        }

        if (count == 0) return fromTransform.forward;
        center /= count;
        Vector3 away = (fromTransform.position - center); away.y = 0f;
        return away.sqrMagnitude < 0.001f ? Random.onUnitSphere : away.normalized;
    }

    private Vector3 ClampToArena(Vector3 pos)
    {
        if (roamAreaBounds != null)
        {
            // Ép con gà phải trượt dọc theo thành chuồng nếu nó tông vào vách
            return roamAreaBounds.ClosestPoint(pos);
        }
        return pos;
    }

    private void UpdateUI()
    {
        if (captureProgressSlider != null) {
            captureProgressSlider.gameObject.SetActive(_isCatchPhase || _isSolved);
            captureProgressSlider.value = captureRequired <= 0f ? 0f : Mathf.Clamp01(_captureProgress / captureRequired);
        }
    }
}