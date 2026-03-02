using UnityEngine;
using Photon.Pun;
using Game.Scripts.Gameplay.Core;

public class PuzzleSimpleTrigger : MonoBehaviourPun
{
    [Header("Phần thưởng")]
    // SỬA: Chỉ chấp nhận KeyItemSO
    [Tooltip("Kéo KeyItemSO vào đây (Ví dụ: Pin)")]
    public KeyItemSO keyItemReward;

    private bool _isSolved = false;

    private void OnTriggerEnter(Collider other)
    {
        if (_isSolved) return;

        // Chỉ xử lý khi Player chạm vào
        if (other.CompareTag("Player"))
        {
            // Kiểm tra xem đây có phải là Player của máy mình không?
            PhotonView playerView = other.GetComponent<PhotonView>();
            if (playerView != null && playerView.IsMine)
            {
                SolvePuzzle(other.gameObject);
            }
        }
    }

    private void SolvePuzzle(GameObject player)
    {
        Debug.Log($"[Puzzle] Người chơi {player.name} đã chạm vào câu đố!");

        // 1. Gửi lệnh RPC để khóa câu đố này lại vĩnh viễn với tất cả mọi người
        photonView.RPC(nameof(DisablePuzzleRPC), RpcTarget.AllBuffered);

        // 2. Nhét đồ vào túi người chơi (Chỉ chạy local)
        InventoryManager inventory = player.GetComponent<InventoryManager>();

        // Ép kiểu ngầm định KeyItemSO -> ItemDataSO khi gọi AddItem (vì KeyItem kế thừa ItemData)
        if (inventory != null && keyItemReward != null)
        {
            bool added = inventory.AddItem(keyItemReward);
            if (added)
            {
                Debug.Log($"<color=cyan>[Puzzle]</color> Đã nhét {keyItemReward.itemName} vào túi người chơi.");
            }
            else
            {
                Debug.LogWarning("[Puzzle] Túi đầy, không nhét được đồ!");
                // Có thể thêm logic: Spawn item rớt xuống đất tại chỗ này nếu túi đầy
            }
        }

        // 3. Hú lên Universal Objective
        GameplayEvents.OnPuzzleSolved?.Invoke();
    }

    [PunRPC]
    private void DisablePuzzleRPC()
    {
        _isSolved = true;
        Debug.Log("[Puzzle] Câu đố đã hoàn thành. Tắt Collider.");

        // Tắt Collider để không ai chạm vào được nữa
        GetComponent<Collider>().enabled = false;

        // Visual: Tắt mesh renderer hoặc effect để người chơi biết là xong rồi
        // GetComponent<MeshRenderer>().material.color = Color.gray; 
    }
}