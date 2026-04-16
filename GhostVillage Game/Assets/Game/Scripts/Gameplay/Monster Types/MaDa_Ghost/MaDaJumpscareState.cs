using UnityEngine;
using GhostVillage.Gameplay.Base;
using Photon.Pun;

namespace GhostVillage.Gameplay.Monsters.Mada
{
    public class MaDaJumpscareState : IMonsterState
    {
        private readonly MaDaMonster monster;
        private readonly Transform victim;
        private float timer = 0f;
        private readonly float jumpscareDuration = 2.5f; // Thời gian vồ (khớp với Animation)

        public MaDaJumpscareState(MaDaMonster monster, Transform victim)
        {
            this.monster = monster;
            this.victim = victim;
        }

        public void Enter()
        {
            Debug.Log("<color=red>[Jumpscare]</color> KHÓA MỤC TIÊU! VỒ!!!");

            // 1. Khóa cứng di chuyển
            monster.Stop();

            // 2. Tính hướng nhìn
            Vector3 dir = Vector3.forward;
            if (victim != null)
            {
                dir = victim.position - monster.transform.position;
                dir.y = 0; // Giữ thăng bằng
                if (dir.sqrMagnitude > 0.001f)
                {
                    monster.transform.rotation = Quaternion.LookRotation(dir);
                }
            }

            // 3. Kích hoạt Animation & Âm thanh thét TRÊN MÁY MASTER
            if (monster.GetAnimator() != null) monster.GetAnimator().SetTrigger("TriggerJumpscare");
            monster.PlayMonsterAudio("MADA_JUMPSCARE", false);

            // 4. ĐỒNG BỘ MẠNG
            PhotonView monsterPv = monster.GetComponent<PhotonView>();
            if (monsterPv != null)
            {
                // A. Gọi lệnh RPC cho mọi máy để thấy con quái gầm thét
                monsterPv.RPC("RpcPlayJumpscareEffect", RpcTarget.Others, dir);

                // B. Bắn RPC sang thằng Player bị bắt để ép nó khóa màn hình
                if (victim != null)
                {
                    PhotonView victimPv = victim.GetComponent<PhotonView>();
                    if (victimPv != null)
                    {
                        victimPv.RPC("ReceiveJumpscareRPC", RpcTarget.All, monsterPv.ViewID);
                    }
                }
            }
        }

        public void Update()
        {
            timer += Time.deltaTime;

            // Trong lúc thét, nếu Player có lỡ trôi nhẹ thì Ma Da vẫn liếc theo
            if (victim != null)
            {
                Vector3 dir = victim.position - monster.transform.position;
                dir.y = 0;
                if (dir.sqrMagnitude > 0.001f)
                {
                    monster.transform.rotation = Quaternion.Lerp(monster.transform.rotation, Quaternion.LookRotation(dir), Time.deltaTime * 10f);
                }
            }
        }

        public void Exit()
        {
            // Trả lại AI cho Ma Da
            if (monster.GetNavMeshAgent() != null)
            {
                monster.GetNavMeshAgent().enabled = true;
            }
        }

        public bool ShouldExit()
        {
            // Tự động kết thúc State sau khi la hét xong
            return timer >= jumpscareDuration;
        }
    }
}