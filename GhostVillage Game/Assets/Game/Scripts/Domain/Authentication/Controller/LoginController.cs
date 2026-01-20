using System;
using Game.Core.ReactiveRepo;
using Game.Core.Scene;
using Game.Domain.Authentication;
using Unity.VisualScripting;
using UnityEngine;

namespace Game.UI.Login
{
    public class LoginController
    {
        [SerializeField]
        private string sceneToLoad = "MainMenu";
        private readonly AuthService _authService;
        private readonly ISceneLoaderService _sceneLoader;
        private readonly PlayerDataSyncService _syncService;

        public LoginController(
            AuthService authService,
            ISceneLoaderService sceneLoader,
            PlayerDataSyncService syncService)
        {
            _authService = authService;
            _sceneLoader = sceneLoader;
            _syncService = syncService;
        }

        public async void HandleLogin(string email, string password, LoginUI view)
        {
            // 1. Khóa nút để tránh spam
            view.SetInteractable(false);
            view.SetStatus("Connecting to Server...");

            var response = await _authService.LoginAsync(email, password);

            if (response != null)
            {
                view.SetStatus("Syncing Player Data...");

                await _syncService.SyncAllDataAsync(response);

                view.SetStatus("<color=green>Đăng nhập thành công!</color>");

                await _sceneLoader.LoadSceneAsync(sceneToLoad);
            }
            else
            {
                view.SetStatus("<color=red>Login Failed!</color>");
                view.SetInteractable(true);
            }
        }
    }
}