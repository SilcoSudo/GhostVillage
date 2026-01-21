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

            // 1. Bật Loading Overlay
            _globalUI.ShowLoading(true);

            // 2. Tải Scene ngầm
            await SceneManager.LoadSceneAsync(sceneName).ToUniTask();

            // 3. (Tư duy kỹ) Chờ thêm 1 chút để các Script ở Scene mới chạy xong Awake/Start
            await UniTask.Yield();

            Debug.Log($"✅ [SceneLoader] Hoàn tất chuyển cảnh: {sceneName}");

            // 4. Tắt Loading Overlay
            _globalUI.ShowLoading(false);
        }
    }
}