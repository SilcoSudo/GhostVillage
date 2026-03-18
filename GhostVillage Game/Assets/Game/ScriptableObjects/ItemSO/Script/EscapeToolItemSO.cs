using UnityEngine;

[CreateAssetMenu(fileName = "NewEscapeTool", menuName = "Game/Inventory/Escape Tool")]
public class EscapeToolItemSO : ItemDataSO
{
    [Header("Escape Tool Settings")]
    [Tooltip("Khoảng cách tối đa để phát hiện cổng (nếu cần)")]
    public float detectionRange = 100f;

    // Tự động gán loại item khi tạo file hoặc load game
    private void OnEnable()
    {
        itemType = ItemType.EscapeTool;
    }

    public override bool OnUse(GameObject character)
    {
        // Escape Tool thường là dạng Passive (cầm trên tay là tự chỉ đường)
        // Nhưng nếu người chơi bấm chuột trái (Use), ta có thể cho nó kêu hoặc animation đặc biệt
        Debug.Log($"[EscapeTool] Đang cầm {itemName}. Hãy nhìn hướng nó chỉ!");

        // Trả về false để KHÔNG bị xóa khỏi Inventory
        return false;
    }
}