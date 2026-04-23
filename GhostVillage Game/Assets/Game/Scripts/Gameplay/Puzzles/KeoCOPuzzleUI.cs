using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.InputSystem;
using System.Collections;

public class KeoCoPuzzleUI : MonoBehaviour
{
    public static KeoCoPuzzleUI Instance;

    [Header("--- UI References ---")]
    public GameObject panelMain;
    public Slider ropeSlider;
    public TextMeshProUGUI statusText;
    public GameObject resultPanel;
    public TextMeshProUGUI resultText;

    [Header("--- Settings ---")]
    public int sequenceLength = 5;

    [Header("--- Shake Settings ---")]
    [SerializeField] private float shakeDuration = 0.25f;
    [SerializeField] private float shakeMagnitude = 8f; 
    private float _lastShakeScore = 0f;

    public KeoCoPuzzle CurrentPuzzle { get; private set; }
    
    private TugArrow[] _arrowSequence;
    private int _currentInputIndex = 0;
    private bool _isInteractable = false;
    
    private float _targetRopeValue = 0.5f;
    private float _currentScore = 0f;
    private float _targetScore = 20f;

    private enum TugArrow { Up, Down, Left, Right }

    private void Awake() {
        if (Instance == null) Instance = this;
        else if (Instance != this) Destroy(gameObject);
        
        if (panelMain != null) panelMain.SetActive(false);
    }

    public void OpenPuzzle(KeoCoPuzzle puzzle) {
        CurrentPuzzle = puzzle;
        _isInteractable = true;
        _currentScore = 0f;
        _lastShakeScore = 0f; 
        _targetScore = puzzle.GetTargetScore();
        _targetRopeValue = 0.5f;
        
        // Bật lại các UI con trong trường hợp ván trước bị ẩn lúc Thua
        if (ropeSlider != null) { ropeSlider.gameObject.SetActive(true); ropeSlider.value = 0.5f; }
        if (statusText != null) statusText.gameObject.SetActive(true);

        panelMain.SetActive(true);
        if (resultPanel != null) resultPanel.SetActive(false);

        BuildArrowSequence();
        UpdateSequenceStatus(); 
    }

    public void ClosePuzzle() {
        _isInteractable = false;
        CurrentPuzzle = null;
        if (panelMain != null) panelMain.SetActive(false);
    }

    public void UpdateNetworkState(float score, float targetScore) {
        _currentScore = score;
        _targetScore = targetScore;

        if (Mathf.Abs(_currentScore - _lastShakeScore) >= 5f) {
            StartCoroutine(ShakeUI());
            _lastShakeScore = (Mathf.Floor(_currentScore / 5f)) * 5f; 
        }

        _targetRopeValue = Mathf.Clamp01((_currentScore + _targetScore) / (2f * _targetScore));
        if (_isInteractable) UpdateSequenceStatus();
    }

    private IEnumerator ShakeUI() {
        RectTransform rt = panelMain.GetComponent<RectTransform>();
        Vector3 originalPos = rt.anchoredPosition;
        float elapsed = 0f;

        while (elapsed < shakeDuration) {
            float x = Random.Range(-1f, 1f) * shakeMagnitude;
            float y = Random.Range(-1f, 1f) * shakeMagnitude;
            rt.anchoredPosition = new Vector3(originalPos.x + x, originalPos.y + y, originalPos.z);
            elapsed += Time.deltaTime;
            yield return null;
        }
        rt.anchoredPosition = originalPos;
    }

    public void ShowResult(string message) {
        _isInteractable = false; 
        
        // Ẩn thanh kéo và nút mũi tên cho sạch màn hình lúc kết thúc
        if (ropeSlider != null) ropeSlider.gameObject.SetActive(false);
        if (statusText != null) statusText.gameObject.SetActive(false);

        if (resultPanel != null) resultPanel.SetActive(true);
        if (resultText != null) resultText.text = message;
        
        // Tắt cực nhanh sau 1.5 giây
        StartCoroutine(AutoCloseRoutine(1.5f)); 
    }

    private IEnumerator AutoCloseRoutine(float delay) {
        yield return new WaitForSeconds(delay);
        ForceClose();
    }

    // Tuyệt chiêu ép tắt UI và mở khóa nhân vật ngay lập tức
    public void ForceClose() {
        StopAllCoroutines(); 
        if (CurrentPuzzle != null) CurrentPuzzle.CancelMinigameLocal();
        ClosePuzzle();
    }

    void Update() {
        if (ropeSlider != null && panelMain.activeSelf)
            ropeSlider.value = Mathf.Lerp(ropeSlider.value, _targetRopeValue, Time.deltaTime * 8f);

        if (!_isInteractable || CurrentPuzzle == null) return;

        // Bấm phím F hoặc Enter để thoát UI an toàn
        if (Keyboard.current != null && (Keyboard.current.enterKey.wasPressedThisFrame || Keyboard.current.fKey.wasPressedThisFrame)) {
            ForceClose();
            return;
        }

        if (TryConsumeArrowInput(out TugArrow arrow)) ResolveInput(arrow);
    }

    private void ResolveInput(TugArrow pressedArrow) {
        if (pressedArrow != _arrowSequence[_currentInputIndex]) {
            CurrentPuzzle.SubmitPull(false); 
            return;
        }
        _currentInputIndex++;
        CurrentPuzzle.SubmitPull(true); 
        if (_currentInputIndex >= sequenceLength) BuildArrowSequence(); 
        UpdateSequenceStatus();
    }

    private void BuildArrowSequence() {
        _arrowSequence = new TugArrow[Mathf.Max(1, sequenceLength)];
        for (int i = 0; i < _arrowSequence.Length; i++) _arrowSequence[i] = (TugArrow)Random.Range(0, 4);
        _currentInputIndex = 0;
    }

    private bool TryConsumeArrowInput(out TugArrow arrow) {
        arrow = TugArrow.Up;
        if (Keyboard.current == null) return false;
        if (Keyboard.current.upArrowKey.wasPressedThisFrame) { arrow = TugArrow.Up; return true; }
        if (Keyboard.current.downArrowKey.wasPressedThisFrame) { arrow = TugArrow.Down; return true; }
        if (Keyboard.current.leftArrowKey.wasPressedThisFrame) { arrow = TugArrow.Left; return true; }
        if (Keyboard.current.rightArrowKey.wasPressedThisFrame) { arrow = TugArrow.Right; return true; }
        return false;
    }

    private void UpdateSequenceStatus() {
        if (statusText == null || _arrowSequence == null) return;
        string seqText = "";
        for (int i = 0; i < _arrowSequence.Length; i++) {
            int spriteIndex = _arrowSequence[i] switch { 
                TugArrow.Up => 0, 
                TugArrow.Down => 1, 
                TugArrow.Left => 2, 
                TugArrow.Right => 3, 
                _ => 0 
            };

            if (i < _currentInputIndex) 
                seqText += $"<color=green><sprite index={spriteIndex}></color> ";
            else if (i == _currentInputIndex) 
                seqText += $"<color=yellow><size=140%><sprite index={spriteIndex}></size></color> ";
            else 
                seqText += $"<color=white><sprite index={spriteIndex}></color> ";
        }
        
        string color = _currentScore < 0 ? "red" : "green";
        statusText.text = $"Team Power: <color={color}>{_currentScore:F1}</color> / <color=yellow>{_targetScore}</color>\n{seqText}";
    }

    public void OnClickExitButton() {
        ForceClose();
    }
}