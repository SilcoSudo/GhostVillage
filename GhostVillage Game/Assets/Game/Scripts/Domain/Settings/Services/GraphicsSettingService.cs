using UnityEngine;
using Game.Domain.Settings.Data;

namespace Game.Domain.Settings.Services
{
    public class GraphicsSettingService
    {
        public void ApplyGraphics(GraphicsData data)
        {
            if (data == null) return;

            try
            {
                // 1. Xử lý Độ phân giải và Chế độ màn hình
                int width = data.Is1080p ? 1920 : 1280;
                int height = data.Is1080p ? 1080 : 720;
                FullScreenMode mode = data.IsFullscreen ? FullScreenMode.FullScreenWindow : FullScreenMode.Windowed;

                Screen.SetResolution(width, height, mode);

                // 2. Xử lý Chất lượng đồ họa (Quality Settings)
                // Dùng Try-Catch để chống đứng game nếu URP Asset bị lỗi hoặc out of index
                if (data.QualityPreset >= 0 && data.QualityPreset < QualitySettings.names.Length)
                {
                    QualitySettings.SetQualityLevel(data.QualityPreset, true);
                }
                else
                {
                    Debug.LogWarning($"[GraphicsService] Quality Preset Index ({data.QualityPreset}) vượt quá giới hạn. Đang reset về Default (1)!");
                    QualitySettings.SetQualityLevel(1, true); // Ép về Medium nếu lỗi
                }

                Debug.Log($"[GraphicsService] Đã áp dụng: {width}x{height} | {mode} | Quality Level: {data.QualityPreset}");
            }
            catch (System.Exception ex)
            {
                // [LƯỚI BẢO HỘ]: Nếu có bất kỳ lỗi gì lúc apply đồ họa (thiếu File URP, lỗi phần cứng...), 
                // In ra lỗi nhưng KHÔNG LÀM CRASH GAME.
                Debug.LogError($"[GraphicsService] LỖI CHÍ MẠNG KHI ÁP DỤNG ĐỒ HỌA: {ex.Message}\nChi tiết: {ex.StackTrace}");
            }
        }
    }
}