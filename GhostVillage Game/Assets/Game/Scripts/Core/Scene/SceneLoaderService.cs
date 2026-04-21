using Cysharp.Threading.Tasks;
using UnityEngine.SceneManagement;
using UnityEngine;
using Game.Script.UI; // Để dùng Debug

namespace Game.Core.Scene
{
    public interface ISceneLoaderService
    {
        UniTask LoadSceneAsync(string sceneName);
    }

    public class SceneLoaderService : ISceneLoaderService
    {

        private readonly GlobalUIManager _globalUI;

        public SceneLoaderService(GlobalUIManager globalUI)
        {
            _globalUI = globalUI;
        }
        public async UniTask LoadSceneAsync(string sceneName)
        {
            Debug.Log($"⏳ [SceneLoader] Khởi động màn hình chắn: {sceneName}");

            if (string.IsNullOrWhiteSpace(sceneName))
            {
                Debug.LogError("[SceneLoader] sceneName rỗng/null.");
                return;
            }

            if (!Application.CanStreamedLevelBeLoaded(sceneName))
            {
                Debug.LogError($"[SceneLoader] Scene '{sceneName}' chưa được add vào Build Settings hoặc sai tên.");
                return;
            }

            // 1. Bật Loading Overlay
            _globalUI.ShowLoading(true);

            try
            {
                // 2. Tải Scene ngầm
                AsyncOperation loadOperation = SceneManager.LoadSceneAsync(sceneName);
                if (loadOperation == null)
                {
                    Debug.LogError($"[SceneLoader] SceneManager.LoadSceneAsync trả về null cho scene '{sceneName}'.");
                    return;
                }

                await loadOperation.ToUniTask();

                // 3. Chờ thêm 1 frame để script Scene mới hoàn tất Awake/Start
                await UniTask.Yield();

                Debug.Log($" [SceneLoader] Hoàn tất chuyển cảnh: {sceneName}");
            }
            finally
            {
                // 4. Luôn tắt Loading Overlay kể cả khi lỗi
                _globalUI.ShowLoading(false);
            }
        }
    }
}