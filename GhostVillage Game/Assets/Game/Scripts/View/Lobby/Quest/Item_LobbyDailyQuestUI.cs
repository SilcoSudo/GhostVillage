using UnityEngine;
using TMPro;
using GhostVillage.Domain.Profile; // Nhớ check đúng namespace của sếp

namespace Game.Scripts.UI.Lobby
{
    public class Item_LobbyDailyQuestUI : MonoBehaviour
    {
        [Tooltip("Kéo Txt_MissionDesc vào đây")]
        [SerializeField] private TextMeshProUGUI _txtTitle;

        [Tooltip("Kéo Txt_MissionProg vào đây")]
        [SerializeField] private TextMeshProUGUI _txtProgress;

        public void Setup(QuestItemDTO data)
        {
            // Hiển thị Tiêu đề (Nếu thích sếp có thể cộng thêm data.desc vào đây)
            _txtTitle.text = data.title;

            // Xử lý hiển thị tiến độ bằng màu sắc cho dễ nhìn
            if (data.isClaimed || data.current >= data.target)
            {
                // Xong rồi thì bôi xanh
                _txtProgress.text = "<color=green>HOÀN THÀNH</color>";
            }
            else
            {
                // Chưa xong thì hiện số trắng
                _txtProgress.text = $"<color=white>{data.current} / {data.target}</color>";
            }
        }
    }
}