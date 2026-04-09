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
        [Tooltip("Kéo xương RightHand vào đây (mixamorig:RightHand)")]
        [SerializeField] private Transform rightHandParent;


        [Tooltip("Kéo một Transform rỗng nằm ngang ngực vào đây")]
        [SerializeField] private Transform twoHandParent;

        private GameObject _currentHeldItem;
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
        public void AttachHeldItem(GameObject heldPrefab, HoldType holdType)
        {
            if (heldPrefab == null) return;
            DetachHeldItem();

            // Chọn Parent tương ứng
            Transform targetParent = (holdType == HoldType.TwoHands) ? twoHandParent : rightHandParent;

            if (targetParent == null)
            {
                Debug.LogWarning($"<color=yellow>[PlayerInteract]</color> Thiếu điểm gắp đồ cho kiểu {holdType}!");
                return;
            }

            _currentHeldItem = Instantiate(heldPrefab, targetParent);
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