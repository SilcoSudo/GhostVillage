using UnityEngine;
using TMPro;
using UnityEngine.UI;
using System.Collections.Generic;
using System.Linq;

#region Data Mapping Classes
// Gom hết class tạo bảng mapping lên trên cùng cho gọn mắt
[System.Serializable]
public class MedalIconMap
{
    public string medalId;
    public Sprite medalSprite;
}

[System.Serializable]
public class AvatarIconMap
{
    public string avatarId;
    public Sprite avatarSprite;
}
#endregion

public class Pfb_ProfileViewBinding : MonoBehaviour
{
    // ==========================================
    // 1. CHỈ SỐ PROFILE CƠ BẢN
    // ==========================================
    [Header("--- BASIC PROFILE INFO ---")]
    public TextMeshProUGUI txtName;
    public TextMeshProUGUI txtUID;
    public Image imgAvatar;
    public TextMeshProUGUI txtTotalMatches;

    [Header("--- LEVEL & PROGRESS ---")]
    public Slider sldLevelProgress;
    public TextMeshProUGUI txtLevel;
    public TextMeshProUGUI txtExpValue;

    // ==========================================
    // 2. HIỂN THỊ TRANG BỊ
    // ==========================================
    [Header("--- EQUIPPED ITEMS ---")]
    public Image[] equippedMedalIcons;

    // ==========================================
    // 3. POPUP MODALS (BẢNG CHỌN UI)
    // ==========================================
    [Header("--- MEDAL SELECTOR MODAL ---")]
    public GameObject objMedalSelector;
    public Transform medalGridContent;
    public Button btnOpenSelector;
    public Button btnSaveMedals;

    [Header("--- AVATAR SELECTOR MODAL ---")]
    public GameObject objAvatarSelector;
    public Transform avatarGridContent;
    public Button btnOpenAvatarSelector;
    public Button btnSaveAvatar;

    // ==========================================
    // 4. THƯ VIỆN DATA (KÉO THẢ ICON)
    // ==========================================
    [Header("--- ASSET LIBRARIES ---")]
    public List<MedalIconMap> medalLibrary;
    public List<AvatarIconMap> avatarLibrary;

    // ==========================================
    // 5. HELPER METHODS (XỬ LÝ LOGIC)
    // ==========================================
    public Sprite GetMedalSprite(string id)
    {
        var map = medalLibrary.FirstOrDefault(m => m.medalId == id);
        return map != null ? map.medalSprite : null;
    }

    public Sprite GetAvatarSprite(string id)
    {
        var map = avatarLibrary.FirstOrDefault(a => a.avatarId == id);
        return map != null ? map.avatarSprite : null;
    }
}