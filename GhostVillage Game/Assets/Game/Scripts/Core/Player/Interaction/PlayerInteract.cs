using UnityEngine;
using UnityEngine.InputSystem;
using Photon.Pun;
// Đã xóa: VContainer, Game.Scripts.UI.Lobby, Game.Core.DI -> Không cần nữa

namespace Game.Core.Player.RayCast // namespace cũ của bạn là RayCast hay Interaction? Check lại nhé
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

        // Đã xóa: _uiManager (Vì chúng ta dùng Event, không cần reference trực tiếp)

        private PhotonView _pv;
        private IInteractable _currentInteractable;

        private void Awake() => _pv = GetComponent<PhotonView>();

        // Start không cần Inject gì nữa cả
        private void Start()
        {
            // Để trống hoặc xử lý logic khác nếu cần
        }

        void Update()
        {
            if (!_pv.IsMine) return;

            CheckInteractable();
        }

        public void TryInteract()
        {
            if (_currentInteractable != null)
            {
                Debug.Log($"<color=cyan>[PlayerInteract]</color> Đang tương tác với: {_currentInteractable.GetPromptMessage()}");

                // Truyền chính mình (this.gameObject) vào để vật phẩm/người gục biết ai đang bấm
                _currentInteractable.Interact(this.gameObject);
            }
        }

        // --- HÀM CẦM NẮM VẬT PHẨM ---
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
            if (playerCamera == null) return;

            Ray ray = new Ray(playerCamera.transform.position, playerCamera.transform.forward);

            if (Physics.Raycast(ray, out RaycastHit hit, interactRange, interactLayer))
            {
                var interactable = hit.collider.GetComponent<IInteractable>();

                if (interactable != null)
                {
                    if (_currentInteractable != interactable)
                    {
                        _currentInteractable = interactable;
                        InteractionEvents.TriggerHover(interactable.GetPromptMessage(), true);
                    }
                    return;
                }
            }

            // Nếu không nhìn thấy gì hoặc nhìn ra chỗ khác
            if (_currentInteractable != null)
            {
                _currentInteractable = null;
                InteractionEvents.TriggerHover("", false);
            }
        }
    }
}