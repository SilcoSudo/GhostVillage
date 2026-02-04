using UnityEngine;

// Enum để phân loại nhanh
public enum ItemType
{
    KeyItem,        // Chỉ nhặt, không dùng được (Mở cửa)
    Consumable,     // Dùng 1 lần mất luôn (Máu, Nước)
    Equipment       // Cầm trên tay, bật tắt được (Đèn, Máy dò)
}

// Bỏ dòng CreateAssetMenu đi vì ta sẽ tạo từ class con
public class ItemDataSO : ScriptableObject
{
    [Header("Basic Info")]
    [Tooltip("ID này PHẢI TRÙNG KHỚP hoàn toàn với ID trong file JSON Config")]
    public string itemId;
    public string itemName;
    [TextArea] public string description;
    public ItemType itemType; // <-- Để phân loại UI

    [Header("UI Visuals")]
    public Sprite itemIcon;

    [Header("3D Models")]
    [Tooltip("Prefab rớt dưới đất (Có Rigidbody, Collider, PhotonView)")]
    public GameObject itemWorldPrefab;

    [Tooltip("Model cầm trên tay (Chỉ có Mesh, không Physics)")]
    public GameObject itemHandModel;

    // Hàm ảo: Mặc định trả về false (Không dùng được)
    public virtual bool OnUse(GameObject character)
    {
        Debug.Log($"Item {itemName} không có chức năng sử dụng.");
        return false;
    }
}