using UnityEngine;
using Photon.Pun;
using Game.Scripts.Gameplay.Core;
using VContainer;

[RequireComponent(typeof(PhotonView))]
public class WellFuelPuzzleManager : MonoBehaviourPun
{
    [Header("=== TRỤC DI CHUYỂN ===")]
    [Tooltip("Kéo cục Water_System vào đây")]
    public Transform waterSystem;

    [Tooltip("Kéo cục Fake_JerryCan vào đây để lát tắt nó đi")]
    public GameObject fakeJerryCan;

    [Header("=== CÁC MỐC NƯỚC (Từ 0 đến 5) ===")]
    public Transform[] waterLevels;

    [Header("=== PHẦN THƯỞNG ===")]
    public Transform realJerryCanSpawnPoint;
    public string realJerryCanPrefabName = "World_JerryCan";

    [Header("=== CÀI ĐẶT ===")]
    public float waterRiseSpeed = 1.5f;

    [Inject] private GameAudioManager _audioManager;
    private AudioSource _waterAudioSource;

    // Biến nội bộ
    private int _currentValvesOpened = 0;
    private bool _isSolved = false;

    private void Awake()
    {
        _waterAudioSource = gameObject.AddComponent<AudioSource>();
        _waterAudioSource.spatialBlend = 1f; // Âm thanh 3D
    }

    private void Start()
    {
        if (_audioManager == null)
            _audioManager = FindFirstObjectByType<GameAudioManager>();

        // Set mặt nước lúc mới vào game nằm ở đáy (Level 0)
        if (waterLevels.Length > 0 && waterSystem != null)
        {
            waterSystem.position = waterLevels[0].position;
        }
    }

    private void Update()
    {
        if (waterSystem == null || waterLevels.Length == 0) return;

        // Cho mặt nước dâng lên từ từ tới mốc hiện tại
        Transform targetLevel = waterLevels[_currentValvesOpened];
        waterSystem.position = Vector3.MoveTowards(waterSystem.position, targetLevel.position, waterRiseSpeed * Time.deltaTime);
    }

    // Cái Van sẽ gọi hàm này khi bị vặn
    public void OnValveOpened()
    {
        photonView.RPC(nameof(UpdateWaterLevelRPC), RpcTarget.AllBuffered);
    }

    [PunRPC]
    private void UpdateWaterLevelRPC()
    {
        if (_isSolved) return;

        _currentValvesOpened++;
        Debug.Log($"<color=cyan>[Well Puzzle] Đã mở {_currentValvesOpened}/5 van!</color>");

        // Phát tiếng nước chảy róc rách mỗi khi dâng lên
        if (_audioManager != null)
        {
            AudioClip waterClip = _audioManager.GetClip("WATER_SPLASH"); // Tên ID tùy sếp đặt trong Manager
            if (waterClip != null) _waterAudioSource.PlayOneShot(waterClip);
        }

        // Nếu vặn đủ 5 van thì Win
        if (_currentValvesOpened >= 5)
        {
            _isSolved = true;
            Debug.Log("<color=green>[Well Puzzle] Nước tràn miệng giếng! Can xăng trồi lên!</color>");

            // Tắt đồ giả đi
            if (fakeJerryCan != null) fakeJerryCan.SetActive(false);

            // Báo cho UI Objective biết để cập nhật (1/3 -> 2/3)
            if (PhotonNetwork.IsMasterClient)
            {
                // Gọi event hoàn thành
                GameplayEvents.OnPuzzleSolved?.Invoke();

                // Đẻ đồ thật ra
                PhotonNetwork.InstantiateRoomObject(realJerryCanPrefabName, realJerryCanSpawnPoint.position, realJerryCanSpawnPoint.rotation);
            }
        }
    }
}