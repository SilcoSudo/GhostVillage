using UnityEngine;
using Game.Domain.Settings.Data;
using UnityEngine.Audio;
using VContainer; // Chuẩn bị sẵn cho AudioMixer

namespace Game.Domain.Settings.Services
{
    public class AudioSettingService
    {
        private readonly AudioMixer _mainMixer;

        // Bắt VContainer tự động bơm cái MainMixer vào đây
        [Inject]
        public AudioSettingService(AudioMixer mainMixer)
        {
            _mainMixer = mainMixer;
        }

        public void ApplyAudio(AudioData data)
        {
            if (_mainMixer != null)
            {
                // Gọi ĐÚNG tên biến mà sếp vừa đổi trong bảng Exposed Parameters
                _mainMixer.SetFloat("MasterVolume", ConvertToDecibel(data.MasterVolume));
                _mainMixer.SetFloat("MusicVolume", ConvertToDecibel(data.MusicVolume));
                _mainMixer.SetFloat("SFXVolume", ConvertToDecibel(data.SFXVolume));

                Debug.Log($"[AudioService] Đã áp dụng Mixer -> Master: {data.MasterVolume:P0} | Music: {data.MusicVolume:P0} | SFX: {data.SFXVolume:P0}");
            }
            else
            {
                Debug.LogError("[AudioService] Không tìm thấy AudioMixer! Sếp nhớ Register trong AppLifetimeScope nhé.");
            }
        }

        // CÔNG THỨC TOÁN HỌC: Đổi Slider (0.0001 -> 1) sang Decibel âm thanh (-80dB -> 0dB)
        private float ConvertToDecibel(float sliderValue)
        {
            return Mathf.Log10(Mathf.Max(sliderValue, 0.0001f)) * 20f;
        }
    }
}