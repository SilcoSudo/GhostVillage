using UnityEngine;
using Photon.Pun;
using Game.Core.Player.RayCast;
using Game.Scripts.Gameplay.Core;

[RequireComponent(typeof(PhotonView))]
public class PlayerKnockedState : MonoBehaviourPun, IInteractable
{
    [Header("Knocked State")]
    public bool isKnocked = false;
    public float maxProgress = 25f;

    [Tooltip("Lượng máu khi vừa bị gục (Để test thì để 10-15, chơi thật để 25)")]
    public float startingProgress = 12.5f;
    public float currentProgress;

    private float drainRate = 25f / 60f;
    private GameManager _gameManager;

    private Animator _animator;
    private int _knockedHash;

    [System.Obsolete]
    private void Awake()
    {
        _gameManager = FindObjectOfType<GameManager>();
        _animator = GetComponentInChildren<Animator>();
        _knockedHash = Animator.StringToHash("IsKnocked");
    }

    private void Update()
    {
        if (!isKnocked) return;

        // === FIX LỖI 2 (ĐỒNG BỘ MÁU): TẤT CẢ MỌI NGƯỜI ĐỀU CHO MÁU TỤT ===
        // (Không dùng IsMine ở đây nữa, để máy thằng Cứu cũng thấy máu trôi xuống mượt mà)
        currentProgress -= drainRate * Time.deltaTime;
        currentProgress = Mathf.Max(0, currentProgress);

        // Nạn nhân tự bật UI của mình
        if (photonView.IsMine && ReviveQTEManager.Instance != null)
        {
            ReviveQTEManager.Instance.UpdateVictimUI(currentProgress, maxProgress);
        }

        // NHƯNG CHỈ CHỦ NHÂN MỚI CÓ QUYỀN GỌI HÀM CHẾT
        if (photonView.IsMine && currentProgress <= 0)
        {
            currentProgress = 0;
            Die();
        }
    }

    public void GetKnocked()
    {
        if (isKnocked) return;

        if (photonView.IsMine && _gameManager != null)
        {
            _gameManager.ReportStatusChange(photonView.Owner.ActorNumber, PlayerMatchStatus.Knocked);
        }

        photonView.RPC(nameof(RpcSetKnockedState), RpcTarget.All, true);
    }

    [PunRPC]
    private void RpcSetKnockedState(bool state)
    {
        isKnocked = state;

        if (_animator != null)
        {
            _animator.SetBool(_knockedHash, state);
        }

        if (state)
        {
            var inventory = GetComponent<InventoryManager>();
            if (inventory != null) inventory.DropAllItemsScattered();

            currentProgress = startingProgress;
            Debug.Log($"<color=orange>[PlayerKnocked]</color> {photonView.Owner.NickName} đã bị Knocked!");

            if (photonView.IsMine)
            {
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }
        }
        else
        {
            if (photonView.IsMine && ReviveQTEManager.Instance != null)
            {
                ReviveQTEManager.Instance.HideVictimUI();
            }

            if (photonView.IsMine && currentProgress > 0)
            {
                var inventory = GetComponent<InventoryManager>();
                if (inventory != null) inventory.LockInventory(false);

                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }
        }
    }

    private void Die()
    {
        if (photonView.IsMine && _gameManager != null)
        {
            _gameManager.ReportStatusChange(photonView.Owner.ActorNumber, PlayerMatchStatus.Eliminated);
        }

        photonView.RPC(nameof(RpcSetKnockedState), RpcTarget.All, false);
        Debug.Log($"<color=red>[PlayerKnocked]</color> {photonView.Owner.NickName} ĐÃ CHẾT HẲN!");

        if (photonView.IsMine)
        {
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
        }
    }

    public string GetPromptMessage() => "Cứu chữa (F)";

    public void Interact(GameObject actor)
    {
        if (!isKnocked) return;

        var inventory = actor.GetComponent<InventoryManager>();
        if (inventory != null && inventory.items.Count > 0)
        {
            var currentItem = inventory.items[inventory.currentSlotIndex];
            if (currentItem != null && currentItem.itemId == "ITEM_MEDKIT")
            {
                Debug.Log("<color=cyan>[PlayerKnocked]</color> Bồ đang cầm Medkit. Bắt đầu QTE!");

                var saviorFPS = actor.GetComponent<FPSController>();
                if (saviorFPS != null) saviorFPS.isPlayingMinigame = true;

                if (ReviveQTEManager.Instance != null)
                {
                    ReviveQTEManager.Instance.StartQTE(this, inventory, saviorFPS);
                }
            }
            else
            {
                Debug.Log("<color=yellow>[PlayerKnocked]</color> Lấy Hộp Cứu Thương ra cầm đi!");
            }
        }
    }

    [PunRPC]
    public void RpcUpdateReviveProgress(float amount)
    {
        if (!isKnocked) return;

        currentProgress += amount;
        currentProgress = Mathf.Clamp(currentProgress, 0, maxProgress);

        if (currentProgress >= maxProgress)
        {
            photonView.RPC(nameof(RpcSetKnockedState), RpcTarget.All, false);

            if (photonView.IsMine && _gameManager != null)
            {
                _gameManager.ReportStatusChange(photonView.Owner.ActorNumber, PlayerMatchStatus.Playing);
            }

            // XÓA GỌI UI Ở ĐÂY VÌ ĐÃ GIAO CHO THẰNG CỨU TỰ KIỂM TRA
        }
    }
}