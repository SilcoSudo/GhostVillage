using UnityEngine;
using Photon.Pun;
using Game.Core.Player.RayCast;

[RequireComponent(typeof(PhotonView))]
public class WellValveInteractable : MonoBehaviourPun, IInteractable
{
    [Header("Manager Reference")]
    public WellFuelPuzzleManager wellManager;

    [Header("Visuals Rotation")]
    [Tooltip("Kéo cục 'manette' vào đây")]
    public Transform valveHandle;
    public Vector3 closedRotation = new Vector3(0, 0, 0);
    public Vector3 openedRotation = new Vector3(0, 90, 0);
    public float rotateSpeed = 5f;

    private bool _isOpened = false;

    public string GetPromptMessage()
    {
        // Chỗ này sếp lưu ý: Phải trả về chuỗi mới nhất để UI nảy số
        if (_isOpened) return "<color=red>Van đã mở</color>";
        return "Vặn van nước (F)";
    }

    public void Interact(GameObject actor)
    {
        if (_isOpened) return;
        photonView.RPC(nameof(ActivateValveRPC), RpcTarget.AllBuffered);

        // [MẸO FIX PROMPT]: Gọi lệnh này để ép UI cập nhật ngay lập tức
        // Nếu sếp có cái PlayerInteract script, hãy thêm 1 hàm Refresh vào đó.
        // Ở đây tui tạm gọi qua actor để báo UI đổi chữ:
        actor.SendMessage("RefreshInteractUI", SendMessageOptions.DontRequireReceiver);
    }

    private void Update()
    {
        if (valveHandle == null) return;

        // Xoay mượt mà dựa trên trạng thái
        Vector3 targetRot = _isOpened ? openedRotation : closedRotation;
        valveHandle.localRotation = Quaternion.Lerp(valveHandle.localRotation, Quaternion.Euler(targetRot), Time.deltaTime * rotateSpeed);
    }

    [PunRPC]
    private void ActivateValveRPC()
    {
        if (_isOpened) return;
        _isOpened = true;

        Debug.Log($"<color=orange>[Valve] {gameObject.name} đã xoay!</color>");

        if (wellManager != null)
        {
            wellManager.OnValveOpened();
        }
    }
}