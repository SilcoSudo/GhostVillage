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

        // --- TRACKING EVENTS (Cho MatchStatisticManager lắng nghe) ---

        // (actorNumber của người giải đố)
        public static Action<int> OnPlayerSolvedPuzzle;

        // (actorNumber của người nhặt)
        public static Action<int> OnPlayerLootedItem;

        // (healerActorNumber, knockedActorNumber)
        public static Action<int, int> OnPlayerRescued;

        // (actorNumber của người bị nock)
        public static Action<int> OnPlayerKnocked;

        // (killerActorNumber)
        public static Action<int> OnSmallMonsterKilled;

        // (actorNumber của người bị boss dí)
        public static Action<int> OnBossTargetedPlayer;

        // (actorNumber của người hét)
        public static Action<int> OnPlayerScreamed;

        // (actorNumber của người gom key item)
        public static Action<int> OnKeyItemGathered;
    }
}