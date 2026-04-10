using UnityEngine;
using UnityEngine.UI;
using UnityEngine.InputSystem;
using Photon.Pun;
using Game.Core.Player.RayCast;

public class ReviveQTEManager : MonoBehaviour
{
    public static ReviveQTEManager Instance;

    [Header("--- PANEL NGƯỜI CỨU (SAVIOR) ---")]
    public GameObject grpSavior;
    public RectTransform barBackground;
    public RectTransform hitZone;
    public RectTransform sweeperLine;

    [Header("--- PANEL NẠN NHÂN (VICTIM) ---")]
    public GameObject grpVictim;

    [Tooltip("Kéo cái RectTransform của thanh Fill xanh lá vào đây")]
    public RectTransform victimFillBarRect;

    [Tooltip("Kéo cái Image Component của thanh Fill để đổi màu")]
    public Image victimFillBarImage;

    [Tooltip("Bề rộng tối đa của thanh máu khi máu đầy 25/25")]
    public float maxVictimBarWidth = 400f; // Bằng đúng Width của Img_Bar_BG (Nền trắng)

    [Header("QTE Settings")]
    public float baseSpeed = 400f;
    public float baseZoneWidth = 150f;

    private PlayerKnockedState _targetVictim;
    private InventoryManager _saviorInventory;
    private FPSController _saviorFPS;

    private int _successCombo = 0;
    private float _currentSpeed;
    private float _currentZoneWidth;
    private int _direction = 1;
    private bool _isPlaying = false;

    private void Awake()
    {
        if (Instance == null) Instance = this;

        // Mặc định ẩn cả 2 cục đi
        grpSavior.SetActive(false);
        grpVictim.SetActive(false);
    }

    public void StartQTE(PlayerKnockedState victim, InventoryManager inventory, FPSController saviorFPS)
    {
        _targetVictim = victim;
        _saviorInventory = inventory;
        _saviorFPS = saviorFPS;

        _successCombo = 0;
        _direction = 1;
        _isPlaying = true;

        grpSavior.SetActive(true); // Bật giao diện mổ cò
        grpVictim.SetActive(true); // Người cứu cũng được quyền xem máu nạn nhân

        SetupDifficultyLevel();
        RandomizeHitZone();
        sweeperLine.anchoredPosition = new Vector2(0, 0);
    }

    public void StopQTE()
    {
        _isPlaying = false;
        grpSavior.SetActive(false);
        grpVictim.SetActive(false);

        // Nhả chân ra cho thằng cứu đi lại bình thường
        if (_saviorFPS != null) _saviorFPS.isPlayingMinigame = false;

        _targetVictim = null;
        _saviorFPS = null;
    }

    private void Update()
    {
        // ========================================================
        // FIX LỖI: NGƯỜI CỨU TỰ KIỂM TRA MÁU BẠN VÀ TỰ KẾT THÚC QTE
        // ========================================================
        if (_isPlaying && _targetVictim != null)
        {
            // Kiểm tra xem máu nạn nhân đã đầy chưa ngay trong máy của mình
            if (_targetVictim.currentProgress >= _targetVictim.maxProgress)
            {
                OnReviveSuccess(); // TỰ GỌI KHI THẤY ĐÃ CỨU XONG!
                return; // Dừng Update luôn
            }

            // Nếu nạn nhân bỗng dưng biến mất (thoát game, chết)
            if (!_targetVictim.isKnocked)
            {
                StopQTE();
                return;
            }
        }

        if (!_isPlaying || _targetVictim == null) return;

        // 1. NGƯỜI CỨU CẬP NHẬT MÁU NẠN NHÂN LIÊN TỤC TRÊN MÀN HÌNH MÌNH
        UpdateVictimUI(_targetVictim.currentProgress, _targetVictim.maxProgress);

        // 2. KIM QUÉT CHẠY QUA LẠI VÔ TẬN (KHÔNG BỊ PHẠT)
        float moveAmount = _currentSpeed * _direction * Time.deltaTime;
        sweeperLine.anchoredPosition += new Vector2(moveAmount, 0);

        float halfBar = barBackground.rect.width / 2f;
        if (sweeperLine.anchoredPosition.x > halfBar)
        {
            sweeperLine.anchoredPosition = new Vector2(halfBar, 0);
            _direction = -1; // Đụng mép phải -> dội lại
        }
        else if (sweeperLine.anchoredPosition.x < -halfBar)
        {
            sweeperLine.anchoredPosition = new Vector2(-halfBar, 0);
            _direction = 1; // Đụng mép trái -> dội lại
        }

        // 3. CHỈ TÍNH TOÁN KHI BẤM SPACE
        if (Keyboard.current.spaceKey.wasPressedThisFrame)
        {
            CheckHit();
        }

        // 4. HỦY CỨU BỎ CHẠY KHI THẤY QUÁI
        if (Keyboard.current.escapeKey.wasPressedThisFrame)
        {
            StopQTE();
        }
    }

    private void CheckHit()
    {
        float distance = Mathf.Abs(sweeperLine.anchoredPosition.x - hitZone.anchoredPosition.x);
        float zoneHalfWidth = hitZone.rect.width / 2f;

        if (distance <= zoneHalfWidth)
        {
            // === HIT! ===
            float actualHeal = 4f;

            // Check Perk Support: Người Toàn Xá Lợi (Tăng hiệu quả hồi máu)
            if (_saviorFPS != null)
            {
                var stats = _saviorFPS.GetComponent<PlayerStatsManager>();
                if (stats != null) actualHeal *= stats.reviveSpeedMultiplier;
            }

            Debug.Log($"<color=green>[QTE] Hit! (+{actualHeal} máu)</color>");

            // Gửi RPC sang để cộng máu thực tế
            _targetVictim.photonView.RPC("RpcUpdateReviveProgress", RpcTarget.All, actualHeal);

            // CỘNG MÁU ẢO NGAY LẬP TỨC TRÊN MÁY MÌNH ĐỂ TRÁNH LAG (Dự đoán Client)
            _targetVictim.currentProgress += actualHeal;

            _successCombo++;
            SetupDifficultyLevel();
            RandomizeHitZone();
        }
        else
        {
            // === MISS! ===
            Debug.Log("<color=red>[QTE] Miss! Trượt tay rồi (-3 máu)</color>");
            _targetVictim.photonView.RPC("RpcUpdateReviveProgress", RpcTarget.All, -3f);

            // TRỪ MÁU ẢO NGAY LẬP TỨC
            _targetVictim.currentProgress -= 3f;

            if (_successCombo > 0) _successCombo--;
            SetupDifficultyLevel();
        }
    }

    private void SetupDifficultyLevel()
    {
        int level = Mathf.Clamp(_successCombo, 0, 4);
        _currentSpeed = baseSpeed * (1f + (level * 0.2f));
        _currentZoneWidth = baseZoneWidth * (1f - (level * 0.15f));
        hitZone.sizeDelta = new Vector2(_currentZoneWidth, hitZone.sizeDelta.y);
    }

    private void RandomizeHitZone()
    {
        float maxOffset = (barBackground.rect.width / 2f) - (_currentZoneWidth / 2f);
        float randomX = Random.Range(-maxOffset, maxOffset);
        hitZone.anchoredPosition = new Vector2(randomX, 0);
    }

    // GỌI KHI MÁU NẠN NHÂN ĐẦY (Giờ sẽ được gọi ĐÚNG máy của thằng Cứu)
    public void OnReviveSuccess()
    {
        Debug.Log("<color=yellow>[QTE] CỨU SỐNG THÀNH CÔNG!</color>");

        if (_saviorFPS != null && _targetVictim != null)
        {
            // Lấy ID thằng cứu
            int saviorId = _saviorFPS.GetComponent<PhotonView>().OwnerActorNr;

            // Lấy ID thằng bị nạn
            int victimId = _targetVictim.GetComponent<PhotonView>().OwnerActorNr;

            // Bắn loa phát thanh báo hiệu!
            Game.Scripts.Gameplay.Core.GameplayEvents.OnPlayerRescued?.Invoke(saviorId, victimId);

            Debug.Log($"<color=cyan>[Tracker] Đã gửi thông báo cứu người lên Server: {saviorId} cứu {victimId}</color>");
        }

        if (_saviorFPS != null)
        {
            var stats = _saviorFPS.GetComponent<PlayerStatsManager>();
            if (stats != null && _saviorInventory != null && _saviorInventory.items.Length > 0)
            {
                float keepChance = stats.freeConsumableChance;

                keepChance = 0f; // Tạm tắt perk Túi Vải Chàm để test trừ đồ cho mượt

                if (Random.value >= keepChance)
                {
                    var currentItem = _saviorInventory.items[_saviorInventory.currentSlotIndex];
                    _saviorInventory.RemoveItem(currentItem);
                    Debug.Log("<color=red>Đã trừ 1 Medkit khỏi túi!</color>");
                }
                else
                {
                    Debug.Log("<color=magenta>HÊN QUÁ! Túi Vải Chàm giữ lại được Medkit!</color>");
                }

                if (stats.reviveSpeedMultiplier > 1f)
                {
                    Debug.Log("<color=cyan>Đã kích hoạt Buff tốc độ chạy 5s!</color>");
                }
            }
        }
        StopQTE();
    }

    // ==========================================
    // LOGIC DÀNH CHO NẠN NHÂN (CẬP NHẬT MÀU MÁU VÀ WIDTH)
    // ==========================================
    public void UpdateVictimUI(float currentBlood, float maxBlood)
    {
        if (!grpVictim.activeSelf) grpVictim.SetActive(true);

        // Ép tỷ lệ luôn nằm trong khoảng 0-1
        float ratio = Mathf.Clamp01(currentBlood / maxBlood);

        // 1. Cập nhật ĐỘ RỘNG (WIDTH) của thanh máu thay vì fillAmount
        if (victimFillBarRect != null)
        {
            float targetWidth = ratio * maxVictimBarWidth;
            victimFillBarRect.sizeDelta = new Vector2(targetWidth, victimFillBarRect.sizeDelta.y);
        }

        // 2. Đổi màu sắc theo tỷ lệ
        if (victimFillBarImage != null)
        {
            if (ratio > 0.5f)
                victimFillBarImage.color = Color.green;  // Hơn nửa cây -> Xanh
            else if (ratio > 0.33f)
                victimFillBarImage.color = Color.yellow; // Yếu -> Vàng
            else
                victimFillBarImage.color = Color.red;    // Sắp hẻo -> Đỏ
        }

        // 3. Bắn Log chỉ số để theo dõi
        Debug.Log($"<color=white>[QTE Progress]</color> Máu Nạn Nhân: {currentBlood:F1}/{maxBlood} ({ratio * 100:F0}%)");
    }

    public void HideVictimUI()
    {
        grpVictim.SetActive(false);
    }
}