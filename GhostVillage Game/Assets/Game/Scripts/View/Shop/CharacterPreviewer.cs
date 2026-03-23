using UnityEngine;

namespace GhostVillage.Shop 
{
    public class CharacterPreviewer : MonoBehaviour 
    {
        [Header("Anchors & Points")]
        [Tooltip("Kéo object HatAnchor vào đây")]
        public Transform hatAnchor; 
        
        [Header("Body Models")]
        [Tooltip("Kéo tất cả các khối Body (ví dụ: Body_Default) vào mảng này để script biết đường Bật/Tắt")]
        public GameObject[] bodyModels;

        // Biến này để nhớ cái nón đang đội, để lúc đội nón khác thì xóa cái cũ đi
        private GameObject currentHatInstance;

        // Hàm chính để các UI Button gọi tới khi người chơi bấm vào vật phẩm
        public void PreviewCosmetic(CosmeticSO cosmetic) 
        {
            if (cosmetic == null) return;

            if (cosmetic.cosmeticType == CosmeticType.Hat) 
            {
                EquipHat(cosmetic.hatPrefab);
            }
            else if (cosmetic.cosmeticType == CosmeticType.Body) 
            {
                EquipBody(cosmetic.modelGameObjectName);
            }
        }

        private void EquipHat(GameObject hatPrefab)
        {
            // 1. Xóa nón cũ nếu đang đội
            if (currentHatInstance != null) 
            {
                Destroy(currentHatInstance);
            }

            // 2. Tạo nón mới
            if (hatPrefab != null && hatAnchor != null) 
            {
                // Instantiate sinh ra prefab và tự động đặt nó làm con của hatAnchor
                currentHatInstance = Instantiate(hatPrefab, hatAnchor);
                
                // Đảm bảo nón nằm chính giữa Anchor và không bị lệch góc
                currentHatInstance.transform.localPosition = Vector3.zero;
                currentHatInstance.transform.localRotation = Quaternion.identity;
            }
        }

        private void EquipBody(string targetBodyName)
        {
            // Duyệt qua danh sách tất cả các Body bạn đã kéo vào Inspector
            foreach (GameObject body in bodyModels)
            {
                if (body != null)
                {
                    // Nếu tên của khối trụ trùng với tên ghi trong file SO -> Bật (true)
                    // Nếu không trùng -> Tắt (false)
                    bool isMatch = (body.name == targetBodyName);
                    body.SetActive(isMatch);
                }
            }
        }
    }
}