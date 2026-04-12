using UnityEngine;
using Photon.Pun;
using GhostVillage.Gameplay.Base;
using Game.Scripts.Gameplay.Core; // Chứa GameplayEvents và GameAudioManager
using System.Linq;
using VContainer;
using static PlayerFlashlight;
using GhostVillage.Gameplay.Shared;

namespace GhostVillage.Gameplay.Monsters.Mada
{
    [RequireComponent(typeof(PhotonView))]
    public class DrownedMinion : MonsterBase, IUVReactable
    {
        [Header("--- Drowned Settings ---")]
        [Tooltip("Thời gian bị chiếu UV liên tục để chết (giây)")]
        [SerializeField] private float uvTimeToDie = 3f;
        [Tooltip("Tốc độ chìm xuống đất")]
        [SerializeField] private float sinkSpeed = 1.5f;

        [Header("--- Animation & Audio Config ---")]
        [SerializeField] private Animator _animator;
        [SerializeField] private AudioSource _audioSource;

        [Tooltip("Các ID âm thanh nạp vào GameManager")]
        [SerializeField] private string crawlAudioID = "DROWNED_CRAWL";
        [SerializeField] private string alertAudioID = "DROWNED_ALERT";
        [SerializeField] private string burnAudioID = "DROWNED_BURN";

        // [Inject] Nếu sếp xài VContainer, còn không thì tui dùng FindFirstObjectByType ở Awake
        [Inject] private GameAudioManager _audioManager;

        private float _currentUVExposure = 0f;
        private bool _isDying = false;   // Chết do bị chiếu UV
        private bool _isAlerting = false; // Đã chạm người chơi -> Hú -> Lặn
        private PhotonView _pv;

        protected override void Awake()
        {
            base.Awake();
            _pv = GetComponent<PhotonView>();
            monsterName = "Drowned Minion";

            if (_animator == null) _animator = GetComponentInChildren<Animator>();
            if (_audioSource == null) _audioSource = GetComponent<AudioSource>();

            // Tìm AudioManager nếu chưa được Inject
            if (_audioManager == null)
            {
                _audioManager = FindFirstObjectByType<GameAudioManager>();
            }

            // Lấy tiếng bò từ Manager và bật loop
            if (_audioSource != null && _audioManager != null)
            {
                AudioClip crawlClip = _audioManager.GetClip(crawlAudioID);
                if (crawlClip != null)
                {
                    _audioSource.clip = crawlClip;
                    _audioSource.loop = true;
                    _audioSource.Play();
                }
            }
        }

        protected override void Update()
        {
            if (!PhotonNetwork.IsMasterClient) return;

            // NẾU ĐANG CHẾT HOẶC ĐANG LẶN -> Xử lý Transform trôi xuống đất
            if (_isDying || _isAlerting)
            {
                monsterTransform.Translate(Vector3.down * sinkSpeed * Time.deltaTime, Space.World);

                // Chìm qua -3m thì xóa xác
                if (monsterTransform.position.y < -3f)
                {
                    PhotonNetwork.Destroy(gameObject);
                }
                return;
            }

            // TỤT ĐIỂM TÍCH TỤ UV NẾU NGƯỜI CHƠI TẮT ĐÈN (Hồi phục từ từ)
            if (_currentUVExposure > 0)
            {
                _currentUVExposure -= Time.deltaTime * 0.5f;
            }

            WallhackChasePlayer();
        }

        private void WallhackChasePlayer()
        {
            // Lấy tất cả player đang có trong map
            var players = FindObjectsByType<FPSController>(FindObjectsSortMode.None);
            if (players == null || players.Length == 0) return;

            //Lọc ra những thằng CÒN ĐỨNG (isKnocked == false) rồi mới tính khoảng cách
            Transform closestPlayer = players
                .Where(p =>
                {
                    var knockedState = p.GetComponent<PlayerKnockedState>();
                    return knockedState != null && !knockedState.isKnocked; // Chỉ lấy thằng chưa bị gục
                })
                .OrderBy(p => Vector3.Distance(transform.position, p.transform.position))
                .FirstOrDefault()?.transform;

            if (closestPlayer != null)
            {
                MoveTo(closestPlayer.position);
                LookForward(); // Xoay mặt theo hướng đi
            }
            else
            {
                // Nếu tất cả đều đã bị knock, thì quái con đứng yên hoặc tự lặn luôn (tùy sếp)
                if (navMeshAgent != null && navMeshAgent.enabled)
                {
                    navMeshAgent.isStopped = true;
                }
            }

            // Xử lý Animation bò
            if (_animator != null)
            {
                _animator.SetFloat("Speed", navMeshAgent.velocity.magnitude);
            }
        }

        // ==========================================
        // LOGIC CHẠM NGƯỜI CHƠI -> HÚ GỌI MA DA
        // ==========================================
        private void OnTriggerEnter(Collider other)
        {
            if (!PhotonNetwork.IsMasterClient || _isDying || _isAlerting) return;

            if (other.CompareTag("Player"))
            {
                TriggerAlert(other.transform.position);
            }
        }

        private void TriggerAlert(Vector3 playerPos)
        {
            _isAlerting = true;
            navMeshAgent.enabled = false;
            GetComponent<Collider>().enabled = false;

            _pv.RPC(nameof(RpcAlertAndSink), RpcTarget.AllBuffered, playerPos);
        }

        [PunRPC]
        private void RpcAlertAndSink(Vector3 playerPos)
        {
            _isAlerting = true;

            if (_audioSource != null)
            {
                // [FIX CHÍ MẠNG]: Tắt ngay tiếng bò lết đang loop trước khi làm hành động khác
                _audioSource.Stop();

                // MƯỢN ĐĨA TỪ MANAGER ĐỂ HÚ
                if (_audioManager != null)
                {
                    AudioClip alertClip = _audioManager.GetClip(alertAudioID);
                    if (alertClip != null)
                    {
                        _audioSource.PlayOneShot(alertClip);
                    }
                }
            }

            Debug.Log($"<color=red>[Drowned]</color> Đã chạm Player! Gào rú gọi Ma Da tới {playerPos}!");

            // [FIX]: GỌI EVENT BÁO MA DA BIẾT (Chỉ Master xử lý AI)
            if (PhotonNetwork.IsMasterClient)
            {
                MonsterEvents.AlertPlayerSpotted(playerPos);
            }
        }

        // ==========================================
        // LOGIC BỊ ĐÈN UV CHIẾU CHÁY
        // ==========================================
        public void OnUVIrradiated(float amount, int attackerActorNumber)
        {
            if (!PhotonNetwork.IsMasterClient || _isDying || _isAlerting) return;

            _currentUVExposure += amount;

            // Effect xèo xèo lúc bị chiếu
            if (_audioSource != null && !_audioSource.isPlaying && _audioManager != null)
            {
                AudioClip burnClip = _audioManager.GetClip(burnAudioID);
                if (burnClip != null)
                {
                    _audioSource.PlayOneShot(burnClip);
                }
            }

            // ĐỦ ĐÔ -> CHẾT
            if (_currentUVExposure >= uvTimeToDie)
            {
                DieByUV(attackerActorNumber);
            }
        }

        private void DieByUV(int killerActorNumber)
        {
            _isDying = true;
            navMeshAgent.enabled = false;
            GetComponent<Collider>().enabled = false;

            GameplayEvents.OnSmallMonsterKilled?.Invoke(killerActorNumber);

            _pv.RPC(nameof(RpcFreezeAndSink), RpcTarget.AllBuffered);
        }

        [PunRPC]
        private void RpcFreezeAndSink()
        {
            _isDying = true;

            if (_audioSource != null) _audioSource.Stop();

            if (_animator != null)
            {
                _animator.speed = 0f;
            }

            Debug.Log("<color=purple>[Drowned]</color> Bị UV nướng chín! Đứng hình và chìm xuống bùn!");
        }
    }
}