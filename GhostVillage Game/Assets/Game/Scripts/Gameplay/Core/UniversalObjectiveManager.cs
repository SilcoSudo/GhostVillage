using UnityEngine;
using Photon.Pun;
using ExitGames.Client.Photon;
using Game.Scripts.Gameplay.Core;

public class UniversalObjectiveManager : ObjectiveManager
{
    [Header("TỰ CẤU HÌNH NHIỆM VỤ (Set trực tiếp)")]
    [Tooltip("Số lượng cần tìm để thắng")]
    public int targetQuantity = 3;

    // Biến nội bộ
    private int _currentProgress = 0;
    private const string KEY_OBJ_PROGRESS = "Obj_Prog";

    // --- 1. KHỞI TẠO (Được GameManager gọi khi vào map) ---
    public override void Initialize()
    {
        _currentProgress = 0;
        Debug.Log($"[Objective] Bắt đầu đếm: Cần giải {targetQuantity} câu đố.");

        // Cập nhật UI (0/3)
        NotifyProgress(0, targetQuantity);

        // Master reset server
        if (PhotonNetwork.IsMasterClient)
        {
            SetNetworkProgress(0);
        }
    }

    public override void OnEnable()
    {
        base.OnEnable();
        // Lắng nghe tiếng hú từ các câu đố
        GameplayEvents.OnPuzzleSolved += HandlePuzzleSolved;
    }

    public override void OnDisable()
    {
        base.OnDisable();
        GameplayEvents.OnPuzzleSolved -= HandlePuzzleSolved;
    }

    private void HandlePuzzleSolved()
    {
        // Chỉ Master mới có quyền tăng điểm tổng của phòng
        if (PhotonNetwork.IsMasterClient)
        {
            int newProgress = _currentProgress + 1;

            Debug.Log($"[UniversalObjective] Nghe thấy 1 câu đố đã giải! ({newProgress}/{targetQuantity})");

            if (newProgress <= targetQuantity)
            {
                SetNetworkProgress(newProgress);
            }
        }
    }

    // --- 2. LOGIC CHECK ITEM ---
    protected override void CheckProgress(ItemDataSO item) { /* Không dùng */ }

    // --- 3. ĐỒNG BỘ MẠNG ---
    private void SetNetworkProgress(int value)
    {
        Hashtable props = new Hashtable { { KEY_OBJ_PROGRESS, value } };
        PhotonNetwork.CurrentRoom.SetCustomProperties(props);
    }

    public override void OnRoomPropertiesUpdate(Hashtable propertiesThatChanged)
    {
        if (propertiesThatChanged.ContainsKey(KEY_OBJ_PROGRESS))
        {
            _currentProgress = (int)propertiesThatChanged[KEY_OBJ_PROGRESS];
            Debug.Log($"<color=green>[Objective]</color> Đã giải: {_currentProgress}/{targetQuantity}");

            if (_currentProgress >= targetQuantity)
            {
                Debug.Log("<color=yellow>[Objective]</color> ĐỦ CÂU ĐỐ! HÃY ĐI KÍCH HOẠT CỔNG!");
            }
        }
    }
}