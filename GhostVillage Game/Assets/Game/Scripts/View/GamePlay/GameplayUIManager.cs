using UnityEngine;
using TMPro;
using Photon.Pun;
using Game.Domain.Match.DTO;
using UnityEngine.InputSystem; // THÊM DÒNG NÀY ĐỂ BẮT PHÍM ESC
using Game.Script.UI; // THÊM DÒNG NÀY ĐỂ GỌI GLOBAL UI

public class GameplayUIManager : MonoBehaviourPunCallbacks
{
    // Kéo GameResultUI (con của prefab này) vào đây
    [Header("Sub-Systems")]
    [SerializeField] private GameResultUI _resultUI;

    [Header("Interaction UI")]
    [SerializeField] private GameObject interactPanel;
    [SerializeField] private TextMeshProUGUI interactText;

    private GlobalUIManager _globalUI; // Biến giữ liên lạc với Sếp tổng UI

    private void Awake()
    {
        // Ẩn UI phụ
        if (interactPanel) interactPanel.SetActive(false);
        if (_resultUI) _resultUI.gameObject.SetActive(false);
    }

    [System.Obsolete]
    private void Start()
    {
        // Tìm sếp tổng GlobalUI để sai vặt
        _globalUI = FindObjectOfType<GlobalUIManager>();
        if (_globalUI != null)
        {
            _globalUI.OnGameExitClicked += HandleExitMatch;
        }

    }

    private void Update()
    {
        // ==========================================
        // GÁNH TRỌNG TRÁCH MỞ MENU ESC IN-GAME TẠI ĐÂY
        // ==========================================
        if (Keyboard.current != null && Keyboard.current.escapeKey.wasPressedThisFrame)
        {
            if (_globalUI != null)
            {
                if (_globalUI.IsEscMenuOpen())
                {
                    _globalUI.CloseEscMenu();
                }
                else
                {
                    // LƯU Ý: Chuyền đúng tham số InGame
                    _globalUI.OpenEscMenu(GlobalUIManager.EscMenuType.InGame, true);
                }
            }
        }
    }

    // --- LOGIC THOÁT GAME ---
    private void HandleExitMatch()
    {
        Debug.Log("[Gameplay] Nhận lệnh thoát từ ESC Modal! Đang rút lui...");
        if (_globalUI != null) _globalUI.ShowLoading(true, "Đang rút lui...");

        PhotonNetwork.LeaveRoom(); // Sút ra khỏi phòng
    }

    // Photon tự gọi hàm này khi đã LeaveRoom xong 100%
    public override void OnLeftRoom()
    {
        Debug.Log("[Gameplay] Đã rời phòng an toàn. Trở về sảnh!");
        UnityEngine.SceneManagement.SceneManager.LoadScene("LobbyListScene"); // Quăng về sảnh ngoài
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