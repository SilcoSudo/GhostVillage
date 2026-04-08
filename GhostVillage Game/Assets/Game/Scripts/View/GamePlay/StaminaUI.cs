using UnityEngine;
using UnityEngine.UI;
using Photon.Pun;
using GhostVillage.Gameplay.Shared;

public class StaminaUI : MonoBehaviour
{
    [Header("UI References")]
    [Tooltip("Kéo cái RectTransform của thanh Fill (Xanh lá) vào đây")]
    [SerializeField] private RectTransform _staminaFillRect;

    [Tooltip("Kéo Component Image của thanh Fill vào đây để đổi màu")]
    [SerializeField] private Image _staminaFillImage;

    [Header("Settings")]
    [Tooltip("Bề rộng tối đa của thanh Stamina khi đầy 100%")]
    [SerializeField] private float _maxBarWidth = 300f; // ÉP CỨNG SỐ NÀY, KHÔNG TỰ ĐỘNG SỬA NỮA!

    [Tooltip("Màu Xanh khi Stamina dồi dào")]
    [SerializeField] private Color _normalColor = new Color(0f, 1f, 0.2f, 1f); // Xanh lá

    [Tooltip("Màu Đỏ khi bị thở dốc (Dưới ngưỡng)")]
    [SerializeField] private Color _exhaustedColor = new Color(1f, 0.2f, 0.2f, 1f); // Đỏ tươi

    private PlayerStatsManager _localPlayerStats;
    private bool _hasFoundPlayer = false;

    private void Update()
    {
        // 1. Tìm Local Player nếu chưa có
        if (!_hasFoundPlayer)
        {
            FindLocalPlayerStats();
            return;
        }

        // 2. Nếu Player chết hay mất kết nối thì dừng
        if (_localPlayerStats == null)
        {
            _hasFoundPlayer = false;
            return;
        }

        // 3. Lấy thông số từ PlayerStatsManager
        float currentStamina = _localPlayerStats.CurrentStamina;
        float maxStamina = _localPlayerStats.MaxStamina;
        bool isExhausted = _localPlayerStats.IsExhausted;

        // Tránh lỗi chia cho 0
        if (maxStamina <= 0) return;

        // Ép tỷ lệ luôn nằm trong khoảng 0-1
        float ratio = Mathf.Clamp01(currentStamina / maxStamina);

        // ==========================================
        // 4. CẬP NHẬT ĐỘ RỘNG (WIDTH)
        // ==========================================
        if (_staminaFillRect != null)
        {
            float targetWidth = ratio * _maxBarWidth;
            _staminaFillRect.sizeDelta = new Vector2(targetWidth, _staminaFillRect.sizeDelta.y);
        }

        // ==========================================
        // 5. CẬP NHẬT MÀU SẮC (Xanh / Đỏ)
        // ==========================================
        if (_staminaFillImage != null)
        {
            // Lấy ngưỡng đỏ (20%) từ PlayerStatsManager
            float redZone = _localPlayerStats.RedZoneThreshold;

            // [FIX CHÍ MẠNG]: Nếu bị kiệt sức HOẶC lượng máu đang rớt vào vùng 20% cuối -> BÁO ĐỎ
            if (isExhausted || ratio <= redZone)
            {
                _staminaFillImage.color = _exhaustedColor;
            }
            else
            {
                // Trồi lên trên 20% và hết mệt -> MỚI ĐƯỢC XANH
                _staminaFillImage.color = _normalColor;
            }
        }
    }

    private void FindLocalPlayerStats()
    {
        // Tìm tất cả PlayerStatsManager trong Scene
        var allStats = FindObjectsByType<PlayerStatsManager>(FindObjectsSortMode.None);
        foreach (var stat in allStats)
        {
            // Chỉ lấy thằng nào thuộc về máy của mình
            if (stat.photonView != null && stat.photonView.IsMine)
            {
                _localPlayerStats = stat;
                _hasFoundPlayer = true;

                Debug.Log("<color=green>[StaminaUI] Đã tìm thấy Local Player và móc nối thành công!</color>");
                break;
            }
        }
    }
}