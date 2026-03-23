using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace GhostVillage.Storage
{
    public class EquippedPerkSlotUI : MonoBehaviour
    {
        [Header("UI Components")]
        public Image imgIcon;
        public TextMeshProUGUI txtName;
        
        [Header("Status Logic")]
        public GameObject lockOverlay;
        public TextMeshProUGUI txtLockMsg;

        public void SetStatus(bool isLocked, string lockMsg, string perkName = "", Sprite icon = null)
        {
            // 1. Xử lý Overlay khóa
            if (lockOverlay != null) lockOverlay.SetActive(isLocked);
            if (txtLockMsg != null) 
            {
                txtLockMsg.text = lockMsg;
                txtLockMsg.gameObject.SetActive(isLocked);
            }

            // 2. Nếu bị khóa: Ẩn tất cả thông tin Perk
            if (isLocked)
            {
                if (imgIcon != null) imgIcon.gameObject.SetActive(false);
                if (txtName != null) txtName.gameObject.SetActive(false);
                return; 
            }

            // 3. Nếu không khóa: Kiểm tra xem có dữ liệu Perk không
            bool hasPerk = !string.IsNullOrEmpty(perkName);

            if (txtName != null)
            {
                txtName.text = hasPerk ? perkName : ""; // Hiện tên nếu có
                txtName.gameObject.SetActive(hasPerk);
            }

            if (imgIcon != null)
            {
                imgIcon.sprite = icon;
                // Chỉ hiện Icon nếu có Sprite, nếu không thì hiện ô trống
                imgIcon.gameObject.SetActive(icon != null); 
            }
        }
    }
}