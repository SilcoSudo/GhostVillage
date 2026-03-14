using UnityEngine;
using System.IO;
using Game.Domain.Settings.Data;

namespace Game.Domain.Settings.Services
{
    public class SettingsSaveLoadService
    {
        private readonly string _savePath;

        public SettingsSaveLoadService()
        {
            // Đường dẫn lưu file an toàn trên mọi thiết bị
            _savePath = Path.Combine(Application.persistentDataPath, "gamesettings.json");
        }

        public void SaveSettings(GameSettingsData data)
        {
            try
            {
                string json = JsonUtility.ToJson(data, true); // true để format JSON dễ nhìn
                File.WriteAllText(_savePath, json);
            }
            catch (System.Exception e)
            {
                Debug.LogError($"[Settings] Lỗi khi lưu file: {e.Message}");
            }
        }

        public GameSettingsData LoadSettings()
        {
            if (File.Exists(_savePath))
            {
                try
                {
                    string json = File.ReadAllText(_savePath);
                    return JsonUtility.FromJson<GameSettingsData>(json);
                }
                catch (System.Exception e)
                {
                    Debug.LogError($"[Settings] Lỗi đọc file JSON, khôi phục mặc định: {e.Message}");
                }
            }
            return new GameSettingsData(); // Trả về Default nếu không có file
        }

        public void DeleteSettings()
        {
            if (File.Exists(_savePath))
            {
                File.Delete(_savePath);
            }
        }
    }
}