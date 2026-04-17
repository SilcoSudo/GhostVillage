using UnityEngine;
using Photon.Pun;
using Photon.Voice.PUN;
using Photon.Voice.Unity;
using Game.Scripts.Gameplay.Core; // Nơi chứa GameplayEvents

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

    private void Start()
    {
        // Chỉ thằng chủ máy (Local Player) mới tự đo giọng của chính nó
        if (!photonView.IsMine) return;

        // Cố gắng tìm cái Recorder thông qua PhotonVoiceView
        PhotonVoiceView voiceView = GetComponent<PhotonVoiceView>();
        if (voiceView != null)
        {
            _voiceRecorder = voiceView.RecorderInUse;
        }

        // Nếu không có qua VoiceView, thử tìm trực tiếp trên Object
        if (_voiceRecorder == null)
        {
            _voiceRecorder = GetComponentInChildren<Recorder>();
        }

        if (_voiceRecorder != null)
        {
            // Đã xóa dòng _voiceRecorder.LevelMeter.Enabled = true; vì Photon tự bật sẵn
            Debug.Log("<color=green>[Voice Detector]</color> Đã gắn máy đo âm lượng vào mõm nhân vật!");
        }
        else
        {
            Debug.LogWarning("⚠️ <color=yellow>[Voice Detector]</color> Không tìm thấy Photon Recorder! Hệ thống đếm la hét bị vô hiệu hóa.");
        }
    }

    private void Update()
    {
        if (!photonView.IsMine || _voiceRecorder == null) return;

        // Chỉ đo khi mic đang được bật và truyền đi (chống trường hợp tắt mic mà vẫn đếm)
        if (_voiceRecorder.TransmitEnabled)
        {
            // Lấy biên độ âm thanh đỉnh (Peak Amplitude) trong frame hiện tại. Giá trị từ 0 -> 1.
            float currentAmplitude = _voiceRecorder.LevelMeter.CurrentPeakAmp;

            // Nếu âm lượng vượt ngưỡng "hét"
            if (currentAmplitude >= screamThreshold)
            {
                // Kiểm tra xem đã hết thời gian Cooldown chưa
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

        // 1. HÚ LOA CHO TOÀN SERVER (Gửi lên MatchStatisticManager)
        GameplayEvents.OnPlayerScreamed?.Invoke(myActorNum);

        // 2. [Tùy chọn]: Báo động cho con quái vật gần nhất biết có đứa vừa hét!
        // Sếp có thể uncomment dòng dưới nếu muốn quái tự quay đầu lại khi nghe tiếng hét
        // MonsterEvents.AlertPlayerSpotted(transform.position);

        Debug.Log($"<color=magenta>[Scream Tracker]</color> Á Á Á!!! Phát hiện la hét với cường độ: {amplitude:F2}. Đã báo cáo lên Server!");
    }
}