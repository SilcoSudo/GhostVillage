using UnityEngine;
using Game.Scripts.UI.Lobby; // Gọi thẳng thư viện UI của Lobby

namespace Game.Scripts.View.Lobby
{
    // Kế thừa từ class trừu tượng Interactable của sếp thay vì viết lại từ đầu
    public class TutorialBoardInteract : Interactable
    {
        // Hàm Interact bắt buộc phải có chữ "override" để ghi đè lên class cha
        public override void Interact(GameObject actor)
        {
            // Đi tìm ông quản lý UI và hét ổng bật bảng Hướng Dẫn lên
            var uiManager = FindObjectOfType<LobbyUIManager>();
            if (uiManager != null)
            {
                uiManager.ShowTutorialModal(true);
            }
        }

        // TÙY CHỌN: Sếp không cần phải viết hàm GetPromptMessage() ở đây nữa!
        // Vì class cha Interactable đã lo vụ đó rồi. 
        // Lát ra ngoài Unity Inspector, sếp chỉ cần gõ chữ "Xem Hướng Dẫn" vào ô [Prompt Text] là nó tự thêm chữ "(F)" cho sếp luôn!
    }
}