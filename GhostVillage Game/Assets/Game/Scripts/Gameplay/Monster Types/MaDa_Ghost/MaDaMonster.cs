using UnityEngine;
using Photon.Pun;
using GhostVillage.Gameplay.Base;
using GhostVillage.Gameplay.Shared;
using Game.Scripts.Gameplay.Core;
using Game.Scripts.Core.Game;
using System.Linq;
using System.Collections; // Cần cái này để xài IEnumerator

namespace GhostVillage.Gameplay.Monsters.Mada
{
    public enum MaDaStateType { None, Patrol, Chase, Investigate, Frenzy, Teleporting, Jumpscare }

    [RequireComponent(typeof(PhotonView))]
    public class MaDaMonster : MonsterBase
    {
        [Header("--- Ma Da Movement ---")]
        [SerializeField] private Transform[] patrolWaypoints;
        [SerializeField] private float walkSpeed = 1f;
        [SerializeField] private float runSpeed = 1.5f;
        [SerializeField] private float chaseLoseRange = 25f;

        [Header("--- Animator & Audio ---")]
        [SerializeField] private Animator _animator;

        // Không dùng AudioClip cứng nữa, chỉ cần AudioSource để phát nhạc mượn từ Manager
        private AudioSource _audioSource;

        private MaDaStateType currentStateType = MaDaStateType.None;

        // Các State
        private PatrolState patrolState;
        private ChaseState chaseState;
        private InvestigateState investigateState;
        private MaDaJumpscareState jumpscareState;

        private PhotonView _pv;
        private bool isEscapePhase = false;

        protected override void Awake()
        {
            base.Awake();
            _pv = GetComponent<PhotonView>();
            monsterName = "Ma Da Boss";

            if (_animator == null) _animator = GetComponentInChildren<Animator>();

            _audioSource = GetComponent<AudioSource>();
            if (_audioSource == null) _audioSource = gameObject.AddComponent<AudioSource>();

            if (navMeshAgent != null)
            {
                navMeshAgent.stoppingDistance = 0f;
                navMeshAgent.autoBraking = false;
            }
        }

        private void Start()
        {
            if (!PhotonNetwork.IsMasterClient) return;

            // ==========================================
            // QUÁI TỰ ĐỘNG TÌM WAYPOINT TRÊN BẢN ĐỒ
            // ==========================================
            GameObject[] wpObjects = GameObject.FindGameObjectsWithTag("WayPoint");
            if (wpObjects != null && wpObjects.Length > 0)
            {
                patrolWaypoints = wpObjects.Select(go => go.transform).ToArray();
            }

            // Khởi tạo State
            if (patrolWaypoints != null && patrolWaypoints.Length > 0)
            {
                Vector3[] points = System.Array.ConvertAll(patrolWaypoints, t => t.position);
                patrolState = new PatrolState(this, points);
            }
            else
            {
                patrolState = new PatrolState(this, new Vector3[] { transform.position });
            }

            chaseState = new ChaseState(this, 0f, chaseLoseRange);
            ChangeStateType(MaDaStateType.Patrol);
        }

        private void OnEnable()
        {
            GameplayEvents.OnGameStateChanged += HandleGameStateChanged;
            GameplayEvents.OnWrongPuzzlePenalty += HandleTeleportRequest;
            MonsterEvents.OnPlayerSpotted += HandleMinionAlert;
        }

        private void OnDisable()
        {
            GameplayEvents.OnGameStateChanged -= HandleGameStateChanged;
            GameplayEvents.OnWrongPuzzlePenalty -= HandleTeleportRequest;
            MonsterEvents.OnPlayerSpotted -= HandleMinionAlert;
        }

        private void HandleMinionAlert(Vector3 targetPos)
        {
            if (!PhotonNetwork.IsMasterClient) return;

            // Bận rượt, cuồng nộ, vồ người hoặc đang lặn thì lờ đi
            if (currentStateType == MaDaStateType.Chase ||
                currentStateType == MaDaStateType.Frenzy ||
                currentStateType == MaDaStateType.Jumpscare ||
                currentStateType == MaDaStateType.Teleporting)
            {
                return;
            }

            GameObject[] puddles = GameObject.FindGameObjectsWithTag("Puddle");
            Vector3 bestPuddlePos = targetPos;

            float distToTarget = Vector3.Distance(transform.position, targetPos);
            float distToPuddle = float.MaxValue;

            if (puddles != null && puddles.Length > 0)
            {
                var closestPuddle = puddles.OrderBy(p => Vector3.Distance(targetPos, p.transform.position)).First();
                bestPuddlePos = closestPuddle.transform.position;
                distToPuddle = Vector3.Distance(transform.position, bestPuddlePos);
            }

            // Nếu khoảng cách từ Boss đến người chơi GẦN HƠN khoảng cách từ Boss đến vũng nước -> Đi bộ ra táng luôn
            if (distToTarget <= distToPuddle || puddles == null || puddles.Length == 0)
            {
                Debug.Log($"<color=cyan>[Ma Da]</color> Gần quá đéo thèm lặn, lết bộ ra đập luôn!");
                ChangeStateType(MaDaStateType.Investigate, targetPos);
            }
            else
            {
                Debug.Log($"<color=cyan>[Ma Da]</color> Xa quá, lặn qua vũng nước {bestPuddlePos} cho lẹ!");
                _pv.RPC(nameof(RpcDoTeleportSequence), RpcTarget.All, bestPuddlePos);
            }
        }


        private void HandleGameStateChanged(GameState state)
        {
            if (!PhotonNetwork.IsMasterClient) return;
            if (state == GameState.EscapePhase)
            {
                isEscapePhase = true;
                ChangeStateType(MaDaStateType.Frenzy);
            }
        }

        // ==========================================
        // GIAI ĐOẠN 3: KỸ NĂNG TELEPORT & SINK (TÍCH HỢP TRỰC TIẾP)
        // ==========================================
        public void HandleTeleportRequest(Vector3 targetPos)
        {
            if (!PhotonNetwork.IsMasterClient) return;

            // Đang rượt, cuồng nộ, xé xác hoặc đang lặn thì lờ đi
            if (currentStateType == MaDaStateType.Chase ||
                currentStateType == MaDaStateType.Frenzy ||
                currentStateType == MaDaStateType.Jumpscare ||
                currentStateType == MaDaStateType.Teleporting)
            {
                return;
            }

            Debug.Log($"<color=cyan>[Ma Da]</color> Nhận lệnh hú! Tìm vũng nước gần {targetPos} nhất...");

            // 1. Quét tìm vũng nước (Tag "Puddle") gần mục tiêu nhất
            Vector3 bestPuddlePos = targetPos;
            GameObject[] puddles = GameObject.FindGameObjectsWithTag("Puddle");

            if (puddles != null && puddles.Length > 0)
            {
                bestPuddlePos = puddles.OrderBy(p => Vector3.Distance(targetPos, p.transform.position)).First().transform.position;
            }

            // 2. Bắn lệnh RPC cho toàn bộ Client cùng xem cảnh lặn/trồi
            _pv.RPC(nameof(RpcDoTeleportSequence), RpcTarget.All, bestPuddlePos);
        }

        [PunRPC]
        private void RpcDoTeleportSequence(Vector3 newPuddlePos)
        {
            StartCoroutine(TeleportRoutine(newPuddlePos));
        }

        public Animator GetAnimator() => _animator;
        public void PlayMonsterAudio(string audioID, bool loop)
        {
            if (_audioSource == null) return;

            GameAudioManager audioManager = Object.FindFirstObjectByType<GameAudioManager>();
            if (audioManager == null) return;

            AudioClip clip = audioManager.GetClip(audioID);
            if (clip != null)
            {
                _audioSource.loop = loop;
                if (loop)
                {
                    _audioSource.clip = clip;
                    _audioSource.Play();
                }
                else
                {
                    _audioSource.PlayOneShot(clip);
                }
            }
        }

        private IEnumerator TeleportRoutine(Vector3 newPuddlePos)
        {
            // 1. KHÓA STATE, DỪNG LẠI (IDLE)
            currentStateType = MaDaStateType.Teleporting;

            if (PhotonNetwork.IsMasterClient)
            {
                currentState?.Exit();
                currentState = null;
                Stop(); // Dừng NavMeshAgent
            }

            // Ép quái đứng yên, tắt AI
            if (navMeshAgent != null) navMeshAgent.enabled = false;

            // Tắt Collider để không cản đường player lúc lặn
            Collider col = GetComponent<Collider>();
            if (col != null) col.enabled = false;

            // Ép Animation về Idle
            if (_animator != null) _animator.SetFloat("Speed", 0f);

            // Nghỉ nửa giây cho ra dáng đứng yên
            yield return new WaitForSeconds(0.5f);

            // 2. LẶN XUỐNG BÙN (SINK) - Gọi ID MADA_SPLASH
            PlayMonsterAudio("MADA_SPLASH", false);

            float sinkTime = 2f;
            float timer = 0f;
            Vector3 startPos = transform.position;
            Vector3 sinkPos = startPos + Vector3.down * 3f; // Lún xuống 3 mét

            while (timer < sinkTime)
            {
                transform.position = Vector3.Lerp(startPos, sinkPos, timer / sinkTime);
                timer += Time.deltaTime;
                yield return null;
            }

            // 3. TELEPORT QUA VŨNG NƯỚC MỚI & SÔI ÙNG ỤC 5 GIÂY - Gọi ID MADA_GURGLE
            transform.position = newPuddlePos + Vector3.down * 3f; // Nằm chờ dưới đáy vũng nước mới

            PlayMonsterAudio("MADA_GURGLE", true); // Phát loop ùng ục

            // 5 GIÂY ÁP LỰC CHO PLAYER CHẠY TRỐN
            yield return new WaitForSeconds(5f);

            if (_audioSource != null) _audioSource.Stop(); // Dừng tiếng ùng ục

            // 4. TRỒI LÊN TỪ TỪ (RISE) - Gọi lại ID MADA_SPLASH
            PlayMonsterAudio("MADA_SPLASH", false);
            if (_animator != null) _animator.SetTrigger("TriggerRise");

            float riseTime = 2f;
            timer = 0f;
            startPos = transform.position;
            Vector3 risePos = newPuddlePos;

            while (timer < riseTime)
            {
                transform.position = Vector3.Lerp(startPos, risePos, timer / riseTime);
                timer += Time.deltaTime;
                yield return null;
            }
            transform.position = risePos;

            // 5. HOÀN THÀNH, BẬT LẠI MỌI THỨ
            if (col != null) col.enabled = true;
            if (navMeshAgent != null) navMeshAgent.enabled = true;

            // Master Client giao lại quyền đi điều tra quanh vũng nước
            if (PhotonNetwork.IsMasterClient)
            {
                ChangeStateType(MaDaStateType.Investigate, newPuddlePos);
            }
        }

        // ==========================================
        // BỘ NÃO (UPDATE LOOP)
        // ==========================================
        protected override void Update()
        {
            // Chỉ set Anim khi NavMesh đang bật (để tránh lỗi quái quẫy đạp lúc lặn ngầm)
            if (_animator != null && navMeshAgent != null && navMeshAgent.enabled)
            {
                _animator.SetFloat("Speed", navMeshAgent.velocity.magnitude);
            }

            if (!PhotonNetwork.IsMasterClient) return;

            // Bỏ qua logic suy nghĩ nếu đang bận lặn ngầm xài skill
            if (currentStateType == MaDaStateType.Teleporting) return;

            base.Update();
            bool detected = IsPlayerDetected();

            switch (currentStateType)
            {
                case MaDaStateType.Patrol:
                    if (detected) ChangeStateType(MaDaStateType.Chase);
                    break;

                case MaDaStateType.Chase:
                    if (!detected && chaseState.HasLostPlayer() && currentState == null)
                    {
                        ChangeStateType(MaDaStateType.Investigate, chaseState.GetLastSeenPlayerPosition());
                    }
                    break;

                case MaDaStateType.Investigate:
                    if (currentState == null)
                    {
                        if (investigateState != null && investigateState.WasPlayerDetected())
                            ChangeStateType(MaDaStateType.Chase);
                        else
                            ChangeStateType(MaDaStateType.Patrol);
                    }
                    break;

                case MaDaStateType.Frenzy:
                    UpdateFrenzyMode();
                    break;
                case MaDaStateType.Jumpscare:
                    // Khi JumpscareState đếm đủ 2.5s, hàm ShouldExit() sẽ trả về true làm currentState bị null.
                    if (currentState == null)
                    {
                        Debug.Log("<color=cyan>[Ma Da]</color> Nhai đầu xong! Bỏ đi chỗ khác kiếm ăn.");
                        // Chuyển về đi loanh quanh chỗ vừa hù, hoặc về Patrol
                        ChangeStateType(MaDaStateType.Patrol);
                    }
                    break;
            }
        }

        private void ChangeStateType(MaDaStateType newState, Vector3 investigatePos = default, Transform victim = null)
        {
            if (currentStateType == newState) return;

            currentState?.Exit();
            currentStateType = newState;

            switch (newState)
            {
                case MaDaStateType.Patrol:
                    navMeshAgent.speed = walkSpeed;
                    ChangeState(patrolState);
                    break;
                case MaDaStateType.Chase:
                    navMeshAgent.speed = runSpeed;
                    ChangeState(chaseState);
                    break;
                case MaDaStateType.Investigate:
                    navMeshAgent.speed = walkSpeed;
                    investigateState = new InvestigateState(this, investigatePos);
                    ChangeState(investigateState);
                    break;
                case MaDaStateType.Frenzy:
                    navMeshAgent.speed = runSpeed;
                    currentState = null;
                    break;
                case MaDaStateType.Jumpscare:
                    navMeshAgent.speed = 0f;
                    jumpscareState = new MaDaJumpscareState(this, victim);
                    ChangeState(jumpscareState);
                    break;
            }
        }

        private void UpdateFrenzyMode()
        {
            var players = FindObjectsByType<FPSController>(FindObjectsSortMode.None);
            if (players == null || players.Length == 0) return;

            Transform closestPlayer = players
                .OrderBy(p => Vector3.Distance(transform.position, p.transform.position))
                .FirstOrDefault()?.transform;

            if (closestPlayer != null)
            {
                MoveTo(closestPlayer.position);
                LookForward();
            }
        }

        // ==========================================
        // ĐỒNG BỘ HIỆU ỨNG JUMPSCARE CHO TOÀN BẢN ĐỒ
        // ==========================================
        [PunRPC]
        private void RpcPlayJumpscareEffect(Vector3 lookDirection)
        {
            // MasterClient đã tự xử lý FSM rồi, cái này chỉ để ép Client thường chạy Anim
            if (!PhotonNetwork.IsMasterClient)
            {
                // Dừng lại và xoay mặt
                if (navMeshAgent != null) navMeshAgent.enabled = false;
                if (lookDirection.sqrMagnitude > 0.001f)
                {
                    transform.rotation = Quaternion.LookRotation(lookDirection);
                }

                // Chạy Anim và Sound
                if (_animator != null) _animator.SetTrigger("TriggerJumpscare");
                PlayMonsterAudio("MADA_JUMPSCARE", false);
            }
        }

        private void OnTriggerEnter(Collider other)
        {
            if (!PhotonNetwork.IsMasterClient) return;

            // Đang bận tele hoặc đang xé xác đứa khác thì lờ đi
            if (currentStateType == MaDaStateType.Teleporting || currentStateType == MaDaStateType.Jumpscare) return;

            if (other.CompareTag("Player"))
            {
                // [FIX ĐỒNG BỘ]: Tìm Component bao cả root và children
                var knockedState = other.GetComponentInParent<PlayerKnockedState>();
                if (knockedState == null) knockedState = other.GetComponentInChildren<PlayerKnockedState>();

                if (knockedState != null && knockedState.isKnocked)
                {
                    Debug.Log($"<color=yellow>[Ma Da]</color> Thằng {other.name} gục rồi, không thèm chấp!");
                    return;
                }

                Debug.Log($"<color=red>[Ma Da]</color> BẮT ĐƯỢC CON MỒI: {other.name}!");
                ChangeStateType(MaDaStateType.Jumpscare, default, other.transform);
            }
        }
    }
}