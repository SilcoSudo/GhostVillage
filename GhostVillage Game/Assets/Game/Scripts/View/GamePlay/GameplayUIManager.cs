using UnityEngine;
using TMPro;
using UnityEngine.UI;
using Photon.Pun;
using VContainer;
using Game.Domain.Match.DTO;
using Cysharp.Threading.Tasks;

public class GameplayUIManager : MonoBehaviourPunCallbacks
{
    // Kéo GameResultUI (con của prefab này) vào đây
    [Header("Sub-Systems")]
    [SerializeField] private GameResultUI _resultUI;

    [Header("Interaction UI")]
    [SerializeField] private GameObject interactPanel;
    [SerializeField] private TextMeshProUGUI interactText;

    [Header("ESC Menu")]
    [SerializeField] private GameObject _escMenuModal;
    [SerializeField] private Button _btnExitMatch;
    [SerializeField] private Button _btnCloseEscMenu;

    // Inject service vào đây (nếu cần dùng cho logic thoát)
    [Inject] private Game.Core.Scene.ISceneLoaderService _sceneLoader;

    private void Awake()
    {
        // Ẩn UI phụ
        if (_escMenuModal) _escMenuModal.SetActive(false);
        if (interactPanel) interactPanel.SetActive(false);
        if (_resultUI) _resultUI.gameObject.SetActive(false);

        // Setup Events
        if (_btnExitMatch) _btnExitMatch.onClick.AddListener(OnExitMatchClicked);
        if (_btnCloseEscMenu) _btnCloseEscMenu.onClick.AddListener(() => ShowEscMenu(false));
    }

    // --- EXTERNAL CALLS (GameManager gọi cái này) ---
    public void ShowGameResult(SaveMatchRequestDTO matchData)
    {
        // 1. Tắt hết HUD
        if (interactPanel) interactPanel.SetActive(false);
        if (_escMenuModal) _escMenuModal.SetActive(false);


        // 2. Gọi hiển thị kết quả
        if (_resultUI != null)
        {
            // TODO: Lấy ID thật từ Photon Player Properties
            string myUserId = "MY_ID";
            _resultUI.Show(matchData, myUserId);
        }
        else
        {
            Debug.LogError("❌ Chưa kéo GameResultUI vào GameplayUIManager!");
        }
    }

    // --- ESC MENU LOGIC ---
    public void ToggleEscMenu()
    {
        // Không cho bật ESC khi đang hiện bảng kết quả
        if (_resultUI != null && _resultUI.gameObject.activeSelf) return;

        if (_escMenuModal) ShowEscMenu(!_escMenuModal.activeSelf);
    }

    private void ShowEscMenu(bool show)
    {
        _escMenuModal.SetActive(show);
        Cursor.lockState = show ? CursorLockMode.None : CursorLockMode.Locked;
        Cursor.visible = show;
    }

    private void OnExitMatchClicked()
    {
        ShowEscMenu(false);
        PhotonNetwork.AutomaticallySyncScene = false;
        if (PhotonNetwork.InRoom)
        {
            PlayerPrefs.SetString("TargetSceneAfterLeave", "LobbyListScene"); // Sửa thành LobbyListScene
            PhotonNetwork.LeaveRoom();
        }
    }

    // --- INTERACTION UI LOGIC ---
    public override void OnEnable()
    {
        base.OnEnable(); // BẮT BUỘC PHẢI CÓ ĐỂ PHOTON HOẠT ĐỘNG
        // Khi UI được bật, đăng ký nghe sự kiện Raycast
        InteractionEvents.OnInteractHover += HandleInteractHover;
    }

    public override void OnDisable()
    {
        base.OnDisable(); // BẮT BUỘC PHẢI CÓ ĐỂ PHOTON HOẠT ĐỘNG
        // Hủy đăng ký khi UI bị tắt để tránh lỗi Memory Leak
        InteractionEvents.OnInteractHover -= HandleInteractHover;
    }

    // Hàm này sẽ được gọi mỗi khi Player nhìn vào vật phẩm
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