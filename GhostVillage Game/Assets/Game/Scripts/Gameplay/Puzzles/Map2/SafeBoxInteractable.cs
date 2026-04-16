using UnityEngine;
using Photon.Pun;
using System.Collections.Generic;

public class SafeBoxInteractable : MonoBehaviourPun, IInteractable
{
    [Header("Puzzle Reference")]
    public FishPoolPuzzleManager puzzleManager;

    [Tooltip("Không kéo cũng được, nó sẽ tự lùng sục cái SafeBoxUI trong Canvas HUD")]
    public SafeBoxUI safeBoxUI;

    [Header("Reward Spawning")]
    [Tooltip("Cục Empty nằm trước miệng két sắt để rơi Bugi ra")]
    public Transform itemSpawnPoint;
    public string itemPrefabName = "World_Bugi"; // Tên file Prefab Bugi_Pickup trong folder Resources

    private bool _isOpened = false;

    private void Start()
    {
        // Tự động tìm UI Két Sắt dưới nền
        if (safeBoxUI == null)
        {
            safeBoxUI = Object.FindFirstObjectByType<SafeBoxUI>(FindObjectsInactive.Include);

            // THÊM LOG CHECK TÌM UI
            if (safeBoxUI != null)
            {
                Debug.Log($"<color=green>[SafeBox] OK! Đã rà quét và tự động nối dây thành công với UI tên là: {safeBoxUI.gameObject.name}</color>");
            }
            else
            {
                Debug.LogWarning("<color=orange>[SafeBox] Chú ý: Lúc Start() chưa tìm thấy SafeBoxUI. Có thể do UI HUD đẻ ra chậm hơn Két sắt. Sẽ thử tìm lại lúc ấn F!</color>");
            }
        }
    }

    public string GetPromptMessage() => _isOpened ? "Két sắt đã mở" : "Nhập mật khẩu Két Sắt (F)";

    public void Interact(GameObject actor)
    {
        Debug.Log($"<color=magenta>[SafeBox] Player {actor.name} vừa ấn F vào Két Sắt!</color>");

        if (_isOpened)
        {
            Debug.Log("[SafeBox] Két mở rồi, không cho tương tác nữa.");
            return;
        }

        // LƯỚI BẢO HỘ: Nếu Start() tìm trượt do UI sinh ra sau, thì lúc ấn F tao tìm lại 1 lần nữa!
        if (safeBoxUI == null)
        {
            Debug.Log("[SafeBox] Lúc Start chưa có UI, giờ lùng sục lại lần 2...");
            safeBoxUI = Object.FindFirstObjectByType<SafeBoxUI>(FindObjectsInactive.Include);
        }

        if (safeBoxUI != null)
        {
            Debug.Log($"<color=yellow>[SafeBox] Đang gọi lệnh OpenUI() của GameObject: {safeBoxUI.gameObject.name}</color>");
            safeBoxUI.OpenUI(this, actor);
        }
        else
        {
            Debug.LogError("<color=red>[SafeBox] CHỊU! Đã tìm 2 lần vẫn không thấy SafeBoxUI trên màn hình HUD! Sếp check lại xem prefab UI có chứa SafeBoxUI.cs chưa?</color>");
        }
    }

    public void SubmitCode(List<int> inputIndices)
    {
        if (_isOpened || puzzleManager == null) return;

        bool isCorrect = puzzleManager.TryUnlock(inputIndices);

        if (isCorrect)
        {
            // SỬA DÒNG NÀY LẠI THÀNH DẠNG CHUỖI NHƯ SAU:
            photonView.RPC("RpcOpenSafeAndSpawnItem", RpcTarget.MasterClient);
        }
    }

    [PunRPC]
    public void RpcOpenSafeAndSpawnItem()
    {
        if (!PhotonNetwork.IsMasterClient || _isOpened) return;

        PhotonNetwork.InstantiateRoomObject(itemPrefabName, itemSpawnPoint.position, itemSpawnPoint.rotation);
        photonView.RPC(nameof(RpcSyncSafeOpened), RpcTarget.AllBuffered);
    }

    [PunRPC]
    public void RpcSyncSafeOpened()
    {
        _isOpened = true;
        Debug.Log("<color=yellow>[SafeBox] TẠCH! Két đã mở! Lòi cục Bugi ra rồi!</color>");
    }
}