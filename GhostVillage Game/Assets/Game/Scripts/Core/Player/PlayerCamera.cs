using Photon.Pun;
using UnityEngine;

public class PlayerCamera : MonoBehaviourPun
{
    void Start()
    {
        if (!photonView.IsMine)
        {
            // tắt camera của người khác, chỉ bật camera của mình
            GetComponentInChildren<Camera>().enabled = false;
            GetComponentInChildren<AudioListener>().enabled = false;
        }
    }
}
