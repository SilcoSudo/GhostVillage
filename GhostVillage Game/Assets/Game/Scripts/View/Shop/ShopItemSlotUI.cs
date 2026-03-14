using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace GhostVillage.Shop 
{
    public class ShopItemSlotUI : MonoBehaviour 
    {
        [Header("UI Elements")]
        public Image backgroundImage; // Thành phần nền để đổi màu
        public TextMeshProUGUI nameText; // Chỉ hiển thị tên
        public Button slotButton;

        [HideInInspector] 
        public ShopItemSO currentItem;

        public void SetupSlot(ShopItemSO item, bool isOwned) 
        {
            currentItem = item;
            
            // Set tên vật phẩm. Nếu đã có thì thêm chữ (Owned)
            nameText.text = isOwned ? $"{item.itemName} (Owned)" : item.itemName;

            // Đổi màu nền theo độ hiếm (Rarity)
            // Bạn có thể chỉnh lại mã màu (R, G, B, Alpha) cho hợp với tông màu game
            switch (item.rarity)
            {
                case ItemRarity.COMMON:
                    backgroundImage.color = new Color(0.3f, 0.3f, 0.3f, 1f); // Xám tối
                    break;
                case ItemRarity.RARE:
                    backgroundImage.color = new Color(0.1f, 0.3f, 0.6f, 1f); // Xanh dương đậm
                    break;
                case ItemRarity.EPIC:
                    backgroundImage.color = new Color(0.5f, 0.1f, 0.6f, 1f); // Tím đậm
                    break;
                default:
                    backgroundImage.color = new Color(0.2f, 0.2f, 0.2f, 1f);
                    break;
            }

            // Có thể làm mờ nền nếu đã sở hữu
            if (isOwned) 
            {
                Color ownedColor = backgroundImage.color;
                ownedColor.a = 0.5f; // Giảm độ trong suốt xuống 50%
                backgroundImage.color = ownedColor;
            }
        }

        public void OnClick_PreviewItem()
        {
            Debug.Log("Previewing: " + currentItem.itemName);
            // Sau này gọi CharacterPreviewer ở đây
        }
    }
}