using UnityEngine;
using TMPro;
using UnityEngine.UI;
using System;

// Phân loại Hint để UI biết phải bật bảng nào
public enum HintType
{
    System,
    Puzzle
}

public class HintModalUI : MonoBehaviour
{
    [Header("=== SYSTEM HINT UI (Grp_System_Hint) ===")]
    public GameObject sysHintRoot;
    public TextMeshProUGUI sysTxtTitle;
    public TextMeshProUGUI sysTxtHint;
    public Button sysBtnClose;

    [Header("=== PUZZLE HINT UI (Grp_Puzzle_2_Hint) ===")]
    public GameObject puzHintRoot;
    public TextMeshProUGUI puzTxtTitle;
    public TextMeshProUGUI puzTxtHint;
    public Button puzBtnClose;

    public static bool IsHintOpen = false;

    // Kênh radio gọi UI, có thêm biến HintType để phân loại
    public static Action<string, string, HintType> OnShowHint;

    private void Awake()
    {
        // Gắn sự kiện cho các nút Close
        if (sysBtnClose != null) sysBtnClose.onClick.AddListener(() => CloseModal(sysHintRoot));
        if (puzBtnClose != null) puzBtnClose.onClick.AddListener(() => CloseModal(puzHintRoot));

        OnShowHint += ShowModal;

        // Tắt hết Modal lúc mới vào game
        if (sysHintRoot != null) sysHintRoot.SetActive(false);
        if (puzHintRoot != null) puzHintRoot.SetActive(false);
    }

    private void OnDestroy()
    {
        OnShowHint -= ShowModal;
    }

    private void ShowModal(string title, string content, HintType type)
    {
        IsHintOpen = true; // 2. BẬT CỜ KHI MỞ GIAO DIỆN

        if (type == HintType.System)
        {
            if (sysTxtTitle != null) sysTxtTitle.text = title;
            if (sysTxtHint != null) sysTxtHint.text = content;
            sysHintRoot.SetActive(true);
        }
        else if (type == HintType.Puzzle)
        {
            if (puzTxtTitle != null) puzTxtTitle.text = title;
            if (puzTxtHint != null) puzTxtHint.text = content;
            puzHintRoot.SetActive(true);
        }

        // Mở khóa chuột để ấn nút Close
        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;
    }

    private void CloseModal(GameObject panelToClose)
    {
        IsHintOpen = false; // 3. TẮT CỜ KHI ĐÓNG GIAO DIỆN

        panelToClose.SetActive(false);

        // Khóa chuột lại cho game FPS
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }
}