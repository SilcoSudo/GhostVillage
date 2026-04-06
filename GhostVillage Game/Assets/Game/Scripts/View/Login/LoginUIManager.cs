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
        #region References
        [Header("Login UI References")]
        [SerializeField] private TMP_InputField _emailInput;
        [SerializeField] private TMP_InputField _passwordInput;
        [SerializeField] private Button _loginButton;
        [SerializeField] private Button _googleLoginButton;
        [SerializeField] private Button _quitButton;

        [Header("Password Toggle Feature")]
        [SerializeField] private Button _togglePasswordButton; // Nút bấm con mắt
        [SerializeField] private Image _togglePasswordIcon;    // Hình ảnh hiển thị con mắt
        [SerializeField] private Sprite _eyeOpenSprite;        // Hình mắt mở
        [SerializeField] private Sprite _eyeClosedSprite;      // Hình mắt nhắm

        [Header("Panel Management")]
        [SerializeField] private GameObject _loginPanel;
        [SerializeField] private GameObject _birthdayVerifyPanel;
        #endregion

        #region Private Fields
        private LoginController _controller;
        private Stack<GameObject> _panelStack = new Stack<GameObject>();
        private GameObject _currentPanel;
        private bool _isPasswordVisible = false; // Biến theo dõi trạng thái hiện tại
        #endregion

        /// <summary>
        /// Constructor injected by VContainer to provide the LoginController dependency.
        /// </summary>
        [Inject]
        public void Construct(LoginController controller)
        {
            _controller = controller;
        }

        #region Unity Lifecycle
        private void Start()
        {
            // Ensure the birthday panel is hidden by default when the scene loads
            if (_birthdayVerifyPanel != null)
                _birthdayVerifyPanel.SetActive(false);

            SetupButtons();

            // Clear inputs for security
            _emailInput.text = "";
            _passwordInput.text = "";

            // Init trạng thái mật khẩu là bị ẩn (dấu sao)
            _isPasswordVisible = false;
            UpdatePasswordVisibilityState();

            // Initialize panel system - default to showing the login panel
            ShowPanel(_loginPanel);
        }
        #endregion

        #region Initialization
        /// <summary>
        /// Binds listeners to all UI buttons.
        /// </summary>
        private void SetupButtons()
        {
            if (_loginButton != null)
                _loginButton.onClick.AddListener(OnLoginClicked);

            if (_googleLoginButton != null)
                _googleLoginButton.onClick.AddListener(OnGoogleLoginClicked);

            if (_quitButton != null)
            {
                _quitButton.onClick.AddListener(() =>
                {
                    Debug.Log("[LoginUIManager] Quit Game Requested");
                    Application.Quit();
                });
            }

            // Gắn sự kiện cho nút Con Mắt
            if (_togglePasswordButton != null)
            {
                _togglePasswordButton.onClick.AddListener(TogglePasswordVisibility);
            }
        }
        #endregion

        #region Login Logic
        /// <summary>
        /// Xử lý logic Ẩn/Hiện mật khẩu
        /// </summary>
        private void TogglePasswordVisibility()
        {
            _isPasswordVisible = !_isPasswordVisible; // Lật ngược trạng thái
            UpdatePasswordVisibilityState();
        }

        private void UpdatePasswordVisibilityState()
        {
            if (_passwordInput == null || _togglePasswordIcon == null) return;

            if (_isPasswordVisible)
            {
                // Hiện chữ bình thường, dùng hình Mắt Mở
                _passwordInput.contentType = TMP_InputField.ContentType.Standard;
                if (_eyeOpenSprite != null) _togglePasswordIcon.sprite = _eyeOpenSprite;
            }
            else
            {
                // Ẩn thành dấu sao, dùng hình Mắt Nhắm
                _passwordInput.contentType = TMP_InputField.ContentType.Password;
                if (_eyeClosedSprite != null) _togglePasswordIcon.sprite = _eyeClosedSprite;
            }

            // [QUAN TRỌNG] Ép thằng TextMeshPro cập nhật lại giao diện ngay lập tức
            _passwordInput.ForceLabelUpdate();
        }

        /// <summary>
        /// Triggered when the user clicks the standard Email/Password Login button.
        /// </summary>
        private void OnLoginClicked()
        {
            string email = _emailInput.text;
            string password = _passwordInput.text;

            // Pass control to the logic controller
            _controller.HandleLogin(email, password, this);
        }

        /// <summary>
        /// Triggered when the user clicks the Google OAuth Login button.
        /// </summary>
        private void OnGoogleLoginClicked()
        {
            // Disable interactions to prevent spam clicking while OAuth is processing
            SetInteractable(false);

            // HandleGoogleLogin will automatically show the BirthdayVerifyPanel if the profile is incomplete
            _controller.HandleGoogleLogin(this).Forget();
        }

        /// <summary>
        /// Toggles the interactability of all input fields and buttons.
        /// Useful during loading or authentication states.
        /// </summary>
        public void SetInteractable(bool isEnable)
        {
            if (_emailInput != null) _emailInput.interactable = isEnable;
            if (_passwordInput != null) _passwordInput.interactable = isEnable;
            if (_loginButton != null) _loginButton.interactable = isEnable;
            if (_googleLoginButton != null) _googleLoginButton.interactable = isEnable;
            if (_togglePasswordButton != null) _togglePasswordButton.interactable = isEnable;
            //if (_quitButton != null) _quitButton.interactable = isEnable;
        }
        #endregion

        #region Panel Management
        /// <summary>
        /// Displays the target panel, hides the current one, and pushes it to the navigation stack.
        /// </summary>
        public void ShowPanel(GameObject panel)
        {
            if (panel == null)
            {
                Debug.LogWarning("[LoginUIManager] Attempted to show a null panel.");
                return;
            }

            // Hide the current active panel and store it in the history stack
            if (_currentPanel != null)
            {
                _currentPanel.SetActive(false);
                _panelStack.Push(_currentPanel);
            }

            // Activate the requested panel
            panel.SetActive(true);
            _currentPanel = panel;

            Debug.Log($"[LoginUIManager] Displaying panel: {panel.name}");
        }

        /// <summary>
        /// Hides the current panel and returns to the previously active panel in the stack.
        /// </summary>
        public void GoBack()
        {
            if (_panelStack.Count == 0)
            {
                Debug.LogWarning("[LoginUIManager] Navigation stack is empty. Cannot go back.");
                return;
            }

            // Hide the current active panel
            if (_currentPanel != null)
                _currentPanel.SetActive(false);

            // Pop the last panel from the stack and activate it
            _currentPanel = _panelStack.Pop();
            _currentPanel.SetActive(true);

            Debug.Log($"[LoginUIManager] Returned to panel: {_currentPanel.name}");
        }

        /// <summary>
        /// Quick access method to display the Login Panel.
        /// </summary>
        public void ShowLoginPanel() => ShowPanel(_loginPanel);

        /// <summary>
        /// Quick access method to display the Birthday Verification Panel.
        /// </summary>
        public void ShowBirthdayVerifyPanel() => ShowPanel(_birthdayVerifyPanel);

        /// <summary>
        /// Returns the currently active panel GameObject.
        /// </summary>
        public GameObject GetCurrentPanel() => _currentPanel;

        /// <summary>
        /// Checks if a specific panel is currently active in the hierarchy.
        /// </summary>
        public bool IsPanelActive(GameObject panel)
        {
            return _currentPanel == panel && panel.activeInHierarchy;
        }

        /// <summary>
        /// Retrieves the reference to the Birthday Verification Panel.
        /// </summary>
        public GameObject GetBirthdayVerifyPanel() => _birthdayVerifyPanel;
        #endregion
    }
}