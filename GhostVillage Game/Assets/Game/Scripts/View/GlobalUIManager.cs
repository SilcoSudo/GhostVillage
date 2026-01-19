// File: src/Game/UI/Core/GlobalUIManager.cs
using UnityEngine;
using Cysharp.Threading.Tasks;
using System.Threading; // Thêm namespace này

namespace Game.Script.UI
{
    public class GlobalUIManager : MonoBehaviour
    {
        [SerializeField] private GameObject _loadingPanel;
        private const float LOADING_TIMEOUT = 30f;

        // Hàm ShowLoading chuẩn chỉnh
        public void ShowLoading(bool show)
        {
            if (_loadingPanel == null) return;

            Debug.Log($"GlobalUIManager: ShowLoading {show}");
            _loadingPanel.SetActive(show);

            if (show)
            {
                // Truyền CancellationToken của chính Object này vào Task
                // Nếu GlobalUIManager bị hủy, Task sẽ tự động dừng lại
                LoadingTimeoutTask(this.GetCancellationTokenOnDestroy()).Forget();
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
    }
}