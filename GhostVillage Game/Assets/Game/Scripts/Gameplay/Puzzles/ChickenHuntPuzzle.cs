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
#if UNITY_EDITOR
using UnityEditor;
#endif

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
        public List<Vector3> PatrolPoints;
        public int PatrolPointIndex;
        public bool IsRunningAnimation;
    }

    [Header("Reward")]
    [SerializeField] private KeyItemSO keyItemReward;
    [SerializeField] private float rewardDropHeight = 0.45f;
    [SerializeField] private bool useChickenVisualForRewardPickup = true;
    [SerializeField] private string rewardChickenVisualPrefabPath = "chicken_rig";

    [Header("Chicken Setup")]
    [SerializeField] private List<ChickenCandidateInteractable> candidates = new List<ChickenCandidateInteractable>();
    [SerializeField] private bool autoBuildCandidateFlock = false;  // Set to false - use only predefined chickens
    [SerializeField] private bool useDedicatedRealAndFakePrefabs = true;
    [SerializeField] private GameObject realChickenPrefab;
    [SerializeField] private GameObject fakeChickenPrefab;
    [SerializeField] private string defaultRealChickenPrefabPath = "Assets/Game/Prefab/Map/Map_1/Puzzles/Chicken.prefab";
    [SerializeField] private string defaultFakeChickenPrefabPath = "Assets/Game/Prefab/Map/Map_1/Puzzles/ChickenFake.prefab";
    [SerializeField] private int flockSize = 8;
    [SerializeField] private ChickenCandidateInteractable candidateTemplate;
    [SerializeField] private float flockSpawnRadius = 2.5f;
    [SerializeField] private float flockSpawnHeightOffset = 0f;
    [SerializeField] private bool randomizePuzzleSpawnByCoop = true;
    [SerializeField] private string coopSpawnTag = "SP_ChickenCoop";
    [SerializeField] private bool randomizeRealChickenEachMatch = true;
    [SerializeField] private int realChickenIndex = 0;

    [Header("Catch Rules")]
    [SerializeField] private float captureRequired = 1f;
    [SerializeField] private float spacePressContribution = 0.08f;
    [SerializeField] private float captureDistance = 3f;

    [Header("Fake Chicken Alarm")]
    [SerializeField] private float ongKeForceChaseDuration = 12f;
    [SerializeField] private float fakeChickenAlarmCooldown = 1.2f;

    [Header("Real Chicken Movement")]
    [SerializeField] private bool useNavMeshForRealChicken = false;
    [SerializeField] private float centerRoamRadius = 3.5f;
    [SerializeField] private float roamSpeed = 1.4f;
    [SerializeField] private float evadeSpeed = 3.8f;
    [SerializeField] private float roamRepathInterval = 2.2f;
    [SerializeField] private float evadeRepathInterval = 0.3f;
    [SerializeField] private float fleeTurnSpeed = 10f;
    [SerializeField] private Transform arenaCenter;
    [SerializeField] private float arenaRadius = 10f;
    [SerializeField] private float coopRoamRadius = 10f;

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
    [SerializeField] private float animationMoveThreshold = 0.05f;
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
    private bool _spawnPointSynced;
    private bool _realChickenIndexSynced;
    private float _nextMovementSyncTime;
    private bool _flockPrepared;

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
        SyncSpawnPointOnline();
        SyncRealChickenIndexOnline();
    }

    public override void OnJoinedRoom()
    {
        base.OnJoinedRoom();
        EnsureRuntimePhotonViewForOnline();
        SyncSpawnPointOnline();
        SyncRealChickenIndexOnline();
    }

    public override void OnRoomPropertiesUpdate(Hashtable propertiesThatChanged)
    {
        base.OnRoomPropertiesUpdate(propertiesThatChanged);
        TryApplyRuntimeViewIdFromRoomProps(propertiesThatChanged);
        SyncSpawnPointOnline();
        SyncRealChickenIndexOnline();
    }

    private void EnsureRuntimePhotonViewForOnline()
    {
        if (!PhotonNetwork.IsConnectedAndReady)
        {
            return;
        }

        PhotonView pv = photonView;
        if (pv == null)
        {
            pv = GetComponent<PhotonView>();
        }

        if (pv == null)
        {
            pv = gameObject.AddComponent<PhotonView>();
        }

        if (pv.ViewID > 0)
        {
            return;
        }

        if (PhotonNetwork.IsMasterClient)
        {
            if (PhotonNetwork.AllocateViewID(pv))
            {
                Hashtable props = new Hashtable
                {
                    { RoomKeyRuntimeViewId, pv.ViewID }
                };
                PhotonNetwork.CurrentRoom?.SetCustomProperties(props);
            }
            else
            {
                Debug.LogWarning("[ChickenHunt] Failed to allocate runtime PhotonView ID.");
            }
        }
        else
        {
            TryApplyRuntimeViewIdFromRoomProps(PhotonNetwork.CurrentRoom?.CustomProperties);
        }
    }

    private void TryApplyRuntimeViewIdFromRoomProps(Hashtable props)
    {
        if (props == null || !props.ContainsKey(RoomKeyRuntimeViewId))
        {
            return;
        }

        PhotonView pv = photonView;
        if (pv == null)
        {
            pv = GetComponent<PhotonView>();
        }

        if (pv == null)
        {
            return;
        }

        if (pv.ViewID != 0)
        {
            return;
        }

        int syncedViewId = (int)props[RoomKeyRuntimeViewId];
        if (syncedViewId > 0)
        {
            pv.ViewID = syncedViewId;
        }
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
        _fakeChickens.Clear();

        // NOTE: PrepareCandidateFlockIfNeeded() is skipped - use predefined chickens from scene only
        // PrepareCandidateFlockIfNeeded();

        // Get all ChickenCandidateInteractable components that are already placed in the scene
        if (candidates.Count == 0)
        {
            candidates.AddRange(GetComponentsInChildren<ChickenCandidateInteractable>(true));
        }

        // If still not found, manually search children transforms (fallback for prefab initialization timing issues)
        if (candidates.Count == 0)
        {
            Debug.Log("[ChickenHunt] GetComponentsInChildren returned 0, searching manually through children...");
            for (int i = 0; i < transform.childCount; i++)
            {
                var child = transform.GetChild(i);
                var candidate = child.GetComponent<ChickenCandidateInteractable>();
                if (candidate != null)
                {
                    candidates.Add(candidate);
                }
            }
        }

        if (candidates.Count == 0)
        {
            Debug.LogWarning($"[ChickenHunt] No chicken candidates found in scene. Searched {transform.childCount} children manually. Please ensure chickens have ChickenCandidateInteractable component.");
            return;
        }

        Debug.Log($"[ChickenHunt] Found {candidates.Count} chickens in scene");

        // Ensure all chickens have necessary components (Rigidbody for physics)
        for (int i = 0; i < candidates.Count; i++)
        {
            GameObject chickenGO = candidates[i].gameObject;
            
            // Add Rigidbody if missing
            if (chickenGO.GetComponent<Rigidbody>() == null)
            {
                Rigidbody rb = chickenGO.AddComponent<Rigidbody>();
                rb.useGravity = true;
                rb.isKinematic = false;
                rb.angularDamping = 8f;
                rb.linearDamping = 2f;
                rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationZ;
                Debug.Log($"[ChickenHunt] Added Rigidbody to {chickenGO.name}");
            }
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
            else
            {
                _fakeChickens.Add(candidate);
            }

            _movers.Add(CreateMoverState(candidate, isReal));
        }

        EnsureMovementCenterDefaults();

        _isInitialized = true;
        UpdateUI();
    }

    // Removed PrepareCandidateFlockIfNeeded() and TryBuildFlockFromDedicatedPrefabs()
    // These methods are no longer needed - we now use only predefined chickens placed in the scene

    // Removed EnsureCandidateInteractable() - no longer needed, chickens are predefined in scene

    // Removed RepositionFlockDeterministically() - not needed for predefined chickens

    private void SyncRealChickenIndexOnline()
    {
        if (!_isInitialized || candidates.Count == 0 || _realChickenIndexSynced)
        {
            return;
        }

        if (!PhotonNetwork.IsConnectedAndReady)
        {
            if (randomizeRealChickenEachMatch)
            {
                realChickenIndex = Random.Range(0, candidates.Count);
                InitializeCandidates();
            }

            _realChickenIndexSynced = true;
            return;
        }

        if (!CanUsePhotonRpc)
        {
            return;
        }

        if (PhotonNetwork.IsMasterClient)
        {
            int chosenIndex = randomizeRealChickenEachMatch
                ? Random.Range(0, candidates.Count)
                : Mathf.Clamp(realChickenIndex, 0, candidates.Count - 1);

            photonView.RPC(nameof(SyncRealChickenIndexRPC), RpcTarget.AllBuffered, chosenIndex);
        }
    }

    private void SyncSpawnPointOnline()
    {
        if (!_isInitialized || _spawnPointSynced || !randomizePuzzleSpawnByCoop)
        {
            return;
        }

        List<Transform> coopPoints = ResolveCoopSpawnPoints();
        if (coopPoints.Count == 0)
        {
            _spawnPointSynced = true;
            return;
        }

        if (!PhotonNetwork.IsConnectedAndReady)
        {
            int offlineIndex = Random.Range(0, coopPoints.Count);
            SyncSpawnPointRPC(offlineIndex);
            return;
        }

        if (!CanUsePhotonRpc)
        {
            return;
        }

        if (PhotonNetwork.IsMasterClient)
        {
            int selectedIndex = Random.Range(0, coopPoints.Count);
            photonView.RPC(nameof(SyncSpawnPointRPC), RpcTarget.AllBuffered, selectedIndex);
        }
    }

    [PunRPC]
    private void SyncSpawnPointRPC(int selectedIndex)
    {
        List<Transform> coopPoints = ResolveCoopSpawnPoints();
        if (coopPoints.Count == 0)
        {
            _spawnPointSynced = true;
            return;
        }

        int clampedIndex = Mathf.Clamp(selectedIndex, 0, coopPoints.Count - 1);
        Transform targetPoint = coopPoints[clampedIndex];
        if (targetPoint != null)
        {
            transform.SetPositionAndRotation(targetPoint.position, targetPoint.rotation);
        }

        _spawnPointSynced = true;
        InitializeCandidates();
    }

    private List<Transform> ResolveCoopSpawnPoints()
    {
        GameObject[] coopObjects = GameObject.FindGameObjectsWithTag(coopSpawnTag);
        if (coopObjects == null || coopObjects.Length == 0)
        {
            return new List<Transform>();
        }

        return coopObjects
            .Where(x => x != null)
            .OrderBy(x => x.name)
            .ThenBy(x => x.transform.position.x)
            .ThenBy(x => x.transform.position.z)
            .Select(x => x.transform)
            .ToList();
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

        if (isMasterAuthority)
        {
            UpdateChickenMovement();
            TryBroadcastChickenMovementSnapshot();
        }
        else
        {
            ApplySyncedChickenMovement();
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
            Animator = candidate.GetComponentInChildren<Animator>(true),
            IsReal = isReal,
            ManualTarget = candidate.transform.position,
            NextRepathTime = 0f,
            NetworkTargetPosition = candidate.transform.position,
            NetworkTargetRotation = candidate.transform.rotation,
            HasNetworkTarget = false,
            IsRunningAnimation = false
        };

        if (state.Rb == null)
        {
            state.Rb = candidate.gameObject.AddComponent<Rigidbody>();
        }

        state.Rb.useGravity = false;
        state.Rb.angularDamping = 8f;
        state.Rb.linearDamping = 2f;
        state.Rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationZ;
        state.Rb.isKinematic = false;

        // All chickens use manual script movement for consistency
        // Real chicken uses NavMesh ONLY if enabled via flag AND isReal
        if (isReal && useNavMeshForRealChicken)
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

            // NavMesh controls movement, physics just for collision
            state.Rb.isKinematic = true;
            Debug.Log($"[ChickenHunt] Real chicken using NavMesh movement");
        }
        else
        {
            // All fake chickens + real chicken (if useNavMeshForRealChicken=false) use script-based movement
            state.Rb.useGravity = true;  // Enable gravity for realistic falling
            state.Rb.isKinematic = false; // Physics collision enabled
            
            if (isReal)
            {
                Debug.Log($"[ChickenHunt] Real chicken using manual script movement");
            }
        }

        state.PatrolPoints = BuildPatrolPoints(candidate.transform.position, Mathf.Max(1f, coopRoamRadius * 0.6f));
        state.PatrolPointIndex = 0;
        SetChickenAnimation(state, false);

        return state;
    }

    private void TryBroadcastChickenMovementSnapshot()
    {
        if (!syncMovementOnline || !CanUsePhotonRpc || !PhotonNetwork.IsMasterClient)
        {
            return;
        }

        if (Time.time < _nextMovementSyncTime)
        {
            return;
        }

        if (_movers.Count == 0)
        {
            return;
        }

        float[] snapshot = new float[_movers.Count * 7];
        int cursor = 0;
        for (int i = 0; i < _movers.Count; i++)
        {
            var mover = _movers[i];
            Vector3 pos = mover != null && mover.Transform != null ? mover.Transform.position : Vector3.zero;
            Quaternion rot = mover != null && mover.Transform != null ? mover.Transform.rotation : Quaternion.identity;

            snapshot[cursor++] = pos.x;
            snapshot[cursor++] = pos.y;
            snapshot[cursor++] = pos.z;
            snapshot[cursor++] = rot.x;
            snapshot[cursor++] = rot.y;
            snapshot[cursor++] = rot.z;
            snapshot[cursor++] = rot.w;
        }

        photonView.RPC(nameof(SyncChickenMovementSnapshotRPC), RpcTarget.Others, snapshot);
        _nextMovementSyncTime = Time.time + Mathf.Max(0.02f, movementSyncInterval);
    }

    [PunRPC]
    private void SyncChickenMovementSnapshotRPC(float[] snapshot)
    {
        if (snapshot == null || snapshot.Length == 0)
        {
            return;
        }

        if (!PhotonNetwork.IsConnectedAndReady || PhotonNetwork.IsMasterClient)
        {
            return;
        }

        int expected = _movers.Count * 7;
        if (expected <= 0 || snapshot.Length < expected)
        {
            return;
        }

        int cursor = 0;
        for (int i = 0; i < _movers.Count; i++)
        {
            var mover = _movers[i];
            if (mover == null || mover.Transform == null)
            {
                cursor += 7;
                continue;
            }

            Vector3 pos = new Vector3(snapshot[cursor], snapshot[cursor + 1], snapshot[cursor + 2]);
            Quaternion rot = new Quaternion(snapshot[cursor + 3], snapshot[cursor + 4], snapshot[cursor + 5], snapshot[cursor + 6]);
            cursor += 7;

            mover.NetworkTargetPosition = pos;
            mover.NetworkTargetRotation = rot;
            mover.HasNetworkTarget = true;
        }
    }

    private void ApplySyncedChickenMovement()
    {
        if (_movers.Count == 0)
        {
            return;
        }

        float t = Mathf.Clamp01(Time.deltaTime * Mathf.Max(1f, movementLerpSpeed));
        for (int i = 0; i < _movers.Count; i++)
        {
            var mover = _movers[i];
            if (mover == null || mover.Transform == null || !mover.HasNetworkTarget)
            {
                continue;
            }

            if (mover.Agent != null && mover.Agent.isOnNavMesh)
            {
                mover.Agent.ResetPath();
            }

            if (mover.Rb != null)
            {
                mover.Rb.linearVelocity = Vector3.zero;
                mover.Rb.angularVelocity = Vector3.zero;
            }

            mover.Transform.position = Vector3.Lerp(mover.Transform.position, mover.NetworkTargetPosition, t);
            mover.Transform.rotation = Quaternion.Slerp(mover.Transform.rotation, mover.NetworkTargetRotation, t);

            bool isMoving = (mover.NetworkTargetPosition - mover.Transform.position).sqrMagnitude
                > animationMoveThreshold * animationMoveThreshold;
            SetChickenAnimation(mover, isMoving);
        }
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

        if (mover.PatrolPoints == null || mover.PatrolPoints.Count == 0)
        {
            mover.PatrolPoints = BuildPatrolPoints(mover.Transform.position, Mathf.Max(1f, coopRoamRadius * 0.6f));
            mover.PatrolPointIndex = 0;
        }

        if (mover.Agent != null && mover.Agent.isOnNavMesh)
        {
            mover.Agent.speed = roamSpeed;

            bool shouldPickNewDestination = Time.time >= mover.NextRepathTime
                || !mover.Agent.hasPath
                || mover.Agent.remainingDistance <= (mover.Agent.stoppingDistance + 0.15f);

            if (shouldPickNewDestination)
            {
                if (TryGetNextPatrolPoint(mover, out Vector3 roamTarget))
                {
                    mover.Agent.SetDestination(roamTarget);
                }

                mover.NextRepathTime = Time.time + Mathf.Max(0.2f, roamRepathInterval);
            }

            bool isMoving = mover.Agent.hasPath
                && mover.Agent.velocity.sqrMagnitude > animationMoveThreshold * animationMoveThreshold;
            SetChickenAnimation(mover, isMoving);

            return;
        }

        // For manual movement: check for obstacles ahead
        if (Time.time >= mover.NextRepathTime || Vector3.Distance(mover.Transform.position, mover.ManualTarget) < 0.35f)
        {
            if (!TryGetNextPatrolPoint(mover, out Vector3 manualTarget))
            {
                Vector3 roamCenter = arenaCenter != null ? arenaCenter.position : transform.position;
                Vector2 random2D = Random.insideUnitCircle * Mathf.Max(1f, coopRoamRadius);
                manualTarget = ClampToArena(roamCenter + new Vector3(random2D.x, 0f, random2D.y));
            }

            mover.ManualTarget = manualTarget;
            mover.NextRepathTime = Time.time + Mathf.Max(0.25f, roamRepathInterval);
        }

        // Check for obstacles ahead using raycast
        Vector3 dirToTarget = (mover.ManualTarget - mover.Transform.position).normalized;
        if (CheckObstacleAhead(mover, dirToTarget, 1.5f))
        {
            // Obstacle detected - pick new patrol point
            Debug.Log($"[Chicken] Obstacle detected ahead, picking new patrol point");
            mover.NextRepathTime = 0f; // Force repath immediately
            return;
        }

        MoveMoverTowards(mover, mover.ManualTarget, roamSpeed);
        bool manualMoving = (mover.ManualTarget - mover.Transform.position).sqrMagnitude
            > animationMoveThreshold * animationMoveThreshold;
        SetChickenAnimation(mover, manualMoving);
    }

    private bool TryGetNextPatrolPoint(ChickenMoverState mover, out Vector3 patrolPoint)
    {
        patrolPoint = Vector3.zero;

        if (mover == null || mover.PatrolPoints == null || mover.PatrolPoints.Count == 0)
        {
            Debug.LogWarning("[ChickenHunt] No patrol points available!");
            return false;
        }

        int count = mover.PatrolPoints.Count;
        for (int attempt = 0; attempt < count; attempt++)
        {
            int index = (mover.PatrolPointIndex + attempt) % count;
            Vector3 candidate = mover.PatrolPoints[index];

            if (TryGetNavMeshPointNear(candidate, 2.5f, out Vector3 navTarget))
            {
                mover.PatrolPointIndex = (index + 1) % count;
                patrolPoint = navTarget;
                Debug.Log($"[ChickenHunt] Using patrol point: {navTarget}");
                return true;
            }
            else
            {
                Debug.LogWarning($"[ChickenHunt] Candidate {candidate} not on NavMesh, trying next...");
            }
        }

        Debug.LogError($"[ChickenHunt] Failed to find ANY valid patrol point!");
        return false;
    }

    private List<Vector3> BuildPatrolPoints(Vector3 center, float radius)
    {
        float actualRadius = Mathf.Max(0.5f, centerRoamRadius);
        Vector3 baseCenter = arenaCenter != null ? arenaCenter.position : center;

        List<Vector3> points = new List<Vector3>();
        
        // Generate 4 cardinal waypoints around center
        Vector3[] candidatePoints = new Vector3[]
        {
            baseCenter + new Vector3( actualRadius, 0f,  0f),
            baseCenter + new Vector3( 0f, 0f,  actualRadius),
            baseCenter + new Vector3(-actualRadius, 0f,  0f),
            baseCenter + new Vector3( 0f, 0f, -actualRadius),
        };

        // Validate each candidate to ensure it's on NavMesh
        foreach (Vector3 candidate in candidatePoints)
        {
            Vector3 clamped = ClampToArena(candidate);
            
            // Check if this point is reachable on NavMesh
            if (NavMesh.SamplePosition(clamped, out NavMeshHit hit, 2f, NavMesh.AllAreas))
            {
                points.Add(hit.position);
                Debug.Log($"[ChickenHunt] Valid patrol point: {hit.position}");
            }
            else
            {
                Debug.LogWarning($"[ChickenHunt] Point {clamped} NOT on NavMesh! Skipping.");
                // Use center + small offset as fallback
                if (NavMesh.SamplePosition(baseCenter, out NavMeshHit centerHit, 3f, NavMesh.AllAreas))
                {
                    points.Add(centerHit.position);
                }
            }
        }

        if (points.Count == 0)
        {
            Debug.LogError("[ChickenHunt] No valid patrol points! Using center only.");
            if (NavMesh.SamplePosition(baseCenter, out NavMeshHit fallback, 3f, NavMesh.AllAreas))
            {
                points.Add(fallback.position);
            }
        }

        return points;
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

            bool isMoving = mover.Agent.hasPath
                && mover.Agent.velocity.sqrMagnitude > animationMoveThreshold * animationMoveThreshold;
            SetChickenAnimation(mover, isMoving);

            return;
        }

        Vector3 evadeDir = ComputeFleeDirection(mover.Transform);
        if (evadeDir.sqrMagnitude < 0.001f) return;

        Vector3 target = mover.Transform.position + evadeDir * Mathf.Max(3f, coopRoamRadius * 0.7f);
        target = ClampToArena(target);
        MoveMoverTowards(mover, target, evadeSpeed);
        SetChickenAnimation(mover, true);
    }

    private void MoveMoverTowards(ChickenMoverState mover, Vector3 target, float moveSpeed)
    {
        if (mover == null || mover.Transform == null) return;

        Vector3 delta = target - mover.Transform.position;
        delta.y = 0f;  // Keep Y from gravity
        if (delta.sqrMagnitude < 0.0001f) return;

        Vector3 dir = delta.normalized;
        Vector3 nextPos = mover.Transform.position + dir * Mathf.Max(0f, moveSpeed) * Time.deltaTime;
        nextPos = ClampToArena(nextPos);

        Quaternion lookRot = Quaternion.LookRotation(dir, Vector3.up);
        Quaternion nextRot = Quaternion.Slerp(mover.Transform.rotation, lookRot, fleeTurnSpeed * Time.deltaTime);

        if (mover.Rb != null && !mover.Rb.isKinematic)
        {
            // Use physics for horizontal movement only, let gravity handle Y
            Vector3 currentVel = mover.Rb.linearVelocity;
            Vector3 newVel = (nextPos - mover.Transform.position) / Time.deltaTime;
            newVel.y = currentVel.y;  // Preserve gravity velocity
            
            mover.Rb.linearVelocity = newVel;
            mover.Rb.MoveRotation(nextRot);
            return;
        }

        mover.Transform.position = nextPos;
        mover.Transform.rotation = nextRot;
    }

    private void DisableChickenCollisions(ChickenCandidateInteractable candidate)
    {
        // Removed - now allowing physics collisions between chickens
    }

    private void StopMover(ChickenMoverState mover)
    {
        if (mover == null) return;

        if (mover.Agent != null && mover.Agent.isOnNavMesh)
        {
            mover.Agent.ResetPath();
        }

        SetChickenAnimation(mover, false);
    }

    /// <summary>
    /// Check if there's an obstacle ahead using raycast
    /// </summary>
    private bool CheckObstacleAhead(ChickenMoverState mover, Vector3 direction, float checkDistance)
    {
        if (mover == null || mover.Transform == null) return false;

        Vector3 rayStart = mover.Transform.position + Vector3.up * 0.3f;
        LayerMask obstacleMask = LayerMask.GetMask("Wall", "Boundary", "Default");

        if (Physics.Raycast(rayStart, direction, out RaycastHit hit, checkDistance, obstacleMask, QueryTriggerInteraction.Ignore))
        {
            Debug.DrawLine(rayStart, hit.point, Color.red, 0.1f);
            Debug.Log($"[Chicken] Raycast HIT obstacle '{hit.collider.name}' at distance {hit.distance:F2}m");
            return true;
        }

        Debug.DrawRay(rayStart, direction * checkDistance, Color.green, 0.05f);
        return false;
    }

    private void SetChickenAnimation(ChickenMoverState mover, bool isRunning)
    {
        if (!enableChickenAnimation || mover == null || mover.Animator == null)
        {
            return;
        }

        Animator animator = mover.Animator;

        if (HasAnimatorParameter(animator, runBoolParameter, AnimatorControllerParameterType.Bool))
        {
            animator.SetBool(runBoolParameter, isRunning);
        }

        if (HasAnimatorParameter(animator, speedFloatParameter, AnimatorControllerParameterType.Float))
        {
            animator.SetFloat(speedFloatParameter, isRunning ? 1f : 0f);
        }

        if (mover.IsRunningAnimation == isRunning)
        {
            return;
        }

        string targetState = isRunning ? runStateName : idleStateName;
        if (string.IsNullOrWhiteSpace(targetState))
        {
            mover.IsRunningAnimation = isRunning;
            return;
        }

        string fullPath = $"Base Layer.{targetState}";
        int fullHash = Animator.StringToHash(fullPath);
        int shortHash = Animator.StringToHash(targetState);

        if (animator.HasState(0, fullHash))
        {
            animator.CrossFade(fullPath, Mathf.Max(0f, animationCrossfadeDuration), 0);
        }
        else if (animator.HasState(0, shortHash))
        {
            animator.CrossFade(targetState, Mathf.Max(0f, animationCrossfadeDuration), 0);
        }

        mover.IsRunningAnimation = isRunning;
    }

    private bool HasAnimatorParameter(Animator animator, string parameterName, AnimatorControllerParameterType type)
    {
        if (animator == null || string.IsNullOrWhiteSpace(parameterName))
        {
            return false;
        }

        AnimatorControllerParameter[] parameters = animator.parameters;
        for (int i = 0; i < parameters.Length; i++)
        {
            if (parameters[i].type == type && parameters[i].name == parameterName)
            {
                return true;
            }
        }

        return false;
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

        int actorNumber = PhotonNetwork.IsConnectedAndReady ? PhotonNetwork.LocalPlayer.ActorNumber : 0;
        PhotonView actorPv = actor.GetComponent<PhotonView>();
        int actorViewId = actorPv != null ? actorPv.ViewID : -1;
        Debug.Log($"[ChickenHunt]  Adding capture progress, actor: {actorNumber}");

        if (CanUsePhotonRpc)
        {
            photonView.RPC(nameof(AddCaptureProgressRPC), RpcTarget.MasterClient, spacePressContribution, actorNumber, actorViewId);
        }
        else
        {
            AddCaptureProgressRPC(spacePressContribution, actorNumber, actorViewId);
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
    private void AddCaptureProgressRPC(float amount, int actorNumber, int actorViewId)
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

        if (PhotonNetwork.IsConnectedAndReady)
        {
            PhotonView actorView = actorViewId > 0 ? PhotonView.Find(actorViewId) : null;
            if (actorView == null)
            {
                Debug.LogWarning("[ChickenHunt] AddCaptureProgressRPC rejected: actor view not found on master.");
                return;
            }

            float masterDistance = Vector3.Distance(actorView.transform.position, _realChickenTf.position);
            if (masterDistance > captureDistance)
            {
                Debug.Log($"[ChickenHunt] AddCaptureProgressRPC rejected: master distance {masterDistance:F2} > {captureDistance:F2}");
                return;
            }
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
            for (int i = 0; i < inv.items.Length; i++)
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
        if (realChickenPrefab == null && !string.IsNullOrWhiteSpace(defaultRealChickenPrefabPath))
        {
            realChickenPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(defaultRealChickenPrefabPath);
        }

        if (fakeChickenPrefab == null && !string.IsNullOrWhiteSpace(defaultFakeChickenPrefabPath))
        {
            fakeChickenPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(defaultFakeChickenPrefabPath);
        }

        if (flockSize < 1) flockSize = 1;
        if (flockSpawnRadius < 0.5f) flockSpawnRadius = 0.5f;
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
        if (animationMoveThreshold < 0.005f) animationMoveThreshold = 0.005f;
        if (animationCrossfadeDuration < 0f) animationCrossfadeDuration = 0f;
    }
#endif
}
