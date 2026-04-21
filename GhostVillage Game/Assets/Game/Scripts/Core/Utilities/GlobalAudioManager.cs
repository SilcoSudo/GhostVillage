using UnityEngine;
using System.Collections.Generic;
using UnityEngine.Audio;

namespace Game.Core.Audio
{
    [System.Serializable]
    public class GlobalAudioEntry
    {
        public string audioID;
        public AudioClip clip;
        [Range(0f, 1f)] public float defaultVolume = 1f;
        public AudioMixerGroup mixerGroup;
    }

    public class GlobalAudioManager : MonoBehaviour
    {
        [Header("Kho Âm Thanh Toàn Cục (UI, Menu, Lobby)")]
        public List<GlobalAudioEntry> audioDatabase = new List<GlobalAudioEntry>();
        private Dictionary<string, GlobalAudioEntry> _audioDict = new Dictionary<string, GlobalAudioEntry>();

        private AudioSource _sfxPlayer;
        private AudioSource _musicPlayer;

        // Dùng Singleton tĩnh để các Button UI dễ móc vào mà không cần Inject rườm rà
        public static GlobalAudioManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;

            foreach (var entry in audioDatabase)
            {
                if (!string.IsNullOrEmpty(entry.audioID) && entry.clip != null)
                {
                    if (!_audioDict.ContainsKey(entry.audioID)) _audioDict.Add(entry.audioID, entry);
                }
            }

            _sfxPlayer = gameObject.AddComponent<AudioSource>();
            _sfxPlayer.spatialBlend = 0f; // UI thì auto 2D

            _musicPlayer = gameObject.AddComponent<AudioSource>();
            _musicPlayer.spatialBlend = 0f;
            _musicPlayer.loop = true; // Nhạc nền thì lặp
        }

        public void PlaySFX(string audioID)
        {
            if (_audioDict.TryGetValue(audioID, out var entry) && entry.clip != null)
            {
                _sfxPlayer.outputAudioMixerGroup = entry.mixerGroup;
                _sfxPlayer.PlayOneShot(entry.clip, entry.defaultVolume);
            }
        }

        public void PlayMusic(string audioID)
        {
            if (_audioDict.TryGetValue(audioID, out var entry) && entry.clip != null)
            {
                if (_musicPlayer.isPlaying) _musicPlayer.Stop();
                _musicPlayer.outputAudioMixerGroup = entry.mixerGroup;
                _musicPlayer.clip = entry.clip;
                _musicPlayer.volume = entry.defaultVolume;
                _musicPlayer.Play();
            }
        }

        public void StopMusic() => _musicPlayer.Stop();
    }
}