using UnityEngine;
using Photon.Pun;

public class TestKnockTrap : MonoBehaviour
{
    private Collider _trapCollider;

    private void Awake()
    {
        // Lấy cái Collider (BoxCollider/SphereCollider) của cục bẫy
        _trapCollider = GetComponent<Collider>();
    }

    private void OnTriggerEnter(Collider other)
    {
        // Kiểm tra coi có phải Player đạp trúng không
        if (other.CompareTag("Player"))
        {
            PhotonView pv = other.GetComponent<PhotonView>();

            // Chú ý: Chỉ thằng CHỦ của Player đó mới tự gọi lệnh Gục. 
            if (pv != null && pv.IsMine)
            {
                PlayerKnockedState knockedState = other.GetComponent<PlayerKnockedState>();

                if (knockedState != null && !knockedState.isKnocked)
                {
                    Debug.Log("<color=magenta>[Bẫy]</color> Oạch! Đạp trúng vỏ chuối, kích hoạt trạng thái GỤC.");
                    knockedState.GetKnocked();

                    // TẮT COLLIDER NGAY LẬP TỨC 
                    // Để lúc được bồ cứu đứng dậy không bị dính chưởng tiếp
                    if (_trapCollider != null)
                    {
                        _trapCollider.enabled = false;
                        Debug.Log("<color=gray>[Bẫy]</color> Đã tự hủy bẫy (Tắt Collider)!");

                        // Nếu bro thích có thể ẩn luôn cái cục Cube đi cho sạch mắt:
                        // this.gameObject.SetActive(false); 
                    }
                }
            }
        }
    }
}