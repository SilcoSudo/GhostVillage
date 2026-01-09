using Cysharp.Threading.Tasks;
using UnityEngine.SceneManagement;
using UnityEngine; // Để dùng Debug

namespace Game.Core.Scenes
{
    public interface ISceneLoaderService
    {
        UniTask LoadSceneAsync(string sceneName);
    }

    public class SceneLoaderService : ISceneLoaderService
    {
        public async UniTask LoadSceneAsync(string sceneName)
        {
            Debug.Log($"⏳ [SceneLoader] Bắt đầu load scene: {sceneName}");

            // --- LỖI CŨ CỦA BẠN CÓ THỂ LÀ: ---
            // await SceneManager.LoadSceneAsync(sceneName); 

            // --- CÁCH SỬA ĐÚNG: ---
            // Thêm .ToUniTask() vào cuối để chuyển đổi sang UniTask
            await SceneManager.LoadSceneAsync(sceneName).ToUniTask();

            Debug.Log($"✅ [SceneLoader] Load xong scene: {sceneName}");
        }
    }
}