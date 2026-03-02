using UnityEngine;
using Photon.Pun;
using Game.Scripts.Gameplay.Core;

public class ExitGateTrigger : MonoBehaviourPun
{
    private void OnTriggerEnter(Collider other)
    {
        // Chỉ xử lý khi Player chạm vào
        if (other.CompareTag("Player"))
        {
            PhotonView playerView = other.GetComponent<PhotonView>();

            // Client tự báo cáo lên Master
            if (playerView != null && playerView.IsMine)
            {
                Debug.Log("[ExitGate] Chạm cổng! Bắn sự kiện yêu cầu thoát...");

                // Bắn sự kiện lên hệ thống. Ai nghe thì xử lý (GameManager sẽ nghe).
                GameplayEvents.OnLocalPlayerRequestEscape?.Invoke();
            }
        }
    }
}