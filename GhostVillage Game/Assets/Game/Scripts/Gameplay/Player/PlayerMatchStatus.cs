public enum PlayerMatchStatus
{
    Playing,        // Đang khỏe mạnh
    Knocked,        // Bị gục lần 1 (Cần cứu)
    Eliminated,     // Bị gục lần 2 hoặc bị giết hẳn (Spectator)
    Escaped,        // Đã chạy thoát thành công
    Disconnected    // Rớt mạng
}