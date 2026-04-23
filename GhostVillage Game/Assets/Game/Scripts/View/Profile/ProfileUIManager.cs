using UnityEngine;
using VContainer;
using GhostVillage.Domain.Profile;
using Cysharp.Threading.Tasks;
using UnityEngine.UI;
using System.Threading;
using System;
using Game.Core.Scene;
using Game.Core.Network;

public class ProfileUIManager : MonoBehaviour
{
    [Inject] private readonly ProfileController _controller;
    [Inject] private readonly SceneLoaderService _sceneLoader;
    [Inject] private readonly GameSession _session;
    [SerializeField] private Button _btnBack;

    [Header("Tab Containers")]
    [SerializeField] private Transform profileContainer;
    [SerializeField] private Transform historyContainer;
    [SerializeField] private Transform achievementContainer;

    [Header("View Prefabs")]
    [SerializeField] private GameObject pfbProfileView;
    [SerializeField] private GameObject pfbHistoryView;
    [SerializeField] private GameObject pfbAchievementView;

    [Header("Item Prefabs")]
    [SerializeField] private GameObject itemHistoryPrefab;
    [SerializeField] private GameObject itemAchievementPrefab;
    [SerializeField] private GameObject itemSelectMedalPrefab;
    [SerializeField] private GameObject itemSelectAvatarPrefab;

    private Pfb_ProfileViewBinding _profileBinding;
    private Pfb_HistoryViewBinding _historyBinding;
    private Pfb_AchievementViewBinding _achievementBinding;

    private CancellationTokenSource _cts;

    private void OnEnable() => _cts = new CancellationTokenSource();
    private void OnDisable() { _cts?.Cancel(); _cts?.Dispose(); }
    private void Start() => InitializeAsync().Forget();

    private async UniTaskVoid InitializeAsync()
    {
        Debug.Log($"<color=yellow>[ProfileUIManager] Khởi tạo Profile Scene - UID: {_session.UID}</color>");
        await UniTask.SwitchToMainThread();
        InitializeAllViews();
        OnTabClick(0);
    }

    private void InitializeAllViews()
    {
        _profileBinding = SetupView<Pfb_ProfileViewBinding>(pfbProfileView, profileContainer);
        _historyBinding = SetupView<Pfb_HistoryViewBinding>(pfbHistoryView, historyContainer);
        _achievementBinding = SetupView<Pfb_AchievementViewBinding>(pfbAchievementView, achievementContainer);

        // ========================================================
        // 1. MÓC NỐI SỰ KIỆN CHO MODAL HUY CHƯƠNG (CŨ)
        // ========================================================
        if (_profileBinding.btnOpenSelector != null)
        {
            _profileBinding.btnOpenSelector.onClick.AddListener(OpenMedalSelector);
        }
        if (_profileBinding.objMedalSelector.TryGetComponent<Button>(out var bgBtn))
        {
            bgBtn.onClick.AddListener(() => _profileBinding.objMedalSelector.SetActive(false));
        }
        if (_profileBinding.btnSaveMedals != null)
        {
            _profileBinding.btnSaveMedals.onClick.AddListener(() => SaveMedals().Forget());
        }

        // Đảm bảo lúc mới vô là Modal Huy chương bị tắt
        if (_profileBinding.objMedalSelector != null)
        {
            _profileBinding.objMedalSelector.SetActive(false);
        }

        // ========================================================
        // 2. MÓC NỐI SỰ KIỆN CHO MODAL AVATAR (MỚI THÊM)
        // ========================================================
        if (_profileBinding.btnOpenAvatarSelector != null)
        {
            _profileBinding.btnOpenAvatarSelector.onClick.AddListener(OpenAvatarSelector);
        }

        // Bấm ra ngoài rìa để đóng bảng Avatar (Nếu cục cha ngoài cùng có component Button)
        if (_profileBinding.objAvatarSelector.TryGetComponent<Button>(out var avatarBgBtn))
        {
            avatarBgBtn.onClick.AddListener(CloseAvatarSelector);
        }

        // Bắt sự kiện bấm nút Save Avatar
        if (_profileBinding.btnSaveAvatar != null)
        {
            _profileBinding.btnSaveAvatar.onClick.RemoveAllListeners();
            _profileBinding.btnSaveAvatar.onClick.AddListener(() => SaveAvatar().Forget());
        }

        // Đảm bảo lúc mới vô là Modal Avatar bị tắt
        if (_profileBinding.objAvatarSelector != null)
        {
            _profileBinding.objAvatarSelector.SetActive(false);
        }
    }

    private void OpenAvatarSelector()
    {
        if (_profileBinding == null || _profileBinding.objAvatarSelector == null) return;

        // Tắt Modal Medal
        _profileBinding.objMedalSelector.SetActive(false);

        // Lấy Avatar ID hiện tại của player để làm gốc
        var data = _controller.GetCurrentData();

        // ========================================================
        // [FIX LỖI CS0103]: Xài hàm của Controller thay vì cái biến cũ đã bị xóa!
        // ========================================================
        _controller.SetTempAvatar(data?.profile?.avatar);

        // Bật Modal Avatar
        _profileBinding.objAvatarSelector.SetActive(true);

        // GỌI HÀM VẼ 5 CÁI HÌNH RA!
        RefreshAvatarGrid();
    }

    private void CloseAvatarSelector()
    {
        if (_profileBinding != null && _profileBinding.objAvatarSelector != null)
        {
            _profileBinding.objAvatarSelector.SetActive(false);
        }
    }

    private void Awake()
    {
        if (_btnBack != null)
        {
            _btnBack.onClick.AddListener(OnBackClicked);
        }
    }

    private void OnBackClicked()
    {
        _sceneLoader.LoadSceneAsync("MainMenu").Forget();
    }

    public void OnTabClick(int index)
    {
        if (this == null) return;
        // Đóng bảng chọn Medal khi rời khỏi Profile
        if (_profileBinding != null && _profileBinding.objMedalSelector != null)
        {
            _profileBinding.objMedalSelector.SetActive(false);
        }
        profileContainer.gameObject.SetActive(index == 0);
        historyContainer.gameObject.SetActive(index == 1);
        achievementContainer.gameObject.SetActive(index == 2);
        UpdateTabDataAsync(index).Forget();
    }

    private async UniTaskVoid UpdateTabDataAsync(int index)
    {
        try
        {
            var data = await _controller.RefreshTabData(index).AttachExternalCancellation(_cts.Token);
            if (this == null || !gameObject.activeInHierarchy) return;
            if (data != null) RefreshSpecificTab(index, data);
        }
        catch (OperationCanceledException) { }
    }

    private void RefreshSpecificTab(int index, FullProfileDTO data)
    {
        switch (index)
        {
            case 0: RenderProfileTab(data); break;
            case 1: RenderHistoryTab(data); break;
            case 2: RenderAchievementTab(data); break;
        }
    }

    private void RenderProfileTab(FullProfileDTO data)
    {
        if (_profileBinding == null || data.profile == null) return;
        var p = data.profile;

        _profileBinding.txtName.text = p.displayName;

        // [FIX 1]: Lấy trường 'data.uid' (8 số) thay vì 'p.userId' (chuỗi dài của Mongo)
        _profileBinding.txtUID.text = $"UID: {data.uid}";

        _profileBinding.txtLevel.text = p.level.ToString();
        _profileBinding.txtTotalMatches.text = p.totalMatches.ToString();

        _profileBinding.sldLevelProgress.maxValue = p.nextLevelExp;
        _profileBinding.sldLevelProgress.value = p.exp;

        // [FIX 2]: Ép text hiển thị "Hiện tại / Max" lên thanh EXP
        if (_profileBinding.txtExpValue != null)
        {
            _profileBinding.txtExpValue.text = $"{p.exp} / {p.nextLevelExp}";
        }

        // [FIX 3]: Set avatar image từ avatar ID
        if (!string.IsNullOrEmpty(p.avatar) && _profileBinding.imgAvatar != null)
        {
            Sprite avatarSprite = _profileBinding.GetAvatarSprite(p.avatar);
            _profileBinding.imgAvatar.sprite = avatarSprite;
            _profileBinding.imgAvatar.color = Color.white; // Đảm bảo hiển thị rõ
        }

        for (int i = 0; i < _profileBinding.equippedMedalIcons.Length; i++)
        {
            _profileBinding.equippedMedalIcons[i].gameObject.SetActive(true);

            if (data.selectedMedals != null && i < data.selectedMedals.Count)
            {
                string mId = data.selectedMedals[i];
                Sprite medalIcon = _profileBinding.GetMedalSprite(mId);

                _profileBinding.equippedMedalIcons[i].sprite = medalIcon;
                _profileBinding.equippedMedalIcons[i].color = Color.white; // Hiện rõ icon
            }
            else
            {
                // Trường hợp trống: Hiện nền đen default
                _profileBinding.equippedMedalIcons[i].sprite = null;
                _profileBinding.equippedMedalIcons[i].color = new Color(0, 0, 0, 0.6f);
            }
        }
    }

    private void RenderHistoryTab(FullProfileDTO data)
    {
        if (_historyBinding == null || _historyBinding.itemParent == null) return;

        ClearContainer(_historyBinding.itemParent);

        if (data.history == null || data.history.Count == 0)
        {
            if (_historyBinding.emptyStateObject != null) _historyBinding.emptyStateObject.SetActive(true);
            return;
        }

        if (_historyBinding.emptyStateObject != null) _historyBinding.emptyStateObject.SetActive(false);

        foreach (var item in data.history)
        {
            // Sinh Item vào Content (itemParent)
            var go = Instantiate(itemHistoryPrefab, _historyBinding.itemParent);
            go.SetActive(true);

            RectTransform rect = go.GetComponent<RectTransform>();
            if (rect != null)
            {
                rect.localScale = Vector3.one;
                rect.localRotation = Quaternion.identity;
            }

            if (go.TryGetComponent<Item_MatchHistoryUI>(out var itemUI))
            {
                itemUI.Setup(item);
            }
        }

        RefreshLayout(_historyBinding.itemParent);
    }

    private void RenderAchievementTab(FullProfileDTO data)
    {
        if (_achievementBinding == null || _achievementBinding.itemParent == null) return;
        ClearContainer(_achievementBinding.itemParent);

        if (data.achievements == null) return;

        foreach (var item in data.achievements)
        {
            var go = Instantiate(itemAchievementPrefab, _achievementBinding.itemParent);
            go.SetActive(true);

            RectTransform rect = go.GetComponent<RectTransform>();
            if (rect != null)
            {
                rect.localScale = Vector3.one;
                rect.localRotation = Quaternion.identity;
            }

            if (go.TryGetComponent<Item_AchievementUI>(out var itemUI))
            {
                itemUI.Setup(item, () => HandleClaim(item.id).Forget());
            }
        }
        RefreshLayout(_achievementBinding.itemParent);
    }

    private async UniTaskVoid HandleClaim(string id)
    {
        bool success = await _controller.ClaimAchievement(id);
        if (success) OnTabClick(2);
    }

    private T SetupView<T>(GameObject prefab, Transform parent) where T : Component
    {
        if (parent == null || prefab == null) return null;
        ClearContainer(parent);
        var go = Instantiate(prefab, parent);
        return go.GetComponent<T>();
    }

    // Thay nguyên cái hàm cũ bằng hàm này
    private void ClearContainer(Transform container)
    {
        if (container == null) return;
        for (int i = container.childCount - 1; i >= 0; i--)
        {
            // [FIX CHÍ MẠNG]: Tuyệt đối không dùng DestroyImmediate ở Runtime!
            Destroy(container.GetChild(i).gameObject);
        }
    }

    // Hàm bổ trợ để ép UI cập nhật lại vị trí
    private void RefreshLayout(Transform content)
    {
        if (content.TryGetComponent<RectTransform>(out var rect))
        {
            Canvas.ForceUpdateCanvases();
            LayoutRebuilder.ForceRebuildLayoutImmediate(rect);
        }
    }

    private void OpenMedalSelector()
    {
        _profileBinding.objMedalSelector.SetActive(true);
        // Copy danh sách hiện tại từ masterData sang temp để bắt đầu chỉnh sửa
        _controller.SetTempMedals(_controller.GetCurrentData().selectedMedals);
        RefreshMedalGrid();
    }

    private void RefreshMedalGrid()
    {
        var data = _controller.GetCurrentData();

        if (data.achievements == null || data.achievements.Count == 0)
        {
            Debug.LogWarning("<color=red>[ProfileUI]</color> Dữ liệu thành tựu chưa được nạp!");
            return;
        }

        ClearContainer(_profileBinding.medalGridContent);

        // Lấy tất cả các thành tựu đã claim (đã nhận huy chương)
        var allMedals = data.achievements.FindAll(a => a.isClaimed);
        Debug.Log($"<color=cyan>[ProfileUI]</color> Tìm thấy {allMedals.Count} huy chương đã mở khóa để vẽ lên Modal.");

        foreach (var medal in allMedals)
        {
            var go = Instantiate(itemSelectMedalPrefab, _profileBinding.medalGridContent);
            go.SetActive(true); // Ép nó hiện lên phòng hờ Prefab gốc bị tắt

            // ========================================================
            // [FIX CHÍ MẠNG]: Trị bệnh Unity bóp Scale tàng hình Item!
            // ========================================================
            if (go.TryGetComponent<RectTransform>(out var rect))
            {
                rect.localScale = Vector3.one; // Ép Scale về 1x1x1
                rect.localRotation = Quaternion.identity;
                rect.localPosition = new Vector3(rect.localPosition.x, rect.localPosition.y, 0);
            }

            Sprite icon = _profileBinding.GetMedalSprite(medal.id);

            // Lấy trạng thái từ danh sách TẠM THỜI (Temp) để hiện dấu tích
            bool isSelected = _controller.GetTempMedals().Contains(medal.id);

            if (go.TryGetComponent<Item_SelectMedalUI>(out var medalUI))
            {
                medalUI.Setup(medal, isSelected, icon, () =>
                {
                    _controller.ToggleMedalInList(medal.id);
                    RefreshMedalGrid(); // Vẽ lại để cập nhật dấu tích ngay lập tức
                });
            }
        }

        RefreshLayout(_profileBinding.medalGridContent);
    }

    // ========================================================
    // HÀM VẼ DANH SÁCH AVATAR
    // ========================================================
    // ========================================================
    // HÀM VẼ DANH SÁCH AVATAR
    // ========================================================
    private void RefreshAvatarGrid()
    {
        if (_profileBinding == null || _profileBinding.avatarLibrary == null)
        {
            Debug.LogError("<color=red>[ProfileUI] Lỗi: _profileBinding hoặc avatarLibrary đang bị NULL!</color>");
            return;
        }

        // Xóa sạch rác cũ trước khi vẽ
        ClearContainer(_profileBinding.avatarGridContent);

        Debug.Log($"<color=cyan>[ProfileUI] Đang vẽ {_profileBinding.avatarLibrary.Count} cái Avatar ra màn hình...</color>");

        // Duyệt qua 5 cái hình sếp đã cấu hình trong Inspector
        foreach (var avatarMap in _profileBinding.avatarLibrary)
        {
            if (itemSelectAvatarPrefab == null)
            {
                Debug.LogError("<color=red>[ProfileUI] Lỗi: Sếp quên kéo itemSelectAvatarPrefab vào ProfileUIManager rồi kìa!</color>");
                return;
            }

            // Đẻ Prefab ra
            var go = Instantiate(itemSelectAvatarPrefab, _profileBinding.avatarGridContent);
            go.SetActive(true); // Ép nó hiện lên (Phòng hờ cái Prefab gốc sếp lỡ tắt)

            // ========================================================
            // [FIX CHÍ MẠNG]: Trị bệnh Unity tự bóp Scale tàng hình Item
            // ========================================================
            if (go.TryGetComponent<RectTransform>(out var rect))
            {
                rect.localScale = Vector3.one; // Ép Scale về 1x1x1
                rect.localRotation = Quaternion.identity;
                rect.localPosition = new Vector3(rect.localPosition.x, rect.localPosition.y, 0);
            }

            var itemUI = go.GetComponent<Item_SelectAvatarUI>();

            // Kiểm tra xem thằng này có đang được chọn không (để hiện viền vàng)
            bool isSelected = (_controller.GetTempAvatar() == avatarMap.avatarId);

            if (itemUI != null)
            {
                itemUI.Setup(avatarMap.avatarId, avatarMap.avatarSprite, isSelected, (selectedId) =>
                {
                    // Lưu ID vào Controller
                    _controller.SetTempAvatar(selectedId);
                    RefreshAvatarGrid(); // Vẽ lại để cập nhật viền Vàng
                });
            }
        }

        // ========================================================
        // [FIX CHÍ MẠNG 2]: Ép cái khung lưới tính toán lại chiều cao
        // ========================================================
        RefreshLayout(_profileBinding.avatarGridContent);
    }
    private async UniTaskVoid SaveMedals()
    {
        Debug.Log("<color=orange>[UI]</color> Đang gửi yêu cầu lưu Medal...");

        bool success = await _controller.SaveSelectedMedalsToServer();

        if (success)
        {
            // Đóng bảng chọn
            _profileBinding.objMedalSelector.SetActive(false);
            // Gọi RenderProfileTab để vẽ lại giao diện chính.
            RenderProfileTab(_controller.GetCurrentData());

            Debug.Log("<color=green>[UI]</color> Medal đã được cập nhật ngay lập tức!");
        }
        else
        {
            Debug.LogError("<color=red>[UI]</color> Lưu thất bại. Kiểm tra Log API phía trên.");
        }
    }

    // ========================================================
    // [MỚI] LƯU AVATAR LÊN SERVER
    // ========================================================
    private async UniTaskVoid SaveAvatar()
    {
        Debug.Log("<color=orange>[UI]</color> Đang gửi yêu cầu lưu Avatar...");

        // Khóa nút Save lại phòng chống Spam click
        if (_profileBinding.btnSaveAvatar != null) _profileBinding.btnSaveAvatar.interactable = false;

        bool success = await _controller.SaveAvatarToServer();

        if (success)
        {
            Debug.Log("<color=green>[UI]</color> Lưu Avatar thành công!");

            // Đóng bảng chọn Avatar
            CloseAvatarSelector();

            // Render lại màn hình Profile chính (Nó sẽ tự động bốc hình Avatar mới nhất từ MasterData)
            RenderProfileTab(_controller.GetCurrentData());
        }
        else
        {
            Debug.LogError("<color=red>[UI]</color> Lưu Avatar thất bại!");
        }

        // Mở khóa lại nút Save
        if (_profileBinding.btnSaveAvatar != null) _profileBinding.btnSaveAvatar.interactable = true;
    }
}