namespace Game.Scripts.Core.Game
{
    public enum GameState
    {
        // 1. Initializing: Load Map, Inject Dependencies, Setup Data (Frame 0-1)
        Initializing,

        // 2. WaitingForPlayers: Đợi tất cả người chơi load scene xong + sync xong thời gian
        WaitingForPlayers,

        // 3. Playing: Đi rông, giải đố, trốn quái.
        Playing,

        // 4. EscapePhase: Còi báo động hú, nhạc dồn dập, cổng mở, quái spawn nhiều hơn.
        EscapePhase,

        // 5. Ending: Tất cả đã thoát hoặc chết hết. Show bảng điểm. Freeze game.
        Ending
    }
}