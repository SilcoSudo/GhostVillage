using UnityEngine;
using System.Collections.Generic;
using UnityEngine.Audio; // [THÊM MỚI] Dùng cho Audio Mixer

namespace Game.Scripts.Gameplay.Core
{
    [System.Serializable]
    public class AudioEntry
    {
        [Tooltip("Mã ID để gọi (VD: FISH_SPLASH, RADIO_BEEP)")]
        public string audioID;
        public AudioClip clip;
        [Range(0f, 1f)] public float defaultVolume = 1f;

        // [THÊM MỚI] Để phân loại xem đĩa CD này thuộc kênh nào (Music hay SFX)
        public AudioMixerGroup mixerGroup;
    }

    public class GameAudioManager : MonoBehaviour
    {
        // ... (Giữ nguyên các biến List và Dictionary của sếp) ...
        [Header("Kho Âm Thanh (Audio Bank)")]
        public List<AudioEntry> audioDatabase = new List<AudioEntry>();
        private Dictionary<string, AudioEntry> _audioDict = new Dictionary<string, AudioEntry>();

        // [THÊM MỚI] Các thành phần để phát âm thanh 2D chung
        [Header("Audio Players (Tự sinh)")]
        private AudioSource _sfxPlayer2D;
        private AudioSource _musicPlayer;

        public static GameAudioManager Instance { get; private set; }

        private void Awake()
        {
            // Singleton để gọi từ mọi nơi dễ dàng
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;

            // Nạp data từ List vào Dictionary
            foreach (var entry in audioDatabase)
            {
                if (!string.IsNullOrEmpty(entry.audioID) && entry.clip != null)
                {
                    if (!_audioDict.ContainsKey(entry.audioID))
                    {
                        _audioDict.Add(entry.audioID, entry);
                    }
                    else
                    {
                        Debug.LogWarning($"[AudioManager] Trùng ID âm thanh: {entry.audioID}");
                    }
                }
            }

            // [THÊM MỚI] Tự động tạo AudioSource ẩn để phát nhạc nền và hiệu ứng chung (như UI click)
            _sfxPlayer2D = gameObject.AddComponent<AudioSource>();
            _sfxPlayer2D.spatialBlend = 0f; // Âm thanh chung thì luôn là 2D

            _musicPlayer = gameObject.AddComponent<AudioSource>();
            _musicPlayer.spatialBlend = 0f;
            _musicPlayer.loop = true; // Nhạc nền thì tự lặp
        }

        // ==========================================
        // CÁC HÀM CHO MƯỢN ĐĨA CD (Giữ nguyên của sếp)
        // ==========================================
        public AudioEntry GetAudioEntry(string audioID)
        {
            if (_audioDict.TryGetValue(audioID, out AudioEntry entry)) return entry;
            Debug.LogWarning($"[AudioManager] Không tìm thấy Audio ID: {audioID} trong kho!");
            return null;
        }

        public AudioClip GetClip(string audioID)
        {
            var entry = GetAudioEntry(audioID);
            return entry != null ? entry.clip : null;
        }

        // ==========================================
        // [THÊM MỚI] CÁC HÀM PHÁT ÂM THANH
        // ==========================================

        /// <summary>
        /// Phát một âm thanh SFX 2D (như tiếng Click nút, tiếng hú báo động chung)
        /// </summary>
        public void PlayGlobalSFX(string audioID)
        {
            var entry = GetAudioEntry(audioID);
            if (entry != null && entry.clip != null)
            {
                _sfxPlayer2D.outputAudioMixerGroup = entry.mixerGroup;
                _sfxPlayer2D.PlayOneShot(entry.clip, entry.defaultVolume);
            }
        }

        /// <summary>
        /// Gắn đĩa CD vào một cái loa 3D có sẵn ở ngoài Map (VD: Gắn tiếng gầm vào mồm quái)
        /// </summary>
        public void Play3DSFXOnSource(string audioID, AudioSource targetSource)
        {
            var entry = GetAudioEntry(audioID);
            if (entry != null && entry.clip != null && targetSource != null)
            {
                targetSource.outputAudioMixerGroup = entry.mixerGroup; // Ép cái loa chĩa vào Mixer
                targetSource.spatialBlend = 1f; // ÉP BUỘC NÓ THÀNH 3D CHỐNG ĐIẾC
                targetSource.PlayOneShot(entry.clip, entry.defaultVolume);
            }
        }
    }
}