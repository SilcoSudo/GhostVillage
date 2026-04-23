using UnityEngine;
using UnityEngine.UI;
using GhostVillage.Shop;
using TMPro;

namespace GhostVillage.Storage
{
    public class StorageSlotUI : MonoBehaviour
    {
        public Image imgIcon;
        public GameObject equipTag; // Cái dấu tích xanh "Equipped"
        public TextMeshProUGUI txtName;

        public Button btnClick;

        public void Setup(ShopItemSO data, bool isEquipped, System.Action onClick)
        {
            imgIcon.sprite = data.icon;
            equipTag.SetActive(isEquipped);
            txtName.text = data.itemName;
            btnClick.onClick.RemoveAllListeners();
            btnClick.onClick.AddListener(() => onClick?.Invoke());
        }
    }
}