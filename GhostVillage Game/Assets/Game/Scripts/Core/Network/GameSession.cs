namespace Game.Core.Network
{
    public class GameSession
    {
        private const string TOKEN_KEY = "AccessToken";
        public string Token { get; set; } = string.Empty;
        public string UID { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;

        private bool _tokenLoaded = false; //  Track nếu đã load token từ PlayerPrefs

        public bool IsLoggedIn => !string.IsNullOrEmpty(Token);

        public void Clear()
        {
            Token = string.Empty;
            UID = string.Empty;
            DisplayName = string.Empty;
            _tokenLoaded = false; // Reset flag when clearing
            UnityEngine.PlayerPrefs.DeleteKey(TOKEN_KEY);
            UnityEngine.PlayerPrefs.Save();
        }

        //  Lưu token vào PlayerPrefs
        public void SaveToken(string token)
        {
            Token = token;
            _tokenLoaded = true; // Đánh dấu đã load/save
            UnityEngine.PlayerPrefs.SetString(TOKEN_KEY, token);
            UnityEngine.PlayerPrefs.Save();
            UnityEngine.Debug.Log($"<color=green>[GameSession] Token saved: {token.Substring(0, 10)}...</color>");
        }

        //  Tải token từ PlayerPrefs LẦN ĐẦU TIÊN (auto-check, chỉ load 1 lần)
        public void EnsureTokenLoaded()
        {
            // Nếu đã load rồi hoặc token đã có, skip
            if (_tokenLoaded || !string.IsNullOrEmpty(Token)) return;

            Token = UnityEngine.PlayerPrefs.GetString(TOKEN_KEY, string.Empty);
            _tokenLoaded = true;

            if (!string.IsNullOrEmpty(Token))
            {
                UnityEngine.Debug.Log($"<color=cyan>[GameSession] Token loaded from storage: {Token.Substring(0, 10)}...</color>");
            }
            else
            {
                UnityEngine.Debug.LogWarning("[GameSession] No token found in storage!");
            }
        }

        //  Legacy support
        public void LoadTokenFromStorage()
        {
            EnsureTokenLoaded();
        }
    }
}