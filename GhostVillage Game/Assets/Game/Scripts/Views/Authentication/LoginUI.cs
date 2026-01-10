using TMPro;
using UnityEngine;
using UnityEngine.UI;
using VContainer;

namespace Game.UI.Login
{
    public class LoginUI : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private TMP_InputField _emailInput;
        [SerializeField] private TMP_InputField _passwordInput;
        [SerializeField] private Button _loginButton;
        [SerializeField] private TextMeshProUGUI _statusText;

        private LoginController _controller;

        // VContainer sẽ tìm hàm này để bơm Controller vào
        [Inject]
        public void Construct(LoginController controller)
        {
            _controller = controller;
        }

        private void Start()
        {
            // Gán sự kiện click cho nút Login
            _loginButton.onClick.AddListener(OnLoginClicked);

            // Setup mặc định cho test nhanh (đỡ phải gõ)
            _emailInput.text = "";
            _passwordInput.text = "";
            _statusText.text = "Ready to Login";
        }

        private void OnLoginClicked()
        {
            string u = _emailInput.text;
            string p = _passwordInput.text;

            if (string.IsNullOrEmpty(u) || string.IsNullOrEmpty(p))
            {
                SetStatus("Please enter email and password!");
                return;
            }

            // Gọi logic bên Controller
            _controller.HandleLogin(u, p, this);
        }

        // Hàm helper để Controller gọi ngược lại cập nhật UI
        public void SetInteractable(bool isEnable)
        {
            _emailInput.interactable = isEnable;
            _passwordInput.interactable = isEnable;
            _loginButton.interactable = isEnable;
        }

        public void SetStatus(string msg)
        {
            _statusText.text = msg;
        }
    }
}