// File: src/Game/UI/Lobby/LobbyItemUI.cs
using UnityEngine;
using TMPro;
using UnityEngine.UI;
using Game.Core.Network.Lobby;


namespace Game.UI.Lobby
{
    public class LobbyItemUI : MonoBehaviour
    {
        [SerializeField] private TextMeshProUGUI _nameText;
        [SerializeField] private TextMeshProUGUI _countText;
        [SerializeField] private GameObject _lockIcon;
        [SerializeField] private Button _joinBtn;

        // Setup dữ liệu cho dòng này
        public void Setup(LobbyData data, System.Action<LobbyData> onJoin)
        {
            _nameText.text = data.Name;
            _countText.text = $"{data.CurrentPlayers}/{data.MaxPlayers}";
            _lockIcon.SetActive(data.IsLocked);

            _joinBtn.onClick.RemoveAllListeners();
            _joinBtn.onClick.AddListener(() => onJoin(data));
        }
    }
}