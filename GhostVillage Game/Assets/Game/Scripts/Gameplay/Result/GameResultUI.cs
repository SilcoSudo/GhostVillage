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

        // --- Logic Hiển thị (Giữ nguyên) ---
        bool isTeamWin = matchData.playerResults.Any(p => p.outcome == "ESCAPED");

        if (isTeamWin) { _txtTeamResult.text = "ĐỘI SỐNG SÓT"; _txtTeamResult.color = Color.green; }
        else { _txtTeamResult.text = "THẤT BẠI"; _txtTeamResult.color = Color.red; }

        string timeStr = System.TimeSpan.FromSeconds(Mathf.Abs(matchData.durationSec)).ToString(@"mm\:ss"); // Fix số âm nếu có
        _txtMapName.text = $"{matchData.mapId} | {timeStr}";

        var myData = matchData.playerResults.Find(p => p.userId == localUserId);
        bool amIEscaped = myData != null && myData.outcome == "ESCAPED";

        if (amIEscaped) { _txtPersonalResult.text = "BẠN ĐÃ THOÁT!"; _txtPersonalResult.color = Color.cyan; }
        else { _txtPersonalResult.text = "BẠN ĐÃ BỊ BẮT!"; _txtPersonalResult.color = new Color(1f, 0.4f, 0.4f); }

        foreach (Transform child in _rowContainer) Destroy(child.gameObject);
        foreach (var p in matchData.playerResults)
        {
            var rowObj = Instantiate(_rowPrefab, _rowContainer);
            var script = rowObj.GetComponent<ResultRowUI>();
            if (script) script.Setup(p.nickname, p.outcome, matchData.durationSec, p.rewards.exp, p.rewards.coin, p.titles, p.userId == localUserId);
        }

        // 2. [FIX QUAN TRỌNG] Kiểm tra Active trước khi chạy Coroutine
        // Nếu cha bị tắt, activeInHierarchy sẽ là false -> Chạy Coroutine sẽ crash game.
        if (gameObject.activeInHierarchy)
        {
            StartCoroutine(FadeInRoutine());
        }
        else
        {
            // Fallback: Nếu không active trong hierarchy (do cha tắt), set luôn alpha = 1
            // Để khi nào cha bật lên là thấy ngay
            _canvasGroup.alpha = 1;
            _canvasGroup.interactable = true;
            _canvasGroup.blocksRaycasts = true;
            Debug.LogWarning("⚠️ GameResultUI bật active nhưng cha nó đang ẩn. Đã set Alpha = 1.");
        }

        // Mở chuột
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

        // 2. Chuyển Scene về lại LobbyListScene
        // Lưu ý: Đảm bảo "LobbyListScene" có logic check: Nếu đã ở trong Room rồi thì hiện UI Room thay vì UI List.
        if (_sceneLoader != null)
        {
            _sceneLoader.LoadSceneAsync("LobbyListScene").Forget();
        }
        else
        {
            UnityEngine.SceneManagement.SceneManager.LoadScene("LobbyListScene");
        }
    }

    private void OnMainMenuClicked()
    {
        PhotonNetwork.Disconnect();
        if (_sceneLoader != null) _sceneLoader.LoadSceneAsync("MainMenu").Forget();
        else UnityEngine.SceneManagement.SceneManager.LoadScene("MainMenu");
    }
}