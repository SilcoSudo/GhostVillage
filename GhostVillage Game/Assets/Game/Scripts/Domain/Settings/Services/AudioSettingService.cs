using UnityEngine;
using Game.Domain.Settings.Data;
using UnityEngine.Audio; // Chuẩn bị sẵn cho AudioMixer

namespace Game.Domain.Settings.Services
{
    public class AudioSettingService
    {
        // TODO: Mở comment dòng dưới khi bạn đã có MainMixer và Inject nó vào
        // private readonly AudioMixer _mainMixer; 

        public void ApplyAudio(AudioData data)
        {
            // Code in log để Test trước khi có Mixer
            Debug.Log($"[AudioService] Master: {data.MasterVolume:P0} | Music: {data.MusicVolume:P0} | SFX: {data.SFXVolume:P0}");

            /* KHI NÀO CÓ AUDIO MIXER THÌ MỞ ĐOẠN NÀY RA
            if (_mainMixer != null)
            {
                _mainMixer.SetFloat("MasterVol", ConvertToDecibel(data.MasterVolume));
                _mainMixer.SetFloat("MusicVol", ConvertToDecibel(data.MusicVolume));
                _mainMixer.SetFloat("SFXVol", ConvertToDecibel(data.SFXVolume));
                // Voice volume sẽ xử lý riêng bằng API của Photon Voice
            }
            */
        }

        // CÔNG THỨC TOÁN HỌC: Đổi Slider (0.0001 -> 1) sang Decibel âm thanh (-80dB -> 0dB)
        private float ConvertToDecibel(float sliderValue)
        {
            return Mathf.Log10(Mathf.Max(sliderValue, 0.0001f)) * 20f;
        }
    }
}