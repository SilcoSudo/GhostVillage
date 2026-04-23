using Cysharp.Threading.Tasks;
using UnityEngine.SceneManagement;
using UnityEngine;
using Game.Script.UI;
using VContainer; // Để dùng Debug

namespace Game.Core.Scene
{
    public interface ISceneLoaderService
    {
        UniTask LoadSceneAsync(string sceneName);
    }

    public class SceneLoaderService : ISceneLoaderService
    {
        // Thay vì ôm cứng GlobalUIManager, ta ôm cái IObjectResolver (Tổng đài)
        private readonly IObjectResolver _resolver;

        // Constructor nhận Tổng đài, KHÔNG nhận trực tiếp GlobalUIManager nữa
        public SceneLoaderService(IObjectResolver resolver)
        {
            _resolver = resolver;
        }

        public async UniTask LoadSceneAsync(string sceneName)
        {
            Debug.Log($"⏳ [SceneLoader] Khởi động màn hình chắn: {sceneName}");

            // 1. Khi nào xài thì mới gọi Tổng đài để lấy GlobalUIManager ra
            // Như vầy sẽ không bị lỗi vòng tròn lúc khởi tạo nữa!
            var globalUI = _resolver.Resolve<GlobalUIManager>();

            // Bật Loading Overlay
            if (globalUI != null) globalUI.ShowLoading(true);

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
            }
            finally
            {
                // 4. Tắt Loading Overlay
                if (globalUI != null) globalUI.ShowLoading(false);
            }
        }
    }
}