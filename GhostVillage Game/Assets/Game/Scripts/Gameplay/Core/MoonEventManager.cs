using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using Game.Domain.Map.DTOs;
using System.Collections.Generic;

namespace Game.Scripts.Gameplay.Core
{
    public class MoonEventManager : MonoBehaviour
    {
        [Header("Visual Modifiers")]
        [SerializeField] private Volume _globalVolume;

        // Lưu giữ sự kiện trăng hiện tại
        public MoonEventGlobalDTO CurrentMoon { get; private set; }

        private ColorAdjustments _colorAdjustments;

        public void Initialize(List<MoonEventGlobalDTO> availableMoons)
        {
            Debug.Log("[MoonEventManager] Đang khởi tạo sự kiện Trăng...");

            if (availableMoons == null || availableMoons.Count == 0)
            {
                Debug.LogWarning("[MoonEventManager] Map không có MoonEvent nào, dùng Trăng mặc định.");
                return;
            }

            // --- BỐC RANDOM TRĂNG THEO TRỌNG SỐ (WEIGHT) ---
            CurrentMoon = SelectRandomMoon(availableMoons);
            Debug.Log($"<color=magenta>🌕 TRĂNG ĐÊM NAY LÀ: {CurrentMoon.eventName}</color>");

            // --- ÁP DỤNG VISUALS LÊN GLOBAL VOLUME ---
            ApplyVisualModifiers();
        }

        private MoonEventGlobalDTO SelectRandomMoon(List<MoonEventGlobalDTO> moons)
        {
            int totalWeight = 0;
            foreach (var m in moons) totalWeight += m.weight;

            int randomPoint = Random.Range(0, totalWeight);
            int cursor = 0;

            foreach (var m in moons)
            {
                cursor += m.weight;
                if (randomPoint < cursor) return m;
            }
            return moons[0]; // Dự phòng
        }

        private void ApplyVisualModifiers()
        {
            if (_globalVolume == null || CurrentMoon == null) return;

            // Truy xuất lấy component ColorAdjustments trong cục Volume của sếp
            if (_globalVolume.profile.TryGet(out _colorAdjustments))
            {
                // Thay vì Post Exposure, ta có thể dùng Filter Color. 
                // Trăng máu -> Ám đỏ, Trăng khuyết -> Tối đi.
                // Ở đây tui hardcode ví dụ dựa theo ID (sếp có thể thêm màu vào Json nếu Backend update)
                switch (CurrentMoon.eventId)
                {
                    case "EVENT_MOON_RED":
                        _colorAdjustments.colorFilter.value = new Color(1f, 0.4f, 0.4f); // Đỏ rực
                        _colorAdjustments.postExposure.value = 0.5f;
                        break;
                    case "EVENT_MOON_NEW":
                        _colorAdjustments.colorFilter.value = new Color(0.6f, 0.6f, 0.7f); // Xám lạnh
                        _colorAdjustments.postExposure.value = -1.5f; // Tối thui
                        break;
                    case "EVENT_MOON_FULL":
                        _colorAdjustments.colorFilter.value = Color.white; // Sáng sủa
                        _colorAdjustments.postExposure.value = 0.5f;
                        break;
                }
            }
            else
            {
                Debug.LogWarning("Global Volume chưa gắn Color Adjustments!");
            }
        }

        // --- CÁC HÀM GETTER ĐỂ HỆ THỐNG KHÁC GỌI VÀO ---

        public float GetMonsterSpeedMultiplier()
        {
            if (CurrentMoon != null && CurrentMoon.monsterBuffMultipliers != null)
            {
                // Trả về số thật từ DB
                return CurrentMoon.monsterBuffMultipliers.speedMultiplier;
            }
            return 1f;
        }

        public float GetMonsterDetectionMultiplier()
        {
            if (CurrentMoon == null) return 1f;
            if (CurrentMoon.eventId == "EVENT_MOON_RED") return 1.5f;
            if (CurrentMoon.eventId == "EVENT_MOON_NEW") return 0.8f;
            return 1f;
        }

        public float GetExpRewardMultiplier()
        {
            if (CurrentMoon != null && CurrentMoon.rewardMultipliers != null)
            {
                // Trả về số thật từ DB
                return CurrentMoon.rewardMultipliers.expMultiplier;
            }
            return 1f;
        }
    }
}