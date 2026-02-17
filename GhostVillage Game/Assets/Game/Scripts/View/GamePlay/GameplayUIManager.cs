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
        PhotonNetwork.LeaveRoom();
    }

    public override void OnLeftRoom()
    {
        // Khi thoát phòng (do bấm Exit hoặc do GameResultUI gọi)
        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;

        if (_sceneLoader != null)
            _sceneLoader.LoadSceneAsync("LobbyListScene").Forget();
        else
            UnityEngine.SceneManagement.SceneManager.LoadScene("LobbyListScene");
    }
}