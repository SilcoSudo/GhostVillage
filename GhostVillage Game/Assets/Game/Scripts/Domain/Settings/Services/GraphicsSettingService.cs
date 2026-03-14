using UnityEngine;
using Game.Domain.Settings.Data;

namespace Game.Domain.Settings.Services
{
    public class GraphicsSettingService
    {
        public void ApplyGraphics(GraphicsData data)
        {
            // 1. Xử lý Độ phân giải và Chế độ màn hình
            int width = data.Is1080p ? 1920 : 1280;
            int height = data.Is1080p ? 1080 : 720;
            FullScreenMode mode = data.IsFullscreen ? FullScreenMode.FullScreenWindow : FullScreenMode.Windowed;

            Screen.SetResolution(width, height, mode);

            // 2. Xử lý Chất lượng đồ họa (Quality Settings)
            // Index: 0 = Low, 1 = Medium, 2 = High (Như bạn đã setup trên Editor)
            QualitySettings.SetQualityLevel(data.QualityPreset, true);

            Debug.Log($"[GraphicsService] Đã áp dụng: {width}x{height} | {mode} | Quality Level: {data.QualityPreset}");
        }
    }
}