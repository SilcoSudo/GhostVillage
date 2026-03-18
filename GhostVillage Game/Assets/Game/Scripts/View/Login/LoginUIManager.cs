using TMPro;
using Cysharp.Threading.Tasks;
using UnityEngine;
using UnityEngine.UI;
using VContainer;
using System.Collections.Generic;

namespace Game.UI.Login
{
    /// <summary>
    /// Combined UI Manager + Login UI
    /// Manages all panels in LoginScene and LoginUI specific logic
    /// </summary>
    public class LoginUIManager : MonoBehaviour
    {
        [Header("Login UI References")]
        [SerializeField] private TMP_InputField _emailInput;
        [SerializeField] private TMP_InputField _passwordInput;
        [SerializeField] private Button _loginButton;
        [SerializeField] private Button _googleLoginButton;
        [SerializeField] private TextMeshProUGUI _statusText;

        [Header("Panel Management")]
        [SerializeField] private GameObject _loginPanel;
        [SerializeField] private GameObject _birthdayVerifyPanel;

        private LoginController _controller;
        private Stack<GameObject> _panelStack = new Stack<GameObject>();
        private GameObject _currentPanel;

        // VContainer sẽ tìm hàm này để bơm Controller vào
        [Inject]
        public void Construct(LoginController controller)
        {
            _controller = controller;
        }

        private void Start()
        {
            // Ensure birthday panel is inactive at start
            if (_birthdayVerifyPanel != null)
                _birthdayVerifyPanel.SetActive(false);

            // Setup login UI buttons
            _loginButton.onClick.AddListener(OnLoginClicked);
            if (_googleLoginButton != null)
            {
                _googleLoginButton.onClick.AddListener(OnGoogleLoginClicked);
            }

            // Setup default values
            _emailInput.text = "";
            _passwordInput.text = "";
            _statusText.text = "Ready to Login";

            // Initialize panel system - show login panel
            ShowPanel(_loginPanel);
        }

        // ===== LOGIN UI LOGIC =====

        private void OnLoginClicked()
        {
            string u = _emailInput.text;
            string p = _passwordInput.text;

            if (string.IsNullOrEmpty(u) || string.IsNullOrEmpty(p))
            {
                SetStatus("Please enter email and password!");
                return;
            }

            _controller.HandleLogin(u, p, this);
        }

        private void OnGoogleLoginClicked()
        {
            // Disable buttons while processing OAuth
            SetInteractable(false);
            SetStatus("Logging in with Google...");
            // HandleGoogleLogin sẽ tự động show BirthdayVerifyPanel nếu profile chưa complete
            _controller.HandleGoogleLogin(this).Forget();
        }

        public void SetInteractable(bool isEnable)
        {
            _emailInput.interactable = isEnable;
            _passwordInput.interactable = isEnable;
            _loginButton.interactable = isEnable;
            if (_googleLoginButton != null)
                _googleLoginButton.interactable = isEnable;
        }

        public void SetStatus(string msg)
        {
            _statusText.text = msg;
        }

        // ===== PANEL MANAGEMENT =====

        /// <summary>
        /// Show a panel and hide others (push to stack)
        /// </summary>
        public void ShowPanel(GameObject panel)
        {
            if (panel == null)
            {
                Debug.LogWarning("[LoginUIManager] Trying to show null panel");
                return;
            }

            // Hide current panel
            if (_currentPanel != null)
            {
                _currentPanel.SetActive(false);
                _panelStack.Push(_currentPanel);
            }

            // Show new panel
            panel.SetActive(true);
            _currentPanel = panel;

            Debug.Log($"[LoginUIManager] Showing panel: {panel.name}");
        }

        /// <summary>
        /// Go back to previous panel (pop from stack)
        /// </summary>
        public void GoBack()
        {
            if (_panelStack.Count == 0)
            {
                Debug.LogWarning("[LoginUIManager] No previous panel to go back to");
                return;
            }

            // Hide current panel
            if (_currentPanel != null)
                _currentPanel.SetActive(false);

            // Show previous panel
            _currentPanel = _panelStack.Pop();
            _currentPanel.SetActive(true);

            Debug.Log($"[LoginUIManager] Back to panel: {_currentPanel.name}");
        }

        /// <summary>
        /// Show login panel
        /// </summary>
        public void ShowLoginPanel()
        {
            ShowPanel(_loginPanel);
        }

        /// <summary>
        /// Show birthday verification panel
        /// </summary>
        public void ShowBirthdayVerifyPanel()
        {
            ShowPanel(_birthdayVerifyPanel);
        }

        /// <summary>
        /// Get currently visible panel
        /// </summary>
        public GameObject GetCurrentPanel()
        {
            return _currentPanel;
        }

        /// <summary>
        /// Check if specific panel is currently shown
        /// </summary>
        public bool IsPanelActive(GameObject panel)
        {
            return _currentPanel == panel && panel.activeInHierarchy;
        }

        /// <summary>
        /// Get birthday verify panel
        /// </summary>
        public GameObject GetBirthdayVerifyPanel()
        {
            return _birthdayVerifyPanel;
        }
    }
}