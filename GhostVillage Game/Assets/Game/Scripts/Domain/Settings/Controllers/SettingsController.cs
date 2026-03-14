using R3;
using UnityEngine;
using VContainer;
using Game.Domain.Settings.Data;
using Game.Domain.Settings.Services;
using System;

namespace Game.Domain.Settings.Controllers
{
    public class SettingsController
    {
        private readonly SettingsSaveLoadService _saveLoadService;
        private readonly GraphicsSettingService _graphicsService;
        private readonly AudioSettingService _audioService;
        private readonly InputRebindService _inputService;

        private GameSettingsData _currentData;

        // --- R3 REACTIVE PROPERTIES (Cho UI cắm vào) ---
        // Graphics
        public ReactiveProperty<bool> Is1080p { get; } = new(true);
        public ReactiveProperty<bool> IsFullscreen { get; } = new(true);
        public ReactiveProperty<int> QualityPreset { get; } = new(2);

        // Audio
        public ReactiveProperty<float> MasterVolume { get; } = new(1f);
        public ReactiveProperty<float> SFXVolume { get; } = new(1f);
        public ReactiveProperty<float> MusicVolume { get; } = new(1f);

        [Inject]
        public SettingsController(
        SettingsSaveLoadService saveLoadService,
        GraphicsSettingService graphicsService,
        AudioSettingService audioService,
        InputRebindService inputService) // Thêm dòng này
        {
            _saveLoadService = saveLoadService;
            _graphicsService = graphicsService;
            _audioService = audioService;
            _inputService = inputService; // Thêm dòng này
        }

        // HÀM KHỞI TẠO: Gọi 1 lần lúc bật game
        public void Initialize()
        {
            _currentData = _saveLoadService.LoadSettings();

            // Nạp data vào R3 Properties
            Is1080p.Value = _currentData.Graphics.Is1080p;
            IsFullscreen.Value = _currentData.Graphics.IsFullscreen;
            QualityPreset.Value = _currentData.Graphics.QualityPreset;

            MasterVolume.Value = _currentData.Audio.MasterVolume;
            SFXVolume.Value = _currentData.Audio.SFXVolume;
            MusicVolume.Value = _currentData.Audio.MusicVolume;
            ApplyAllToEngine();

            _inputService.ApplyOverrides(_currentData.Gameplay.KeyBindings);
        }

        public void StartRebind(string actionName, int bindingIndex, Action<string> onUIUpdate)
        {
            _inputService.StartRebind(actionName, bindingIndex, (newPath, displayStr) =>
            {
                // 1. Lưu data vào bộ nhớ
                var overrideData = _currentData.Gameplay.KeyBindings.Find(x => x.ActionName == actionName && x.BindingIndex == bindingIndex);
                if (overrideData == null)
                {
                    overrideData = new KeyBindingOverride { ActionName = actionName, BindingIndex = bindingIndex };
                    _currentData.Gameplay.KeyBindings.Add(overrideData);
                }
                overrideData.OverridePath = newPath;

                // 2. Ghi ra JSON ngay lập tức
                _saveLoadService.SaveSettings(_currentData);

                // 3. Cập nhật chữ trên nút UI
                onUIUpdate?.Invoke(displayStr);
            });
        }

        // Lấy chữ hiển thị cho UI lúc mới bật
        public string GetBindingName(string actionName, int bindingIndex)
        {
            return _inputService.GetDisplayString(actionName, bindingIndex);
        }

        // 5. Cập nhật hàm RestoreDefault
        public void RestoreDefault()
        {
            _saveLoadService.DeleteSettings();
            _inputService.ResetAllBindings(); // Reset Input System về gốc
            Initialize();
            Debug.Log("[SettingsController] Đã khôi phục cài đặt gốc toàn bộ hệ thống!");
        }

        // --- CÁC HÀM UPDATE CHO UI GỌI VÀO ---

        public void UpdateGraphics(bool is1080p, bool isFullscreen, int qualityPreset)
        {
            Is1080p.Value = is1080p;
            IsFullscreen.Value = isFullscreen;
            QualityPreset.Value = qualityPreset;

            _currentData.Graphics.Is1080p = is1080p;
            _currentData.Graphics.IsFullscreen = isFullscreen;
            _currentData.Graphics.QualityPreset = qualityPreset;

            _graphicsService.ApplyGraphics(_currentData.Graphics);
            _saveLoadService.SaveSettings(_currentData);
        }

        public void UpdateAudio(float master, float sfx, float music)
        {
            MasterVolume.Value = master;
            SFXVolume.Value = sfx;
            MusicVolume.Value = music;

            _currentData.Audio.MasterVolume = master;
            _currentData.Audio.SFXVolume = sfx;
            _currentData.Audio.MusicVolume = music;

            _audioService.ApplyAudio(_currentData.Audio);
            _saveLoadService.SaveSettings(_currentData);
        }

        private void ApplyAllToEngine()
        {
            _graphicsService.ApplyGraphics(_currentData.Graphics);
            _audioService.ApplyAudio(_currentData.Audio);
        }
    }
}