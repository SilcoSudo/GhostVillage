using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Photon.Pun;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Game.Domain.Match.DTO;
using Game.Core.Scene;
using VContainer;
using Cysharp.Threading.Tasks;

public class GameResultUI : MonoBehaviour
{
    [Header("UI Header")]
    [SerializeField] private TextMeshProUGUI _txtTeamResult;
    [SerializeField] private TextMeshProUGUI _txtPersonalResult;
    [SerializeField] private TextMeshProUGUI _txtMapName;

    [Header("List Container")]
    [SerializeField] private Transform _rowContainer;
    [SerializeField] private GameObject _rowPrefab;

    [Header("Buttons")]
    [SerializeField] private Button _btnReturnLobby;
    [SerializeField] private Button _btnMainMenu;
    [SerializeField] private TextMeshProUGUI _txtWaitingHost;

    private CanvasGroup _canvasGroup;
    private ISceneLoaderService _sceneLoader;

    [Inject]
    public void Construct(ISceneLoaderService sceneLoader)
    {
        _sceneLoader = sceneLoader;
    }

    private void Awake()
    {
        _canvasGroup = GetComponent<CanvasGroup>();
        if (_canvasGroup == null) _canvasGroup = gameObject.AddComponent<CanvasGroup>();

        _btnReturnLobby.onClick.AddListener(OnReturnLobbyClicked);
        _btnMainMenu.onClick.AddListener(OnMainMenuClicked);

        // Reset trạng thái ban đầu
        _canvasGroup.alpha = 0;
        _canvasGroup.interactable = false;
        _canvasGroup.blocksRaycasts = false;

        // Lưu ý: Không cần SetActive(false) ở đây nếu trong Editor đã tắt rồi.
        // Nếu tắt ở đây, hãy đảm bảo cha nó đang bật.
    }

    public void Show(SaveMatchRequestDTO matchData, string localUserId)
    {
        // 1. Bật Object lên trước
        gameObject.SetActive(true);

        // --- Logic Hiển thị ---
        bool isTeamWin = matchData.playerResults.Any(p => p.outcome == "ESCAPED");

        if (isTeamWin) { _txtTeamResult.text = "ĐỘI SỐNG SÓT"; _txtTeamResult.color = Color.green; }
        else { _txtTeamResult.text = "THẤT BẠI"; _txtTeamResult.color = Color.red; }

        string timeStr = System.TimeSpan.FromSeconds(Mathf.Abs(matchData.durationSec)).ToString(@"mm\:ss");
        _txtMapName.text = $"{matchData.mapId} | {timeStr}";

        string myNickname = PhotonNetwork.LocalPlayer.NickName;
        var myData = matchData.playerResults.Find(p => p.nickname == myNickname);

        bool amIEscaped = myData != null && myData.outcome == "ESCAPED";

        if (amIEscaped) { _txtPersonalResult.text = "BẠN ĐÃ THOÁT!"; _txtPersonalResult.color = Color.cyan; }
        else { _txtPersonalResult.text = "BẠN ĐÃ BỊ BẮT!"; _txtPersonalResult.color = new Color(1f, 0.4f, 0.4f); }

        foreach (Transform child in _rowContainer) Destroy(child.gameObject);

        foreach (var p in matchData.playerResults)
        {
            var rowObj = Instantiate(_rowPrefab, _rowContainer);
            var script = rowObj.GetComponent<ResultRowUI>();

            // [FIX QUAN TRỌNG 2] Check isMe bằng nickname luôn để tên sáng màu Vàng
            bool isMe = p.nickname == myNickname;

            if (script) script.Setup(p.nickname, p.outcome, matchData.durationSec, p.rewards.exp, p.rewards.coin, p.titles, isMe);
        }

        // --- [FIX QUAN TRỌNG CHỖ NÀY] PHÂN QUYỀN NÚT BẤM ---
        if (PhotonNetwork.IsMasterClient)
        {
            // Nếu là Host: Hiện nút Về Lobby, tắt Text chờ
            _btnReturnLobby.gameObject.SetActive(true);

        }
        else
        {
            // Nếu là Client: Tắt nút Về Lobby, hiện Text "Đang chờ Trưởng phòng..."
            _btnReturnLobby.gameObject.SetActive(false);
        }

        // Nút MainMenu (Thoát game) thì ai cũng có quyền bấm
        _btnMainMenu.gameObject.SetActive(true);

        // 2. Kiểm tra Active trước khi chạy Coroutine
        if (gameObject.activeInHierarchy)
        {
            StartCoroutine(FadeInRoutine());
        }
        else
        {
            _canvasGroup.alpha = 1;
            _canvasGroup.interactable = true;
            _canvasGroup.blocksRaycasts = true;
        }

        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;
    }

    private IEnumerator FadeInRoutine()
    {
        float t = 0;
        while (t < 1f) { t += Time.deltaTime * 2f; _canvasGroup.alpha = t; yield return null; }
        _canvasGroup.alpha = 1;
        _canvasGroup.interactable = true;
        _canvasGroup.blocksRaycasts = true;
    }

    private void OnReturnLobbyClicked()
    {
        Debug.Log("Click: Quay lại phòng chờ (Giữ kết nối Photon)");

        // KHI BẬT TÍNH NĂNG ĐỒNG BỘ SCENE CỦA PHOTON (AutomaticallySyncScene = true), 
        // BẠN PHẢI DÙNG PHOTONNETWORK ĐỂ LOAD SCENE, KHÔNG DÙNG SCENE MANAGER HAY SCENE LOADER CỦA BẠN.

        // _sceneLoader.LoadSceneAsync("LobbyGameScene").Forget();  <-- XOÁ DÒNG NÀY

        if (PhotonNetwork.IsMasterClient)
        {
            // Dọn dẹp túi đồ và trạng thái trước khi về
            // (Nên bắn 1 Event để báo UI/Các hệ thống khác dọn dẹp nếu cần)

            // Lệnh này sẽ yêu cầu TẤT CẢ mọi người trong phòng cùng load Scene Lobby
            PhotonNetwork.LoadLevel("LobbyGameScene");
        }
    }

    private void OnMainMenuClicked()
    {
        // 1. Vô hiệu hóa nút để tránh bấm nhiều lần
        _btnMainMenu.interactable = false;
        _btnReturnLobby.interactable = false;

        // 2. Tắt tự động đồng bộ Scene
        PhotonNetwork.AutomaticallySyncScene = false;

        // 3. Nếu đang trong phòng thì rời phòng, còn không thì về thẳng MainMenu
        if (PhotonNetwork.InRoom)
        {
            // Báo cho PhotonNetworkManager biết mục tiêu sau khi LeaveRoom xong là về MainMenu
            PlayerPrefs.SetString("TargetSceneAfterLeave", "MainMenu");
            PhotonNetwork.LeaveRoom();
        }
        else
        {
            if (_sceneLoader != null) _sceneLoader.LoadSceneAsync("MainMenu").Forget();
            else UnityEngine.SceneManagement.SceneManager.LoadScene("MainMenu");
        }
    }
}