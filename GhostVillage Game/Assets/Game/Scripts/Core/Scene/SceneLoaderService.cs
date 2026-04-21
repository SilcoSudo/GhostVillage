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

            // 2. Tải Scene ngầm
            await SceneManager.LoadSceneAsync(sceneName).ToUniTask();

            // 3. (Tư duy kỹ) Chờ thêm 1 chút để các Script ở Scene mới chạy xong Awake/Start
            await UniTask.Yield();

            Debug.Log($" [SceneLoader] Hoàn tất chuyển cảnh: {sceneName}");

            // 4. Tắt Loading Overlay
            if (globalUI != null) globalUI.ShowLoading(false);
        }
    }
}