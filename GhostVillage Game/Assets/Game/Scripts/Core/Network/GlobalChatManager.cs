using UnityEngine;
using Photon.Chat;
using ExitGames.Client.Photon;
using System;
using VContainer;
using Game.Core.Network;
using System.Text;

namespace Game.Core.Network.Chat
{
    public class GlobalChatManager : MonoBehaviour, IChatClientListener
    {
        public ChatClient ChatClient { get; private set; }
        private GameSession _session;

        public event Action<string, int> OnFriendStatusUpdated;
        public event Action<string, string> OnRoomInviteReceived;

        private string[] _pendingFriendsToTrack;

        [Inject]
        public void Construct(GameSession session)
        {
            _session = session;
        }

        private void Awake()
        {
            DontDestroyOnLoad(this.gameObject);
            ChatClient = new ChatClient(this);
        }

        private void Update()
        {
            if (ChatClient != null) ChatClient.Service();
        }

        // --- CÔNG CỤ BÓC TÁCH TOKEN ĐỂ LẤY ÚNG USER ID ---
        private string ExtractUserIdFromToken(string token)
        {
            try
            {
                string[] parts = token.Split('.');
                if (parts.Length > 1)
                {
                    string payload = parts[1];
                    int mod4 = payload.Length % 4;
                    if (mod4 > 0) payload += new string('=', 4 - mod4);
                    payload = payload.Replace('-', '+').Replace('_', '/');
                    string decoded = Encoding.UTF8.GetString(Convert.FromBase64String(payload));

                    // Tìm chuỗi "userId":"... "
                    int idx = decoded.IndexOf("\"userId\":\"") + 10;
                    int endIdx = decoded.IndexOf("\"", idx);
                    return decoded.Substring(idx, endIdx - idx);
                }
            }
            catch (Exception e) { Debug.LogError("Lỗi parse Token: " + e.Message); }

            return token; // Fallback
        }

        public void Connect()
        {
            if (ChatClient.State == ChatState.ConnectedToFrontEnd) return;

            string appIdChat = Photon.Pun.PhotonNetwork.PhotonServerSettings.AppSettings.AppIdChat;
            if (string.IsNullOrEmpty(appIdChat)) return;

            // FIX CỰC MẠNH: BÓC TOKEN LẤY ĐÚNG ID NGẮN ĐỂ ĐỒNG BỘ VỚI RA-ĐA
            string realUserId = ExtractUserIdFromToken(_session.Token);

            ChatClient.AuthValues = new AuthenticationValues(realUserId);
            var chatSettings = new ChatAppSettings
            {
                AppIdChat = appIdChat,
                AppVersion = "1.0",
                FixedRegion = Photon.Pun.PhotonNetwork.PhotonServerSettings.AppSettings.FixedRegion
            };

            ChatClient.ConnectUsingSettings(chatSettings);
            Debug.Log($"[GlobalChatManager] Đang kết nối Chat với định danh GỐC: {realUserId}");
        }

        public void Disconnect()
        {
            if (ChatClient != null && ChatClient.State != ChatState.Disconnected)
                ChatClient.Disconnect();
        }

        public void TrackFriends(string[] friendUserIds)
        {
            if (friendUserIds == null || friendUserIds.Length == 0) return;

            if (ChatClient.State == ChatState.ConnectedToFrontEnd)
            {
                ChatClient.AddFriends(friendUserIds);
                Debug.Log($"[GlobalChatManager] Đã ném {friendUserIds.Length} người bạn vào Rada quét.");
            }
            else
            {
                _pendingFriendsToTrack = friendUserIds;
            }
        }

        public void SendRoomInvite(string targetFriendUserId, string currentRoomName)
        {
            if (ChatClient.State != ChatState.ConnectedToFrontEnd) return;

            InviteMessageDTO inviteData = new InviteMessageDTO
            {
                type = "ROOM_INVITE",
                senderName = _session.DisplayName,
                roomName = currentRoomName
            };

            string jsonPayload = JsonUtility.ToJson(inviteData);
            ChatClient.SendPrivateMessage(targetFriendUserId, jsonPayload);
            Debug.Log($"<color=yellow>[ChatManager]</color> Đã gửi thiệp mời tới UserID: {targetFriendUserId}");
        }

        public void OnPrivateMessage(string sender, object message, string channelName)
        {
            if (sender == ChatClient.AuthValues.UserId) return;

            string msgString = message as string;
            if (string.IsNullOrEmpty(msgString)) return;

            try
            {
                InviteMessageDTO inviteData = JsonUtility.FromJson<InviteMessageDTO>(msgString);
                if (inviteData != null && inviteData.type == "ROOM_INVITE")
                {
                    OnRoomInviteReceived?.Invoke(inviteData.senderName, inviteData.roomName);
                }
            }
            catch { }
        }

        public void OnConnected()
        {
            Debug.Log("<color=green>[GlobalChatManager] Kết nối Photon Chat THÀNH CÔNG!</color>");
            ChatClient.SetOnlineStatus(ChatUserStatus.Online);

            if (_pendingFriendsToTrack != null && _pendingFriendsToTrack.Length > 0)
            {
                ChatClient.AddFriends(_pendingFriendsToTrack);
                _pendingFriendsToTrack = null;
            }
        }

        public void OnDisconnected() { }

        public void OnStatusUpdate(string user, int status, bool gotMessage, object message)
        {
            Debug.Log($"[GlobalChatManager] Báo cáo: {user} -> Status: {status}");
            OnFriendStatusUpdated?.Invoke(user, status);
        }

        public void DebugReturn(DebugLevel level, string message) { }
        public void OnChatStateChange(ChatState state) { }
        public void OnGetMessages(string channelName, string[] senders, object[] messages) { }
        public void OnSubscribed(string[] channels, bool[] results) { }
        public void OnUnsubscribed(string[] channels) { }
        public void OnUserSubscribed(string channel, string user) { }
        public void OnUserUnsubscribed(string channel, string user) { }
    }
}