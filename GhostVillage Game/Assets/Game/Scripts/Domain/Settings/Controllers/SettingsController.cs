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

        // Báo cho UI biết tao vừa reset data nè!
        public event Action OnSettingsRestored;

        // --- R3 REACTIVE PROPERTIES ---
        public ReactiveProperty<bool> Is1080p { get; } = new(true);
        public ReactiveProperty<bool> IsFullscreen { get; } = new(true);
        public ReactiveProperty<int> QualityPreset { get; } = new(2);

        public ReactiveProperty<float> MasterVolume { get; } = new(1f);
        public ReactiveProperty<float> SFXVolume { get; } = new(1f);
        public ReactiveProperty<float> MusicVolume { get; } = new(1f);

        // THÊM ĐỘ NHẠY CHUỘT
        public ReactiveProperty<float> MouseSensitivity { get; } = new(1f);

        [Inject]
        public SettingsController(
        SettingsSaveLoadService saveLoadService,
        GraphicsSettingService graphicsService,
        AudioSettingService audioService,
        InputRebindService inputService)
        {
            _saveLoadService = saveLoadService;
            _graphicsService = graphicsService;
            _audioService = audioService;
            _inputService = inputService;
        }

        public void Initialize()
        {
            _currentData = _saveLoadService.LoadSettings();

            Is1080p.Value = _currentData.Graphics.Is1080p;
            IsFullscreen.Value = _currentData.Graphics.IsFullscreen;
            QualityPreset.Value = _currentData.Graphics.QualityPreset;

            MasterVolume.Value = _currentData.Audio.MasterVolume;
            SFXVolume.Value = _currentData.Audio.SFXVolume;
            MusicVolume.Value = _currentData.Audio.MusicVolume;

            // Lấy độ nhạy chuột từ DB (Giả sử mặc định là 1.0f)
            MouseSensitivity.Value = _currentData.Gameplay.MouseSensitivity;

            ApplyAllToEngine();
            _inputService.ApplyOverrides(_currentData.Gameplay.KeyBindings);
        }

        public void StartRebind(string actionName, int bindingIndex, Action<string> onUIUpdate)
        {
            _inputService.StartRebind(actionName, bindingIndex, (newPath, displayStr) =>
            {
                var overrideData = _currentData.Gameplay.KeyBindings.Find(x => x.ActionName == actionName && x.BindingIndex == bindingIndex);
                if (overrideData == null)
                {
                    overrideData = new KeyBindingOverride { ActionName = actionName, BindingIndex = bindingIndex };
                    _currentData.Gameplay.KeyBindings.Add(overrideData);
                }
                overrideData.OverridePath = newPath;

                _saveLoadService.SaveSettings(_currentData);
                onUIUpdate?.Invoke(displayStr);
            });
        }

        public string GetBindingName(string actionName, int bindingIndex)
        {
            return _inputService.GetDisplayString(actionName, bindingIndex);
        }

        public void RestoreDefault()
        {
            _saveLoadService.DeleteSettings();
            _inputService.ResetAllBindings();
            Initialize(); // Nạp lại data gốc
            Debug.Log("[SettingsController] Đã khôi phục cài đặt gốc toàn bộ hệ thống!");

            // HÚ LÊN CHO UI CHẠY LẠI CHỮ (Sửa lỗi bấm Restore mà chữ vẫn y xì)
            OnSettingsRestored?.Invoke();
        }

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

        // HÀM MỚI: CẬP NHẬT ĐỘ NHẠY CHUỘT
        public void UpdateGameplay(float sensitivity)
        {
            MouseSensitivity.Value = sensitivity;
            _currentData.Gameplay.MouseSensitivity = sensitivity;

            // XONG THÌ LƯU LẠI
            _saveLoadService.SaveSettings(_currentData);
            // (Thằng Camera của Sếp tự Get biến này để quay, ko cần ApplyToEngine ở đây)
        }

        private void ApplyAllToEngine()
        {
            _graphicsService.ApplyGraphics(_currentData.Graphics);
            _audioService.ApplyAudio(_currentData.Audio);
        }
    }
}