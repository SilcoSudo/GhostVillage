using UnityEngine;

[CreateAssetMenu(fileName = "NewMedkit", menuName = "Game Data/Items/Medkit")]
public class MedkitItemSO : ItemDataSO
{
    [Header("Medkit Stats (Từ DB)")]
    public float healAmount = 25f; // Mặc định, sẽ bị BE ghi đè (VD: 25 là cứu sống luôn nếu max blood = 25)

    // Ghi đè nút E (OnUse)
    public override bool OnUse(GameObject character)
    {
        // Nhắc nhở người chơi
        Debug.Log("<color=yellow>Medkit không thể tự dùng! Hãy cầm trên tay và bấm F vào đồng đội đang gục.</color>");

        // Có thể bắn một cái Event ra để UI hiện dòng chữ "Không thể tự dùng" lên màn hình
        // UIManager.ShowNotification("Chỉ dùng để cứu đồng đội!");

        return false; // Trả về false để Inventory KHÔNG xóa item này đi
    }
}