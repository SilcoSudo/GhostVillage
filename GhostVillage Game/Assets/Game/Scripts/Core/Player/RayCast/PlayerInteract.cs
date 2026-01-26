using UnityEngine;
using UnityEngine.InputSystem;
using VContainer;
using VContainer.Unity; // Cần thêm cái này để truy cập Container
using Photon.Pun;
using Game.Scripts.UI.Lobby;
using Game.Core.DI; // Namespace chứa LobbySceneScope của bạn

namespace Game.Core.Player.RayCast
{
    public class PlayerInteract : MonoBehaviour
    {
        [Header("Raycast Settings")]
        [SerializeField] private Camera playerCamera;
        [SerializeField] private float interactRange = 3f;
        [SerializeField] private LayerMask interactLayer;

        [Header("Held Item Settings")]
        [SerializeField] private Transform heldItemParent;
        private GameObject _currentHeldItem;

        [Inject] private LobbyUIManager _uiManager;

        private PhotonView _pv;
        private IInteractable _currentInteractable;

        private void Awake() => _pv = GetComponent<PhotonView>();

        private void Start()
        {
            if (!_pv.IsMine) return;

            // TỰ ĐỘNG FIX NULL: Nếu Inject tự động thất bại (do Photon sinh ra), ta chủ động yêu cầu Scope inject
            if (_uiManager == null)
            {
                var scope = Object.FindFirstObjectByType<LobbySceneScope>();
                if (scope != null && scope.Container != null)
                {
                    scope.Container.Inject(this);
                    Debug.Log("<color=green>[VContainer]</color> Đã Inject thủ công thành công cho PlayerInteract.");
                }
                else
                {
                    Debug.LogError("<color=red>[VContainer]</color> Không tìm thấy LobbySceneScope để Inject!");
                }
            }
        }

        void Update()
        {
            if (!_pv.IsMine) return;

            CheckInteractable();

            if (Keyboard.current.fKey.wasPressedThisFrame && _currentInteractable != null)
            {
                Debug.Log($"<color=cyan>[PlayerInteract]</color> Đang tương tác với: {_currentInteractable.GetPromptMessage()}");
                _currentInteractable.Interact();
            }
        }

        // --- HÀM CẦM NẮM VẬT PHẨM (GIỮ NGUYÊN) ---

        public void AttachHeldItem(GameObject heldPrefab)
        {
            if (heldPrefab == null || heldItemParent == null) return;
            DetachHeldItem();
            _currentHeldItem = Instantiate(heldPrefab, heldItemParent);
            _currentHeldItem.transform.localPosition = Vector3.zero;
            _currentHeldItem.transform.localRotation = Quaternion.identity;
        }

        public void DetachHeldItem()
        {
            if (_currentHeldItem != null)
            {
                Destroy(_currentHeldItem);
                _currentHeldItem = null;
            }
        }

        // --- HÀM KIỂM TRA TƯƠNG TÁC ---

        private void CheckInteractable()
        {
            if (playerCamera == null || _uiManager == null) return;

            Ray ray = new Ray(playerCamera.transform.position, playerCamera.transform.forward);
            Debug.DrawRay(ray.origin, ray.direction * interactRange, Color.red);

            if (Physics.Raycast(ray, out RaycastHit hit, interactRange, interactLayer))
            {
                var interactable = hit.collider.GetComponent<IInteractable>();

                if (interactable != null)
                {
                    if (_currentInteractable != interactable)
                    {
                        _currentInteractable = interactable;
                        _uiManager.SetInteractPrompt(interactable.GetPromptMessage(), true);
                    }
                    return;
                }
            }

            if (_currentInteractable != null)
            {
                _currentInteractable = null;
                _uiManager.SetInteractPrompt("", false);
            }
        }
    }
}