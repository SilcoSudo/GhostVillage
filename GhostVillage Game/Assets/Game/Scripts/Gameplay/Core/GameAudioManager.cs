using UnityEngine;
using System.Collections.Generic;

namespace Game.Scripts.Gameplay.Core
{
    [System.Serializable]
    public class AudioEntry
    {
        [Tooltip("Mã ID để gọi (VD: FISH_SPLASH, RADIO_BEEP)")]
        public string audioID;
        public AudioClip clip;
        [Range(0f, 1f)] public float defaultVolume = 1f;
    }

    public class GameAudioManager : MonoBehaviour
    {
        [Header("Kho Âm Thanh (Audio Bank)")]
        public List<AudioEntry> audioDatabase = new List<AudioEntry>();

        // Dictionary để tra cứu siêu tốc O(1)
        private Dictionary<string, AudioEntry> _audioDict = new Dictionary<string, AudioEntry>();

        private void Awake()
        {
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
        }

        // ==========================================
        // CÁC HÀM CHO MƯỢN ĐĨA CD
        // ==========================================

        /// <summary>
        /// Lấy AudioEntry (gồm Clip và Volume mặc định) theo ID
        /// </summary>
        public AudioEntry GetAudioEntry(string audioID)
        {
            if (_audioDict.TryGetValue(audioID, out AudioEntry entry))
            {
                return entry;
            }

            Debug.LogWarning($"[AudioManager] Không tìm thấy Audio ID: {audioID} trong kho!");
            return null;
        }

        /// <summary>
        /// Lấy thẳng AudioClip nếu chỉ cần file âm thanh
        /// </summary>
        public AudioClip GetClip(string audioID)
        {
            var entry = GetAudioEntry(audioID);
            return entry != null ? entry.clip : null;
        }
    }
}