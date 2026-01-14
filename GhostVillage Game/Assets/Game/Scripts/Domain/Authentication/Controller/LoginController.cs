using Cysharp.Threading.Tasks;
using Game.Core.Scene;
using Game.Domain.Authentication;
using UnityEngine;

namespace Game.UI.Login
{
    public class LoginController
    {
        private readonly AuthService _authService;
        private readonly ISceneLoaderService _sceneLoader;

        public LoginController(AuthService authService, ISceneLoaderService sceneLoader)
        {
            _authService = authService;
            _sceneLoader = sceneLoader;
        }

        public async void HandleLogin(string email, string password, LoginUI view)
        {
            // 1. Khóa nút để tránh spam
            view.SetInteractable(false);
            view.SetStatus("Connecting to Server...");

            // 2. Gọi API Login (Hàm bạn đã viết xong)
            bool isSuccess = await _authService.LoginAsync(email, password);

            if (isSuccess)
            {
                view.SetStatus("<color=green>Login Success!</color>");
                await UniTask.Delay(500); // Đợi xíu cho đẹp

                // 3. Chuyển sang Main Menu (Tên Scene phải khớp Build Settings)
                await _sceneLoader.LoadSceneAsync("MainMenu");
            }
            else
            {
                view.SetStatus("<color=red>Login Failed! Check Info.</color>");
                view.SetInteractable(true); // Mở lại nút cho nhập lại
            }
        }
    }
}