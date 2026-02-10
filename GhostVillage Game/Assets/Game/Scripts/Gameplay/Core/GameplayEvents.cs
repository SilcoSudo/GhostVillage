using UnityEngine;
using System;
using Game.Scripts.Core.Game;
using System.Collections.Generic; // Để dùng Action

namespace Game.Scripts.Gameplay.Core
{
    public static class GameplayEvents
    {
        // --- STATE EVENTS ---
        // GameManager sẽ bắn cái này khi đổi State
        public static Action<GameState> OnGameStateChanged;

        // --- GAMEPLAY FLOW ---
        public static Action OnGateOpened;       // Cổng mở hẳn (Visual)
        public static Action OnPuzzleSolved;     // 1 Câu đố xong -> Quái nghe, Objective đếm
        public static Action OnAltarActivated;   // Trigger kích hoạt -> GameManager chuyển State

        // --- PLAYER STATUS EVENTS (MỚI) ---
        public static Action OnLocalPlayerRequestEscape;
        public static Action<int, PlayerMatchStatus> OnPlayerStatusChanged;
        public static Action<Dictionary<int, PlayerMatchStatus>> OnGameMatchEnded;
    }
}