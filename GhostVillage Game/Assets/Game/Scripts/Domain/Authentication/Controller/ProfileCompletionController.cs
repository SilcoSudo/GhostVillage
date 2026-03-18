using System;
using Cysharp.Threading.Tasks;
using Game.Core.ReactiveRepo;
using Game.Core.Scene;
using Game.Domain.Authentication;
using Game.Domain.Authentication.DTOs;
using UnityEngine;

namespace Game.UI.Login
{
    /// <summary>
    /// Controller for profile completion flow (Google OAuth incomplete profile)
    /// Handles date of birth submission and profile finalization
    /// </summary>
    public class ProfileCompletionController
    {
        private readonly AuthService _authService;
        private readonly ISceneLoaderService _sceneLoader;
        private readonly PlayerDataSyncService _syncService;
        private string _token;
        private string _sceneToLoad = "MainMenu";

        public ProfileCompletionController(
            AuthService authService,
            ISceneLoaderService sceneLoader,
            PlayerDataSyncService syncService)
        {
            _authService = authService;
            _sceneLoader = sceneLoader;
            _syncService = syncService;
        }

        /// <summary>
        /// Initialize controller with token from Google login
        /// </summary>
        public void Initialize(string token)
        {
            _token = token;
            Debug.Log("[ProfileCompletionController] Initialized with token");
        }

        /// <summary>
        /// Submit date of birth to complete profile
        /// </summary>
        public async void SubmitDateOfBirth(DateTime dateOfBirth, ProfileCompletionUI view)
        {
            if (string.IsNullOrEmpty(_token))
            {
                Debug.LogError("[ProfileCompletionController] Token is null!");
                view.SetStatus("<color=red>❌ Error: Invalid session. Please sign in again.</color>");
                view.SetInteractable(true);
                return;
            }

            view.SetInteractable(false);
            view.SetStatus("⏳ Updating profile...");

            try
            {
                // Submit date of birth to backend
                var response = await _authService.CompleteDateOfBirthAsync(_token, dateOfBirth);

                if (response != null && response.data != null)
                {
                    view.SetStatus("✓ Profile updated! Loading game...");

                    // Get updated player data
                    await _syncService.SyncAllDataAsync(response.data);

                    view.SetStatus("<color=green>✓ Welcome to Ghost Village!</color>");
                    
                    // Brief delay before scene load
                    await UniTask.Delay(1000);
                    
                    await _sceneLoader.LoadSceneAsync(_sceneToLoad);
                }
                else
                {
                    // Server validation error (e.g., user too young)
                    Debug.LogWarning("[ProfileCompletionController] Server rejected profile");
                    view.SetStatus("<color=red>❌ This date of birth cannot be used.\nPlease try again with a valid age (13+).</color>");
                    view.SetInteractable(true);
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[ProfileCompletionController] Error: {ex.Message}");
                view.SetStatus($"<color=red>❌ Error: {ex.Message}\n\nPlease try again.</color>");
                view.SetInteractable(true);
            }
        }
    }
}
