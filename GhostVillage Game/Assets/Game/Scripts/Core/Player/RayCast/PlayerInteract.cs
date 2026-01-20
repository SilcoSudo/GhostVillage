using TMPro;
using UnityEngine;

public class PlayerInteract : MonoBehaviour
{
    [Header("Raycast Settings")]
    public Camera playerCamera;       // Camera để bắn ray
    public float interactRange = 3f;  // Khoảng cách tối đa
    public LayerMask interactLayer;   // Chỉ quét layer nào (vd: Interactable)

    [Header("UI Prompt")]
    public GameObject interactUIPrompt;
    public TextMeshProUGUI promptTextUI;


    [Header("Held Item Settings")]
    public Transform heldItemParent;  // Vị trí spawn item trên tay hoặc trước camera
    private GameObject currentHeldItem;

    void Update()
    {
        // Bắn tia từ camera
        Ray ray = new Ray(playerCamera.transform.position, playerCamera.transform.forward);

        // Nếu tia trúng vật thể
        if (Physics.Raycast(ray, out RaycastHit hit, interactRange, interactLayer))
        {
            // Lấy component implement IInteractable
            IInteractable interactable = hit.collider.GetComponent<IInteractable>();

            if (interactable != null)
            {
                // Bật UI prompt
                interactUIPrompt.SetActive(true);
                promptTextUI.text = interactable.GetPromptMessage();

                // Nhấn phím tương tác
                if (Input.GetKeyDown(interactable.InteractKey))
                {
                    interactable.Interact(this);
                }

                return; // Không tắt UI nếu đang hover 1 vật thể
            }
        }

        // Nếu không trúng gì
        interactUIPrompt.SetActive(false);
    }


    /// <summary>
    /// Gắn prefab vật phẩm vào tay người chơi.
    /// Nếu đã có vật đang cầm, nó sẽ bị hủy.
    /// </summary>
    public void AttachHeldItem(GameObject heldPrefab)
    {
        if (heldPrefab == null) return;

        // Hủy item cũ nếu có
        if (currentHeldItem != null)
        {
            Destroy(currentHeldItem);
        }

        // Spawn vật mới vào vị trí cầm
        currentHeldItem = Instantiate(heldPrefab, heldItemParent);
        currentHeldItem.transform.localPosition = Vector3.zero;
        currentHeldItem.transform.localRotation = Quaternion.identity;

        // (Tùy chọn) scale lại nhỏ hơn nếu model to
        currentHeldItem.transform.localScale *= 0.5f;
    }

    /// <summary>
    /// Bỏ vật phẩm đang cầm.
    /// </summary>
    public void DetachHeldItem()
    {
        if (currentHeldItem != null)
        {
            Destroy(currentHeldItem);
            currentHeldItem = null;
        }
    }

    // ===== Debug gizmos =====
    private void OnDrawGizmos()
    {
        if (playerCamera == null) return;

        Gizmos.color = Color.yellow;
        Vector3 start = playerCamera.transform.position;
        Vector3 end = start + playerCamera.transform.forward * interactRange;

        // Vẽ đường ray
        Gizmos.DrawLine(start, end);
        // Vẽ điểm cuối
        Gizmos.DrawWireSphere(end, 0.1f);
    }
}
