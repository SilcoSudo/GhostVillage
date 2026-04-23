using UnityEngine;
using GhostVillage.Gameplay.Monsters.OngKe;

[CreateAssetMenu(fileName = "NewSiren", menuName = "Game Data/Items/Siren")]
public class SirenItemSO : ItemDataSO
{
    [Header("Siren Stats")]
    [Tooltip("Khoảng cách mà Ông Kẹ nghe thấy sáo")]
    public float sirenRange = 100f;
    
    [Tooltip("Thời gian Ông Kẹ tìm kiếm tại vị trí sáo")]
    public float searchDuration = 4f;

    private void OnEnable()
    {
        itemType = ItemType.Consumable;
        holdType = HoldType.OneHand;
    }

    public override bool OnUse(GameObject character)
    {
        if (character == null) return false;

        // Phát ra âm thanh sáo ở vị trí của người chơi
        Vector3 sirenPosition = character.transform.position;
        
        Debug.Log($"🔊 [Siren Item] Người chơi dùng sáo tại {sirenPosition}");

        // Tìm OngKeMonster và báo cho nó có sáo
        OngKeMonster ongKe = FindObjectOfType<OngKeMonster>();
        if (ongKe != null)
        {
            ongKe.OnSirenActivated(sirenPosition);
            Debug.Log($"🔊 [Siren Item] Đã bắt Ông Kẹ nghe thấy sáo!");
        }
        else
        {
            Debug.LogWarning("[Siren Item] Không tìm thấy OngKeMonster để gửi sáo signal!");
        }

        // Item được tiêu thụ sau khi dùng
        return true;
    }
}
