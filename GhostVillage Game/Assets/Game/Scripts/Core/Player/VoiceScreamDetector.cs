using UnityEngine;
using Photon.Pun;
using Photon.Voice.PUN;
using Photon.Voice.Unity;
using Game.Scripts.Gameplay.Core; // Nơi chứa GameplayEvents
using System.Collections.Generic;

[RequireComponent(typeof(PhotonView))]
public class VoiceScreamDetector : MonoBehaviourPun
{
    [Header("Scream Detection Settings")]
    [Tooltip("Ngưỡng âm thanh được tính là La Hét (Từ 0.0 đến 1.0). Nên để 0.6 - 0.8.")]
    public float screamThreshold = 0.7f;

    [Tooltip("Thời gian chờ (giây) giữa 2 lần tính la hét để tránh spam mạng liên tục.")]
    public float screamCooldown = 5f;

    private Recorder _voiceRecorder;
    private float _lastScreamTime = 0f;

    // ========================================================
    // [BỘ NHỚ TĨNH]: LƯU TRỮ ÂM LƯỢNG CỦA TỪNG NGƯỜI CHƠI (Bất tử qua các Scene)
    // ========================================================
    public static Dictionary<int, float> PlayerVolumeCache = new Dictionary<int, float>();

    private AudioSource _remoteAudioSource;

    private void Start()
    {
        // --------------------------------------------------------
        // LUỒNG 1: NẾU LÀ BẢN THÂN MÌNH (LOCAL) -> GẮN MÁY ĐO LA HÉT
        // --------------------------------------------------------
        if (photonView.IsMine)
        {
            PhotonVoiceView voiceView = GetComponent<PhotonVoiceView>();
            if (voiceView != null) _voiceRecorder = voiceView.RecorderInUse;

            if (_voiceRecorder == null) _voiceRecorder = GetComponentInChildren<Recorder>();

            if (_voiceRecorder != null)
                Debug.Log("<color=green>[Voice Detector]</color> Đã gắn máy đo âm lượng vào mõm nhân vật!");
            else
                Debug.LogWarning("⚠️ <color=yellow>[Voice Detector]</color> Không tìm thấy Photon Recorder!");
        }
        // --------------------------------------------------------
        // LUỒNG 2: NẾU LÀ NGƯỜI KHÁC (REMOTE) -> QUẢN LÝ LOA (SPEAKER)
        // --------------------------------------------------------
        else
        {
            // Tìm cục Speaker nằm ở GameObject con
            Speaker speaker = GetComponentInChildren<Speaker>(true);
            if (speaker != null)
            {
                _remoteAudioSource = speaker.GetComponent<AudioSource>();

                // Vừa đẻ ra là lục trong Cache xem hồi ở sảnh nó bị vặn volume bao nhiêu
                if (_remoteAudioSource != null && PlayerVolumeCache.TryGetValue(photonView.OwnerActorNr, out float savedVol))
                {
                    _remoteAudioSource.volume = savedVol;
                    Debug.Log($"[Audio] Đã nạp lại Volume ({savedVol}) cho {_remoteAudioSource.gameObject.name} của {photonView.Owner.NickName}");
                }
            }
        }
    }

    private void Update()
    {
        // Chỉ Local Player mới chạy hàm check hét
        if (!photonView.IsMine || _voiceRecorder == null) return;

        if (_voiceRecorder.TransmitEnabled)
        {
            float currentAmplitude = _voiceRecorder.LevelMeter.CurrentPeakAmp;

            if (currentAmplitude >= screamThreshold)
            {
                if (Time.time - _lastScreamTime >= screamCooldown)
                {
                    _lastScreamTime = Time.time;
                    TriggerScreamEvent(currentAmplitude);
                }
            }
        }
    }

    private void TriggerScreamEvent(float amplitude)
    {
        int myActorNum = photonView.OwnerActorNr;
        GameplayEvents.OnPlayerScreamed?.Invoke(myActorNum);
        Debug.Log($"<color=magenta>[Scream Tracker]</color> Á Á Á!!! Cường độ: {amplitude:F2}.");
    }

    // ========================================================
    // HÀM PUBLIC CHO UI Ở SẢNH GỌI ĐẾN ĐỂ LƯU VÀ ĐỔI VOLUME
    // ========================================================
    [System.Obsolete]
    public static void SetRemotePlayerVolume(int actorNumber, float volume)
    {
        // 1. Cất vào bộ nhớ tĩnh để đem vào Game xài
        PlayerVolumeCache[actorNumber] = volume;

        // 2. Lục trong Sảnh xem thằng này đã hiện hồn ra chưa, nếu có thì áp dụng luôn
        VoiceScreamDetector[] allDetectors = FindObjectsOfType<VoiceScreamDetector>();
        foreach (var d in allDetectors)
        {
            if (d.photonView != null && d.photonView.OwnerActorNr == actorNumber)
            {
                if (d._remoteAudioSource != null)
                {
                    d._remoteAudioSource.volume = volume;
                }
                break;
            }
        }
    }
}