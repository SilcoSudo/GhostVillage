namespace Game.Core.Network
{
    public class GameSession
    {
        public string Token { get; set; } = string.Empty;
        public string UID { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;

        public bool IsLoggedIn => !string.IsNullOrEmpty(Token);

        public void Clear()
        {
            Token = string.Empty;
            UID = string.Empty;
            DisplayName = string.Empty;
        }
    }
}