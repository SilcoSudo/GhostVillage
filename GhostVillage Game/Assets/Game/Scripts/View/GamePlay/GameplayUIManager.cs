using UnityEngine;
using TMPro;
using UnityEngine.UI; // Để dùng Button
using Photon.Pun;     // Để dùng PhotonNetwork
using VContainer;     // Để Inject SceneLoader

public class GameplayUIManager : MonoBehaviourPunCallbacks
{
    [Header("Interaction UI")]
    [SerializeField] private GameObject interactPanel;
    [SerializeField] private TextMeshProUGUI interactText;

    [Header("ESC Menu")]
    [SerializeField] private GameObject _escMenuModal; // Kéo Modal vào đây
    [SerializeField] private Button _btnExitMatch;     // Kéo nút Exit vào đây
    [SerializeField] private Button _btnCloseEscMenu;  // Kéo nút Close vào đây

    // Inject SceneLoader để chuyển cảnh mượt mà
    [Inject] private Game.Core.Scene.ISceneLoaderService _sceneLoader;

    private void Awake()
    {
        // Ẩn UI lúc đầu
        if (_escMenuModal) _escMenuModal.SetActive(false);
        if (interactPanel) interactPanel.SetActive(false);

        // Gán sự kiện cho nút
        if (_btnExitMatch) _btnExitMatch.onClick.AddListener(OnExitMatchClicked);
        if (_btnCloseEscMenu) _btnCloseEscMenu.onClick.AddListener(() => ShowEscMenu(false));
    }

    private void OnEnable()
    {
        InteractionEvents.OnInteractHover += UpdateInteractUI;
        // Đăng ký event mở menu từ FPSController (nếu có) hoặc dùng Input System trực tiếp
    }

    private void OnDisable()
    {
        InteractionEvents.OnInteractHover -= UpdateInteractUI;
    }

    // --- LOGIC UI TƯƠNG TÁC ---
    private void UpdateInteractUI(string msg, bool show)
    {
        if (interactPanel)
        {
            interactText.text = msg;
            interactPanel.SetActive(show);
        }
    }

    // --- LOGIC ESC MENU ---

    public void ToggleEscMenu()
    {
        if (_escMenuModal == null) return;
        ShowEscMenu(!_escMenuModal.activeSelf);
    }

    public void ShowEscMenu(bool show)
    {
        if (_escMenuModal) _escMenuModal.SetActive(show);

        // MỞ/KHÓA CHUỘT: Khi mở menu phải hiện chuột để bấm nút
        if (show)
        {
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
        }
        else
        {
            // Tắt menu -> Khóa chuột lại để chơi game tiếp
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }
    }

    private void OnExitMatchClicked()
    {
        Debug.Log("[GameplayUI] Người chơi chọn THOÁT TRẬN.");

        // 1. Tắt menu
        ShowEscMenu(false);

        // 2. Rời phòng Photon (Sẽ trigger OnLeftRoom)
        PhotonNetwork.LeaveRoom();
    }

    // Callback của Photon khi rời phòng thành công
    public override void OnLeftRoom()
    {
        Debug.Log("[GameplayUI] Đã rời phòng. Chuyển về Lobby List.");

        // 3. Reset trỏ chuột (để về menu bấm được)
        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;

        // 4. Chuyển cảnh về Lobby List
        if (_sceneLoader != null)
        {
            _sceneLoader.LoadSceneAsync("LobbyListScene");
        }
        else
        {
            // Fallback nếu chưa inject
            UnityEngine.SceneManagement.SceneManager.LoadScene("LobbyListScene");
        }
    }
}