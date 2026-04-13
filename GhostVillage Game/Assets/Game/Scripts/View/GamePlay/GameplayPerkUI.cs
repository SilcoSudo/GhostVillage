using UnityEngine;
using UnityEngine.UI;
using Photon.Pun;
using System.Collections.Generic;
using GhostVillage.Shop; // Nhớ đổi đúng Namespace chứa ItemDatabaseSO của sếp

public class GameplayPerkUI : MonoBehaviour
{
    public static GameplayPerkUI Instance;

    [Header("UI References")]
    [Tooltip("Kéo 3 cái Image con trong Grp_Perk vào đây theo thứ tự")]
    [SerializeField] private Image[] _perkIcons;

    [Header("Database")]
    [Tooltip("Kéo file ItemDatabaseSO vào đây để lấy hình")]
    [SerializeField] private ItemDatabaseSO _itemDatabase;

    // Lưu trữ các Icon đang sáng để sau này làm hiệu ứng mờ đi khi xài xong (VD: Hồi sinh)
    private Dictionary<string, Image> _activePerksMap = new Dictionary<string, Image>();

    private void Awake()
    {
        if (Instance == null) Instance = this;
        else Destroy(gameObject);
    }

    private void Start()
    {
        Debug.Log("<color=magenta>[GameplayPerkUI]</color> Đang khởi tạo UI Perk...");

        if (_itemDatabase == null || _perkIcons == null || _perkIcons.Length == 0)
        {
            Debug.LogError("<color=red>[GameplayPerkUI]</color> LỖI: Sếp chưa kéo ItemDatabaseSO hoặc 3 cái Image vào script!");
            return;
        }

        InitializePerkIcons();
    }

    private void InitializePerkIcons()
    {
        // 1. Tắt tàng hình hết cả 3 ô lúc mới vào
        foreach (var img in _perkIcons)
        {
            if (img == null) continue;
            img.gameObject.SetActive(false);
            SetImageAlpha(img, 1f);
        }

        _activePerksMap.Clear();

        // 2. Móc túi đồ Photon ra kiểm tra
        var props = PhotonNetwork.LocalPlayer.CustomProperties;
        if (props == null || !props.TryGetValue("Perk_IDs", out object idsObj))
        {
            Debug.Log("<color=yellow>[GameplayPerkUI]</color> Không có ID Perk nào. Chắc đi tay không!");
            return;
        }

        // Ép kiểu cho an toàn vì Photon hay tự đổi string[] thành object[]
        string[] equippedPerks = idsObj as string[];
        if (equippedPerks == null && idsObj is object[] objArray)
        {
            equippedPerks = new string[objArray.Length];
            for (int i = 0; i < objArray.Length; i++) equippedPerks[i] = objArray[i].ToString();
        }

        if (equippedPerks == null) return;

        // 3. Ốp hình vào khung
        for (int i = 0; i < equippedPerks.Length; i++)
        {
            if (i >= _perkIcons.Length) break;

            string perkId = equippedPerks[i];
            var itemData = _itemDatabase.GetItemById(perkId);

            if (itemData != null && itemData.icon != null)
            {
                _perkIcons[i].sprite = itemData.icon;
                _perkIcons[i].gameObject.SetActive(true);
                _activePerksMap[perkId] = _perkIcons[i];
                Debug.Log($"<color=green>[GameplayPerkUI]</color> Gắn Icon thành công: {perkId}");
            }
        }
    }

    // Hàm này để gọi khi Perk dùng xong 1 lần (VD: Auto Revive xong thì gọi hàm này truyền ID vào để nó mờ đi)
    public void DimPerkIcon(string perkId)
    {
        if (string.IsNullOrEmpty(perkId)) return;
        if (_activePerksMap.TryGetValue(perkId, out Image iconImg))
        {
            SetImageAlpha(iconImg, 0.3f); // Làm mờ 70%
        }
    }

    private void SetImageAlpha(Image img, float alpha)
    {
        if (img == null) return;
        Color c = img.color;
        c.a = alpha;
        img.color = c;
    }
}