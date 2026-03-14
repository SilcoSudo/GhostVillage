using System;
using System.Collections.Generic;

namespace Game.Domain.Settings.Data
{
    [Serializable]
    public class GameSettingsData
    {
        public GraphicsData Graphics = new();
        public AudioData Audio = new();
        public GameplayData Gameplay = new();
        // ControlData sẽ được định nghĩa vào Ngày 2
    }

    [Serializable]
    public class KeyBindingOverride
    {
        public string ActionName;
        public int BindingIndex;
        public string OverridePath;
    }

    [Serializable]
    public class GraphicsData
    {
        public bool Is1080p = true;       // true = 1920x1080, false = 1280x720
        public bool IsFullscreen = true;  // true = Fullscreen Window, false = Windowed
        public int QualityPreset = 2;     // 0 = Low, 1 = Medium, 2 = High
    }

    [Serializable]
    public class AudioData
    {
        public float MasterVolume = 1f;   // Giá trị từ 0.0001f đến 1f
        public float SFXVolume = 1f;
        public float MusicVolume = 1f;
    }

    [Serializable]
    public class GameplayData
    {
        public string LanguageCode = "VN";
        public float MouseSensitivity = 1.0f;
        // Thêm list này để lưu các phím đã bị đổi
        public List<KeyBindingOverride> KeyBindings = new();
    }
}