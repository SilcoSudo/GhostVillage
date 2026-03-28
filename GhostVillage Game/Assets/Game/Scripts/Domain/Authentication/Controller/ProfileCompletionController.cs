using System;
using Cysharp.Threading.Tasks;
using Game.Core.Network;
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
        private readonly GameSession _session;
        private string _token;
        private string _sceneToLoad = "MainMenu";

        public ProfileCompletionController(
            AuthService authService,
            ISceneLoaderService sceneLoader,
            GameSession session)
        {
            _authService = authService;
            _sceneLoader = sceneLoader;
            _session = session;
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

                if (response != null && !string.IsNullOrEmpty(response.token))
                {
                    view.SetStatus("✓ Profile updated! Loading game...");

                    _session.Token = response.token;

                    // Get updated player data
                    await _authService.FetchMyProfileAsync();
                    view.SetStatus("<color=green>✓ Welcome to Ghost Village!</color>");

                    // Brief delay before scene load
                    await UniTask.Delay(1000);

                    await _sceneLoader.LoadSceneAsync(_sceneToLoad);
                }
                else
                {
                    // Keep message generic because this branch can be any server-side failure,
                    // not just age validation.
                    Debug.LogWarning("[ProfileCompletionController] Server rejected profile");
                    view.SetStatus("<color=red>❌ Profile update failed. Please try again.</color>");
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
