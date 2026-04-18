using UnityEngine;
using Game.Scripts.Gameplay.Core; // Gọi GameAudioManager

[RequireComponent(typeof(AudioSource))]
public class AmbientSoundEmitter : MonoBehaviour
{
    [Tooltip("Mã ID âm thanh môi trường (VD: AMBIENT_FROG, AMBIENT_WIND)")]
    public string audioID;

    private AudioSource _audioSource;

    private void Start()
    {
        _audioSource = GetComponent<AudioSource>();

        if (GameAudioManager.Instance != null)
        {
            // Xin đĩa CD từ kho quản lý
            var entry = GameAudioManager.Instance.GetAudioEntry(audioID);
            
            if (entry != null && entry.clip != null)
            {
                // Nhét đĩa vào loa và cắm dây vào Mixer
                _audioSource.clip = entry.clip;
                _audioSource.volume = entry.defaultVolume;
                _audioSource.outputAudioMixerGroup = entry.mixerGroup; // Cắm vào kênh SFX

                // Ép chuẩn 3D để không bị vang cả map
                _audioSource.spatialBlend = 1f; 
                _audioSource.loop = true; // [QUAN TRỌNG] Cho lặp vô tận
                _audioSource.playOnAwake = false;

                // Bắt đầu phát
                _audioSource.Play();
            }
        }
    }
}