using UnityEngine;
using Photon.Pun;

namespace Game.Core.Network
{
    // Kế thừa MonoBehaviourPunCallbacks để nhận sự kiện Photon
    public class NetworkManager : MonoBehaviourPunCallbacks
    {
        // Singleton Instance (nếu cần dùng cho các UI đơn giản không qua DI)
        // Nhưng trong kiến trúc này ta ưu tiên Inject class này vào Controller.

        private void Awake()
        {
            DontDestroyOnLoad(this);
        }

        public void Connect()
        {
            Debug.Log("Connecting to Photon...");
            PhotonNetwork.ConnectUsingSettings();
        }
    }
}