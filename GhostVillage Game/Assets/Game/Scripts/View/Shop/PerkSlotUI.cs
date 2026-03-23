using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace GhostVillage.Shop
{
    public class PerkSlotUI : MonoBehaviour
    {
        [Header("UI Components")]
        public Image imgIcon;
        public TextMeshProUGUI txtName;
        public Image imgBackground; 
        public Button slotButton;

        // CẬP NHẬT: Tham số đầu tiên bây giờ là PerkSO thay vì PerkDTO
        public void Setup(PerkSO data, bool isOwned, Color rarityColor)
        {
            // Lấy tên từ ScriptableObject
            txtName.text = data.itemName;
            
            // Đổi màu nền dựa trên độ hiếm truyền vào
            if (imgBackground != null)
            {
                imgBackground.color = rarityColor;
            }

            // ƯU ĐIỂM: Lấy trực tiếp Icon từ SO, không cần Resources.Load nữa
            if (imgIcon != null && data.icon != null)
            {
                imgIcon.sprite = data.icon;
            }

            // Xử lý làm mờ nếu đã sở hữu (Alpha = 0.6)
            if (imgBackground != null)
            {
                Color color = imgBackground.color;
                color.a = isOwned ? 0.6f : 1.0f;
                imgBackground.color = color;
            }

            // Làm mờ cả icon nếu đã sở hữu
            if (imgIcon != null)
            {
                Color iconColor = imgIcon.color;
                iconColor.a = isOwned ? 0.6f : 1.0f;
                imgIcon.color = iconColor;
            }
        }
    }
}