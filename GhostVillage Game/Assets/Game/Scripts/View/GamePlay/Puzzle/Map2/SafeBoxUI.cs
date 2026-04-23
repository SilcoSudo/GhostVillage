using UnityEngine;
using TMPro;
using System.Collections.Generic;
using Game.Scripts.Core.Game;

public class SafeBoxUI : MonoBehaviour
{
    [Header("UI References")]
    public TextMeshProUGUI[] displayTexts = new TextMeshProUGUI[4];

    private SafeBoxInteractable _currentSafe;
    private List<int> _currentInput = new List<int>();
    private FPSController _localPlayerFPS;

    private void Awake()
    {
        gameObject.SetActive(false);
    }

    public void OpenUI(SafeBoxInteractable safe, GameObject player)
    {
        _currentSafe = safe;
        _currentInput.Clear();
        UpdateDisplay();

        gameObject.SetActive(true);

        _localPlayerFPS = player.GetComponent<FPSController>();
        if (_localPlayerFPS != null) _localPlayerFPS.SetLookEnabled(false);

        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;
    }

    public void CloseUI()
    {
        Debug.Log("<color=magenta>[SafeBoxUI] Gọi lệnh ĐÓNG UI</color>");
        gameObject.SetActive(false);

        if (_localPlayerFPS != null) _localPlayerFPS.SetLookEnabled(true);

        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }

    // ================== CÁC HÀM CHO BUTTON ==================

    public void OnNumberClicked(int num)
    {
        Debug.Log($"<color=yellow>[SafeBoxUI] Bạn vừa ấn nút số: {num}</color>");
        if (_currentInput.Count < 4)
        {
            _currentInput.Add(num);
            UpdateDisplay();
        }
        else
        {
            Debug.Log("<color=orange>[SafeBoxUI] Đã nhập full 4 số rồi, không nhập thêm được!</color>");
        }
    }

    public void OnBackspaceClicked()
    {
        Debug.Log("<color=yellow>[SafeBoxUI] Bạn vừa ấn nút XÓA (Backspace)</color>");
        if (_currentInput.Count > 0)
        {
            _currentInput.RemoveAt(_currentInput.Count - 1);
            UpdateDisplay();
        }
    }

    public void OnEnterClicked()
    {
        Debug.Log("<color=yellow>[SafeBoxUI] Bạn vừa ấn nút ENTER</color>");
        if (_currentInput.Count == 4 && _currentSafe != null)
        {
            List<int> submittedIndices = new List<int>();
            string logString = "";
            foreach (int n in _currentInput)
            {
                submittedIndices.Add(n - 1);
                logString += n.ToString() + " ";
            }

            Debug.Log($"<color=green>[SafeBoxUI] Đã gửi mã [{logString}] lên Két sắt!</color>");
            _currentSafe.SubmitCode(submittedIndices);
            CloseUI();
        }
        else
        {
            Debug.LogWarning("<color=red>[SafeBoxUI] Không gửi được! Vì chưa nhập đủ 4 số.</color>");
        }
    }

    public void OnCloseClicked()
    {
        Debug.Log("<color=yellow>[SafeBoxUI] Bạn vừa ấn nút ĐÓNG X</color>");
        CloseUI();
    }

    // ================== LOGIC HIỂN THỊ ==================
    private void UpdateDisplay()
    {
        for (int i = 0; i < 4; i++)
        {
            if (i < _currentInput.Count)
            {
                displayTexts[i].text = _currentInput[i].ToString();
            }
            else
            {
                displayTexts[i].text = "0";
            }
        }
    }
}