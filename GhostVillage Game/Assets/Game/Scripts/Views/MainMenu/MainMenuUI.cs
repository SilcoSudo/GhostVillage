using TMPro;
using UnityEngine;
using VContainer; // Cần cái này để Inject
using Game.Domain.Account.Service; // Namespace chứa AccountService của bạn

namespace Game.Views.MainMenu
{
    public class MainMenuUI : MonoBehaviour
    {
        [Header("UI Components")]
        [SerializeField] private TextMeshProUGUI _nameText;
        [SerializeField] private TextMeshProUGUI _levelText;
        [SerializeField] private TextMeshProUGUI _coinText;

        // Service giữ data (đã được nạp lúc Login)
        private AccountService _accountService;

        // VContainer sẽ tự động bơm AccountService vào đây khi scene load
        [Inject]
        public void Construct(AccountService accountService)
        {
            _accountService = accountService;
        }

        private void Start()
        {
            UpdatePlayerInfo();
        }

        private void UpdatePlayerInfo()
        {
            // Kiểm tra xem đã login chưa (tránh lỗi null nếu chạy thẳng scene này để test)
            if (_accountService != null && _accountService.IsLoggedIn)
            {
                // 1. Lấy tên
                _nameText.text = _accountService.GetDisplayName();

                // 2. Lấy Level (Format ví dụ: "LV. 10")
                _levelText.text = $"LV. {_accountService.GetLevel()}";

                // 3. Lấy Coin (Format có dấu phẩy: "1,000")
                _coinText.text = $"{_accountService.GetCoin():N0}";
            }
            else
            {
                Debug.LogWarning("[MainMenuUI] Chưa có data User (Hoặc chưa login). Hiển thị Default.");
                _nameText.text = "Guest";
                _levelText.text = "LV. 1";
                _coinText.text = "0";
            }
        }
    }
}