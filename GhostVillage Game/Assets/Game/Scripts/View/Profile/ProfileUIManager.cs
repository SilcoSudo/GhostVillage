using UnityEngine;
using VContainer;
using GhostVillage.Domain.Profile;
using Cysharp.Threading.Tasks;
using UnityEngine.UI;
using System.Threading;
using System;
using Game.Core.Scene;

public class ProfileUIManager : MonoBehaviour 
{
    [Inject] private readonly ProfileController _controller;
    [Inject] private readonly SceneLoaderService _sceneLoader;
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

    private Pfb_ProfileViewBinding _profileBinding;
    private Pfb_HistoryViewBinding _historyBinding;
    private Pfb_AchievementViewBinding _achievementBinding;
    
    private CancellationTokenSource _cts;

    private void OnEnable() => _cts = new CancellationTokenSource();
    private void OnDisable() { _cts?.Cancel(); _cts?.Dispose(); }
    private void Start() => InitializeAsync().Forget();

    private async UniTaskVoid InitializeAsync() 
    {
        await UniTask.SwitchToMainThread();
        InitializeAllViews();
        OnTabClick(0);
    }

    private void InitializeAllViews() 
    {
        _profileBinding = SetupView<Pfb_ProfileViewBinding>(pfbProfileView, profileContainer);
        _historyBinding = SetupView<Pfb_HistoryViewBinding>(pfbHistoryView, historyContainer);
        _achievementBinding = SetupView<Pfb_AchievementViewBinding>(pfbAchievementView, achievementContainer);
        if (_profileBinding.btnOpenSelector != null) {
            _profileBinding.btnOpenSelector.onClick.AddListener(OpenMedalSelector);
        }
        if (_profileBinding.objMedalSelector.TryGetComponent<Button>(out var bgBtn)) {
            bgBtn.onClick.AddListener(() => _profileBinding.objMedalSelector.SetActive(false));
        }
        if (_profileBinding.btnSaveMedals != null) {
            _profileBinding.btnSaveMedals.onClick.AddListener(() => SaveMedals().Forget());
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
        if (_profileBinding != null && _profileBinding.objMedalSelector != null) {
            _profileBinding.objMedalSelector.SetActive(false);
        }
        profileContainer.gameObject.SetActive(index == 0);
        historyContainer.gameObject.SetActive(index == 1);
        achievementContainer.gameObject.SetActive(index == 2);
        UpdateTabDataAsync(index).Forget();
    }

    private async UniTaskVoid UpdateTabDataAsync(int index) 
    {
        try {
            var data = await _controller.RefreshTabData(index).AttachExternalCancellation(_cts.Token);
            if (this == null || !gameObject.activeInHierarchy) return;
            if (data != null) RefreshSpecificTab(index, data);
        }
        catch (OperationCanceledException) { }
    }

    private void RefreshSpecificTab(int index, FullProfileDTO data)
    {
        switch(index) {
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
        _profileBinding.txtUID.text = $"UID: {p.userId}";
        _profileBinding.txtLevel.text = p.level.ToString();
        _profileBinding.txtTotalMatches.text = p.totalMatches.ToString();
        _profileBinding.sldLevelProgress.maxValue = p.nextLevelExp;
        _profileBinding.sldLevelProgress.value = p.exp;
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

        if (data.history == null || data.history.Count == 0) {
            if (_historyBinding.emptyStateObject != null) _historyBinding.emptyStateObject.SetActive(true);
            return;
        }

        if (_historyBinding.emptyStateObject != null) _historyBinding.emptyStateObject.SetActive(false);

        foreach (var item in data.history) {
            // Sinh Item vào Content (itemParent)
            var go = Instantiate(itemHistoryPrefab, _historyBinding.itemParent);
            go.SetActive(true);

            RectTransform rect = go.GetComponent<RectTransform>();
            if (rect != null) {
                rect.localScale = Vector3.one;
                rect.localRotation = Quaternion.identity;
            }

            if (go.TryGetComponent<Item_MatchHistoryUI>(out var itemUI)) {
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

        foreach (var item in data.achievements) {
            var go = Instantiate(itemAchievementPrefab, _achievementBinding.itemParent);
            go.SetActive(true);
            
            RectTransform rect = go.GetComponent<RectTransform>();
            if (rect != null) {
                rect.localScale = Vector3.one;
                rect.localRotation = Quaternion.identity;
            }

            if (go.TryGetComponent<Item_AchievementUI>(out var itemUI)) {
                itemUI.Setup(item, () => HandleClaim(item.id).Forget());
            }
        }
        RefreshLayout(_achievementBinding.itemParent);
    }

    private async UniTaskVoid HandleClaim(string id) {
        bool success = await _controller.ClaimAchievement(id);
        if (success) OnTabClick(2); 
    }

    private T SetupView<T>(GameObject prefab, Transform parent) where T : Component {
        if (parent == null || prefab == null) return null;
        ClearContainer(parent);
        var go = Instantiate(prefab, parent);
        return go.GetComponent<T>();
    }

    private void ClearContainer(Transform container) {
        if (container == null) return;
        for (int i = container.childCount - 1; i >= 0; i--) {
            DestroyImmediate(container.GetChild(i).gameObject);
        }
    }

    // Hàm bổ trợ để ép UI cập nhật lại vị trí
    private void RefreshLayout(Transform content) {
        if (content.TryGetComponent<RectTransform>(out var rect)) {
            Canvas.ForceUpdateCanvases();
            LayoutRebuilder.ForceRebuildLayoutImmediate(rect);
        }
    }

    private void OpenMedalSelector() {
        _profileBinding.objMedalSelector.SetActive(true);
        // Copy danh sách hiện tại từ masterData sang temp để bắt đầu chỉnh sửa
        _controller.SetTempMedals(_controller.GetCurrentData().selectedMedals);
        RefreshMedalGrid();
    }

    private void RefreshMedalGrid() {
        var data = _controller.GetCurrentData();
        
        if (data.achievements == null || data.achievements.Count == 0) {
            Debug.LogWarning("Dữ liệu thành tựu chưa được nạp!");
            return;
        }

        ClearContainer(_profileBinding.medalGridContent);
        var allMedals = data.achievements.FindAll(a => a.isClaimed);

        foreach (var medal in allMedals) {
            var go = Instantiate(itemSelectMedalPrefab, _profileBinding.medalGridContent);
            Sprite icon = _profileBinding.GetMedalSprite(medal.id); 
            
            // Lấy trạng thái từ danh sách TẠM THỜI (Temp) để hiện dấu tích
            bool isSelected = _controller.GetTempMedals().Contains(medal.id);
            
            go.GetComponent<Item_SelectMedalUI>().Setup(medal, isSelected, icon, () => {
                _controller.ToggleMedalInList(medal.id);
                RefreshMedalGrid(); // Vẽ lại để cập nhật dấu tích ngay lập tức
            });
        }
    }

    private async UniTaskVoid SaveMedals() {
        Debug.Log("<color=orange>[UI]</color> Đang gửi yêu cầu lưu Medal...");
        
        bool success = await _controller.SaveSelectedMedalsToServer();
        
        if (success) {
            // Đóng bảng chọn
            _profileBinding.objMedalSelector.SetActive(false);
            // Gọi RenderProfileTab để vẽ lại giao diện chính.
            RenderProfileTab(_controller.GetCurrentData());
            
            Debug.Log("<color=green>[UI]</color> Medal đã được cập nhật ngay lập tức!");
        } else {
            Debug.LogError("<color=red>[UI]</color> Lưu thất bại. Kiểm tra Log API phía trên.");
        }
    }
}