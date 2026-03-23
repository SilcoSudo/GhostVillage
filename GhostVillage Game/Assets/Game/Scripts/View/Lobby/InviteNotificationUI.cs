using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Cysharp.Threading.Tasks;
using System;
using System.Threading;

namespace Game.Script.UI
{
    public class InviteNotificationUI : MonoBehaviour
    {
        [SerializeField] private TMP_Text _txtSender;
        [SerializeField] private Button _btnAccept;
        [SerializeField] private Button _btnDecline;

        private CancellationTokenSource _cts;

        private void Awake()
        {
            // Bấm Decline thì tắt cái rụp
            _btnDecline.onClick.AddListener(Hide);
        }

        public void Show(string senderName, string roomName, Action<string> onAcceptClicked)
        {
            gameObject.SetActive(true);

            // Hiện tên người mời
            if (_txtSender != null)
                _txtSender.text = $"<b>{senderName}</b> mời bạn vào phòng!";

            // Móc dây điện cho nút Accept
            _btnAccept.onClick.RemoveAllListeners();
            _btnAccept.onClick.AddListener(() =>
            {
                Hide(); // Ẩn UI đi
                onAcceptClicked?.Invoke(roomName); // Gọi hàm Xuyên Không
            });

            // ==========================================
            // ĐẾM NGƯỢC 10 GIÂY TỰ TẮT
            // ==========================================
            if (_cts != null) { _cts.Cancel(); _cts.Dispose(); }
            _cts = new CancellationTokenSource();
            AutoCloseTask(_cts.Token).Forget();
        }

        private async UniTaskVoid AutoCloseTask(CancellationToken token)
        {
            // Đợi 10 giây, nếu người dùng bấm nút làm token bị Cancel thì nó sẽ bỏ qua
            bool isCanceled = await UniTask.Delay(TimeSpan.FromSeconds(10), cancellationToken: token).SuppressCancellationThrow();

            if (!isCanceled && gameObject.activeInHierarchy)
            {
                Debug.Log("[InviteNotification] Hết 10s, tự động ẩn lời mời.");
                Hide();
            }
        }

        public void Hide()
        {
            if (_cts != null) { _cts.Cancel(); _cts.Dispose(); _cts = null; }
            gameObject.SetActive(false);
        }
    }
}