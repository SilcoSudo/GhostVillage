// File: src/Game/UI/Core/GlobalUIManager.cs
using UnityEngine;
using Cysharp.Threading.Tasks;
using System.Threading;
using TMPro; // Thêm namespace này

namespace Game.Script.UI
{
    public class GlobalUIManager : MonoBehaviour
    {
        [Header("Popup References")]
        [SerializeField] private GameObject _popupPanel;
        [SerializeField] private TMP_Text _txtTitle;
        [SerializeField] private TMP_Text _txtMessage;

        [SerializeField] private GameObject _loadingPanel;
        [SerializeField] private TMP_Text _txtLoadingMessage; // Kéo Text của Loading vào đây
        private const float LOADING_TIMEOUT = 30f;
        private CancellationTokenSource _cts;

        private void Awake()
        {
            // 1. Đảm bảo Popup và Loading luôn ẩn khi mới vào Game
            if (_popupPanel != null) _popupPanel.SetActive(false);
            if (_loadingPanel != null) _loadingPanel.SetActive(false);

            // Giữ cho Object này tồn tại xuyên suốt các Scene (nếu chưa làm ở AppLifetimeScope)
            // DontDestroyOnLoad(gameObject); 
        }

        // Hàm ShowLoading chuẩn chỉnh
        public void ShowLoading(bool show, string msg = "Loading...")
        {
            if (_loadingPanel == null) return;

            _loadingPanel.SetActive(show);

            if (show)
            {
                if (_txtLoadingMessage != null) _txtLoadingMessage.text = msg;

                if (_cts != null) { _cts.Cancel(); _cts.Dispose(); }
                _cts = new CancellationTokenSource();
                LoadingTimeoutTask(_cts.Token).Forget();
            }
            else
            {
                if (_cts != null) { _cts.Cancel(); _cts.Dispose(); _cts = null; }
            }
        }

        private async UniTaskVoid LoadingTimeoutTask(CancellationToken token)
        {
            try
            {
                // Đợi 30s nhưng có kèm token kiểm soát
                await UniTask.Delay((int)(LOADING_TIMEOUT * 1000), cancellationToken: token);

                // Kiểm tra an toàn trước khi truy cập
                if (_loadingPanel != null && _loadingPanel.activeInHierarchy)
                {
                    Debug.LogWarning($"⚠️ Loading timeout sau {LOADING_TIMEOUT}s. Tự động ẩn.");
                    _loadingPanel.SetActive(false);
                }
            }
            catch (System.OperationCanceledException)
            {
                // Task bị hủy khi Object bị Destroy - Đây là hành vi bình thường, không phải lỗi
                Debug.Log("Task loading đã được hủy an toàn.");
            }
        }

        public void ShowError(string title, string message)
        {
            if (_popupPanel == null) return;
            _txtTitle.text = title;
            _txtMessage.text = message;
            _popupPanel.SetActive(true);
        }

        public void ClosePopup() => _popupPanel.SetActive(false);
    }
}