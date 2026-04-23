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
    [SerializeField] private TextMeshProUGUI _txtMoonEvent;

    [Header("List Container")]
    [SerializeField] private Transform _rowContainer;
    [SerializeField] private GameObject _rowPrefab;

    [Header("Buttons")]
    [SerializeField] private Button _btnReturnLobby;
    [SerializeField] private Button _btnMainMenu;

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
    }

    public void Show(SaveMatchRequestDTO matchData, string localUserId)
    {
        gameObject.SetActive(true);

        // --- Logic Hiển thị ---
        bool isTeamWin = matchData.playerResults.Any(p => p.outcome == "ESCAPED");

        // Dịch sang Tiếng Anh
        if (isTeamWin) { _txtTeamResult.text = "TEAM SURVIVED"; _txtTeamResult.color = Color.green; }
        else { _txtTeamResult.text = "TEAM DEFEATED"; _txtTeamResult.color = Color.red; }

        string timeStr = System.TimeSpan.FromSeconds(Mathf.Abs(matchData.durationSec)).ToString(@"mm\:ss");
        string moonName = string.IsNullOrEmpty(matchData.moonEventName) ? "Trăng Bình Thường" : matchData.moonEventName;

        // Tùy chọn 1: Nếu sếp có Text riêng cho Trăng
        if (_txtMoonEvent != null) _txtMoonEvent.text = moonName;
        _txtMapName.text = $"{matchData.mapId} | {timeStr}";

        string myNickname = PhotonNetwork.LocalPlayer.NickName;
        var myData = matchData.playerResults.Find(p => p.nickname == myNickname);

        bool amIEscaped = myData != null && myData.outcome == "ESCAPED";

        // Dịch sang Tiếng Anh
        if (amIEscaped) { _txtPersonalResult.text = "YOU ESCAPED!"; _txtPersonalResult.color = Color.cyan; }
        else { _txtPersonalResult.text = "YOU WERE CAUGHT!"; _txtPersonalResult.color = new Color(1f, 0.4f, 0.4f); }

        foreach (Transform child in _rowContainer) Destroy(child.gameObject);

        foreach (var p in matchData.playerResults)
        {
            var rowObj = Instantiate(_rowPrefab, _rowContainer);
            var script = rowObj.GetComponent<ResultRowUI>();

            bool isMe = p.nickname == myNickname;

            if (script) script.Setup(p.nickname, p.outcome, matchData.durationSec, p.rewards.exp, p.rewards.coin, p.titles, isMe);
        }

        // --- PHÂN QUYỀN NÚT BẤM ---
        if (PhotonNetwork.IsMasterClient)
        {
            _btnReturnLobby.gameObject.SetActive(true);
        }
        else
        {
            _btnReturnLobby.gameObject.SetActive(false);
        }

        _btnMainMenu.gameObject.SetActive(true);

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
        Debug.Log("Click: Return to Lobby Room (Keep Photon Connection)");

        if (PhotonNetwork.IsMasterClient)
        {
            PhotonNetwork.LoadLevel("LobbyGameScene");
        }
    }

    private void OnMainMenuClicked()
    {
        // 1. Vô hiệu hóa nút
        _btnMainMenu.interactable = false;
        _btnReturnLobby.interactable = false;

        // 2. Tắt tự động đồng bộ Scene
        PhotonNetwork.AutomaticallySyncScene = false;

        // 3. Ngắt Voice
        var voiceClient = UnityEngine.Object.FindFirstObjectByType<Photon.Voice.PUN.PunVoiceClient>();
        if (voiceClient != null)
        {
            voiceClient.Disconnect();
            Debug.Log("🔇 [Voice] Safely disconnected before leaving.");
        }

        // ================================================================
        // [FIX CHÍ MẠNG]: Dùng Disconnect thay vì LeaveRoom để tránh bị 
        // dội lại OnLeftRoom() của các UI khác, ép LoadSceneAsync("MainMenu")
        // ================================================================
        if (PhotonNetwork.IsConnected)
        {
            PhotonNetwork.Disconnect();
        }

        // Bất chấp Photon làm gì, ta cứ LoadScene MainMenu
        if (_sceneLoader != null)
        {
            _sceneLoader.LoadSceneAsync("MainMenu").Forget();
        }
        else
        {
            UnityEngine.SceneManagement.SceneManager.LoadScene("MainMenu");
        }
    }
}