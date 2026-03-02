using UnityEngine;
using TMPro;
using UnityEngine.UI;
using System.Collections.Generic;
using System.Linq;

// Class để tạo bảng mapping trong Inspector
[System.Serializable]
public class MedalIconMap {
    public string medalId;
    public Sprite medalSprite;
}

public class Pfb_ProfileViewBinding : MonoBehaviour 
{
    [Header("Top Profile Info")]
    public TextMeshProUGUI txtName;
    public TextMeshProUGUI txtUID;
    public Image imgAvatar;
    
    [Header("Level & Progress")]
    public Slider sldLevelProgress;
    public TextMeshProUGUI txtLevel;
    public TextMeshProUGUI txtExpValue;

    [Header("Statistics")]
    public TextMeshProUGUI txtTotalMatches;
    
    [Header("Medal Slots")]
    public Image[] equippedMedalIcons; // Đổi từ TextMeshProUGUI sang Image để hiện Icon

    [Header("Medal Icon Library")]
    public List<MedalIconMap> medalLibrary; // Bảng tra cứu ID -> Sprite

    // Hàm bổ trợ để lấy Sprite dựa trên ID
    public Sprite GetMedalSprite(string id) {
        var map = medalLibrary.FirstOrDefault(m => m.medalId == id);
        return map != null ? map.medalSprite : null;
    }

    [Header("Medal Selector Popup")]
    public GameObject objMedalSelector;      // Khung Grp_MedalSelector
    public Transform medalGridContent;       // Content của Scr_MedalGrid
    public Button btnOpenSelector;           // Nút "Edit" hoặc "Achievement" để mở popup
    public Button btnSaveMedals;             // Nút Btn_Save
}