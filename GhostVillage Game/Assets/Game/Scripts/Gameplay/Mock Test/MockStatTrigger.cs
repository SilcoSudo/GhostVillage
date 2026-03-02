// File: MockStatTrigger.cs
using UnityEngine;
using Photon.Pun;
using Game.Scripts.Gameplay.Core; // Để gọi GameplayEvents
using TMPro; // Nếu bạn muốn nổi Text 3D lên cục Cube (Tùy chọn)

namespace Game.Scripts.Test
{
    public enum StatTriggerType
    {
        RescueTeammate,
        GetKnocked,
        KillMonster,
        TargetedByBoss,
        Scream,
        GatherKeyItem
    }

    [RequireComponent(typeof(BoxCollider))]
    public class MockStatTrigger : MonoBehaviour
    {
        [Header("Chọn loại sự kiện muốn Test")]
        public StatTriggerType triggerType;

        private void Start()
        {
            // Tự động bật IsTrigger
            GetComponent<BoxCollider>().isTrigger = true;

            // Xóa dòng này đi nếu bạn không muốn cục test bị tàng hình
            // GetComponent<MeshRenderer>().enabled = false; 
        }

        private void OnTriggerEnter(Collider other)
        {
            // Kiểm tra xem thằng chạm vào có phải là Player local của mình không
            // Giả sử Player của bạn có tag "Player" và có component PhotonView
            if (other.CompareTag("Player"))
            {
                PhotonView pv = other.GetComponent<PhotonView>();

                // CHỈ BẮN EVENT NẾU LÀ NHÂN VẬT CỦA BẢN THÂN
                // (Để tránh việc máy A chạm vào, máy B cũng đếm)
                if (pv != null && pv.IsMine)
                {
                    int myActorNumber = PhotonNetwork.LocalPlayer.ActorNumber;
                    FireStatEvent(myActorNumber);

                    Debug.Log($"<color=orange>[TEST]</color> Player {myActorNumber} vừa trigger {triggerType}!");
                }
            }
        }

        private void FireStatEvent(int actorNumber)
        {
            // Bắn đúng event tùy theo Enum đã chọn trên Inspector
            switch (triggerType)
            {
                case StatTriggerType.RescueTeammate:
                    GameplayEvents.OnPlayerRescued?.Invoke(actorNumber, 0); // Param thứ 2 tạm để 0 (người bị cứu)
                    break;
                case StatTriggerType.GetKnocked:
                    GameplayEvents.OnPlayerKnocked?.Invoke(actorNumber);
                    break;
                case StatTriggerType.KillMonster:
                    GameplayEvents.OnSmallMonsterKilled?.Invoke(actorNumber);
                    break;
                case StatTriggerType.TargetedByBoss:
                    GameplayEvents.OnBossTargetedPlayer?.Invoke(actorNumber);
                    break;
                case StatTriggerType.Scream:
                    GameplayEvents.OnPlayerScreamed?.Invoke(actorNumber);
                    break;
                case StatTriggerType.GatherKeyItem:
                    GameplayEvents.OnKeyItemGathered?.Invoke(actorNumber);
                    break;
            }
        }
    }
}