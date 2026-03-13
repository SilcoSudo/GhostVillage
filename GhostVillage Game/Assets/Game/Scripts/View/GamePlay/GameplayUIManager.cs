using UnityEngine;
using TMPro;
using Photon.Pun;
using Game.Domain.Match.DTO;

public class GameplayUIManager : MonoBehaviourPunCallbacks
{
    // Kéo GameResultUI (con của prefab này) vào đây
    [Header("Sub-Systems")]
    [SerializeField] private GameResultUI _resultUI;

    [Header("Interaction UI")]
    [SerializeField] private GameObject interactPanel;
    [SerializeField] private TextMeshProUGUI interactText;

    // ĐÃ XÓA KHÚC CODE CỦA ESC MENU CŨ

    private void Awake()
    {
        // Ẩn UI phụ
        if (interactPanel) interactPanel.SetActive(false);
        if (_resultUI) _resultUI.gameObject.SetActive(false);
    }

    // --- EXTERNAL CALLS (GameManager gọi cái này) ---
    public void ShowGameResult(SaveMatchRequestDTO matchData)
    {
        // 1. Tắt hết HUD
        if (interactPanel) interactPanel.SetActive(false);

        // 2. Gọi hiển thị kết quả
        if (_resultUI != null)
        {
            // TODO: Lấy ID thật từ Photon Player Properties
            string myUserId = "MY_ID";
            _resultUI.Show(matchData, myUserId);

            // Hiện chuột lên để click vào UI Result
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
        }
        else
        {
            Debug.LogError("❌ Chưa kéo GameResultUI vào GameplayUIManager!");
        }
    }

    // --- INTERACTION UI LOGIC ---
    public override void OnEnable()
    {
        base.OnEnable(); // BẮT BUỘC PHẢI CÓ ĐỂ PHOTON HOẠT ĐỘNG
        InteractionEvents.OnInteractHover += HandleInteractHover;
    }

    public override void OnDisable()
    {
        base.OnDisable(); // BẮT BUỘC PHẢI CÓ ĐỂ PHOTON HOẠT ĐỘNG
        InteractionEvents.OnInteractHover -= HandleInteractHover;
    }

    private void HandleInteractHover(string prompt, bool isHovering)
    {
        if (interactPanel != null)
        {
            interactPanel.SetActive(isHovering);

            if (isHovering && interactText != null)
            {
                interactText.text = prompt;
            }
        }
    }
}