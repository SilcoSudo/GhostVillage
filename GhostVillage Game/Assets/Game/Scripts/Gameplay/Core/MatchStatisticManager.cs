using UnityEngine;
using Photon.Pun;
using System.Collections.Generic;
using System.Linq;
using Game.Domain.Match.DTO;
using Game.Scripts.Gameplay.Result;
// [THÊM CÁI NÀY ĐỂ PARSE DICTIONARY THÀNH JSON CHUẨN]
using Newtonsoft.Json;

namespace Game.Scripts.Gameplay.Core
{
    // KHAI BÁO BỘ TỪ ĐIỂN CHUẨN ĐỂ UNITY VÀ BACKEND KHỚP NHAU
    public static class MatchActions
    {
        public const string PLAY_MATCH = "PLAY_MATCH";
        public const string WIN_MATCH = "WIN_MATCH";
        public const string KILL_SMALL_MONSTER = "KILL_SMALL_MONSTER";
        public const string RESCUE_TEAMMATE = "RESCUE_TEAMMATE";
        public const string USE_SIREN = "USE_SIREN";
        public const string SCREAM = "SCREAM";
        public const string GET_KNOCKED = "GET_KNOCKED";
        public const string BOSS_TARGET = "BOSS_TARGET";
        public const string GATHER_ITEM = "GATHER_ITEM";
    }

    [RequireComponent(typeof(PhotonView))]
    public class MatchStatisticManager : MonoBehaviourPun
    {
        // Class bọc Data cho từng người chơi
        public class MatchPlayerStats
        {
            public int ActorNumber;
            public List<string> EarnedTitles = new List<string>();

            // BÍ THUẬT: Từ điển lưu Action. Thêm tỷ cái Quest cũng không sợ!
            public Dictionary<string, int> RawActions = new Dictionary<string, int>();

            public void AddAction(string actionType, int amount = 1)
            {
                if (!RawActions.ContainsKey(actionType)) RawActions[actionType] = 0;
                RawActions[actionType] += amount;
            }

            public int GetActionCount(string actionType)
            {
                return RawActions.ContainsKey(actionType) ? RawActions[actionType] : 0;
            }

            // Giữ lại hàm tính phần thưởng cũ của sếp
            public (int exp, int coin) CalculateRewards(MatchRoute route)
            {
                int exp = 100;
                int coin = 50;
                if (route == MatchRoute.Escape) { exp += 500; coin += 200; }

                // Thưởng thêm dựa trên số liệu thô
                exp += GetActionCount(MatchActions.KILL_SMALL_MONSTER) * 10;
                coin += GetActionCount(MatchActions.RESCUE_TEAMMATE) * 20;

                return (exp, coin);
            }
        }

        private Dictionary<int, MatchPlayerStats> _stats = new Dictionary<int, MatchPlayerStats>();
        private bool _isInitialized = false;

        public void InitializeTracker()
        {
            if (_isInitialized) return;

            _stats.Clear();
            foreach (var p in PhotonNetwork.PlayerList)
            {
                _stats[p.ActorNumber] = new MatchPlayerStats { ActorNumber = p.ActorNumber };
            }

            // ĐĂNG KÝ EVENT BẰNG CHUỖI ACTION CHUẨN
            GameplayEvents.OnPlayerRescued += (healer, target) => ReportAction(healer, MatchActions.RESCUE_TEAMMATE);
            GameplayEvents.OnPlayerKnocked += (actor) => ReportAction(actor, MatchActions.GET_KNOCKED);
            GameplayEvents.OnSmallMonsterKilled += (actor) => ReportAction(actor, MatchActions.KILL_SMALL_MONSTER);
            GameplayEvents.OnBossTargetedPlayer += (actor) => ReportAction(actor, MatchActions.BOSS_TARGET);
            GameplayEvents.OnPlayerScreamed += (actor) => ReportAction(actor, MatchActions.SCREAM);
            GameplayEvents.OnKeyItemGathered += (actor) => ReportAction(actor, MatchActions.GATHER_ITEM);

            _isInitialized = true;
            Debug.Log("📊 [Statistic] Bắt đầu ghi chép dữ liệu người chơi (Chuẩn SOLID)!");
        }

        private void OnDestroy()
        {
            _isInitialized = false;
        }

        private void LogStat(int actorNumber, string statName, int amount)
        {
            Debug.Log($"<color=yellow>➕ [MatchStats]</color> Player {actorNumber} thực hiện [{statName}] +{amount}.");
        }

        // ==========================================
        // GỬI LỆNH QUA MẠNG
        // ==========================================
        private void ReportAction(int actorNumber, string actionType, int amount = 1)
        {
            photonView.RPC(nameof(RPC_AddStat), RpcTarget.All, actorNumber, actionType, amount);
        }

        [PunRPC]
        private void RPC_AddStat(int actorNumber, string actionType, int amount)
        {
            if (!_stats.ContainsKey(actorNumber)) return;

            _stats[actorNumber].AddAction(actionType, amount);
            LogStat(actorNumber, actionType, amount);
        }

        // ==========================================
        // TÍNH TOÁN TITLE CUỐI TRẬN (LƯU HISTORY)
        // ==========================================
        public void CalculateFinalTitles()
        {
            if (_stats.Count == 0) return;

            int maxKills = _stats.Values.Max(x => x.GetActionCount(MatchActions.KILL_SMALL_MONSTER));
            int maxTargets = _stats.Values.Max(x => x.GetActionCount(MatchActions.BOSS_TARGET));
            int maxRescues = _stats.Values.Max(x => x.GetActionCount(MatchActions.RESCUE_TEAMMATE));
            int maxKnocks = _stats.Values.Max(x => x.GetActionCount(MatchActions.GET_KNOCKED));
            int maxScreams = _stats.Values.Max(x => x.GetActionCount(MatchActions.SCREAM));

            foreach (var stat in _stats.Values)
            {
                stat.EarnedTitles.Clear();
                if (stat.GetActionCount(MatchActions.KILL_SMALL_MONSTER) == maxKills && maxKills > 0) stat.EarnedTitles.Add(TitleNames.GRIM_REAPER);
                if (stat.GetActionCount(MatchActions.BOSS_TARGET) == maxTargets && maxTargets > 0) stat.EarnedTitles.Add(TitleNames.PRIME_TARGET);
                if (stat.GetActionCount(MatchActions.RESCUE_TEAMMATE) == maxRescues && maxRescues > 0) stat.EarnedTitles.Add(TitleNames.WALKING_HOSPITAL);
                if (stat.GetActionCount(MatchActions.GET_KNOCKED) == maxKnocks && maxKnocks > 0) stat.EarnedTitles.Add(TitleNames.PUNCHING_BAG);
                if (stat.GetActionCount(MatchActions.SCREAM) == maxScreams && maxScreams > 0) stat.EarnedTitles.Add(TitleNames.HUMAN_SIREN);
            }
        }

        // ==========================================
        // ĐÓNG GÓI CHO GAME MANAGER
        // ==========================================
        public PlayerResultRequestDTO GetFinalResultForPlayer(Photon.Realtime.Player player, string mongoUserId, bool isWin, string outcome, MatchRoute route)
        {
            if (!_stats.TryGetValue(player.ActorNumber, out var stat))
                stat = new MatchPlayerStats();

            var (exp, coin) = stat.CalculateRewards(route);

            return new PlayerResultRequestDTO
            {
                userId = mongoUserId,
                nickname = player.NickName,
                outcome = outcome,
                isWin = isWin,
                rewards = new MatchRewardDTO { exp = exp, coin = coin },
                titles = new List<string>(stat.EarnedTitles)
            };
        }

        // ==========================================
        // [FIX]: RÚT RAW DATA TRẢ VỀ DẠNG CHUỖI JSON
        // Tên hàm sửa lại đúng với GameManager gọi: GetRawStatsPayloadForQuestAPI
        // ==========================================
        public string GetRawStatsPayloadForQuestAPI(bool isWin)
        {
            int myActorNum = PhotonNetwork.LocalPlayer.ActorNumber;
            if (!_stats.TryGetValue(myActorNum, out var myStats))
                myStats = new MatchPlayerStats(); // Tránh null ref nếu văng sớm

            // Tự động chèn thêm hành động kết thúc game
            myStats.AddAction(MatchActions.PLAY_MATCH, 1);
            if (isWin) myStats.AddAction(MatchActions.WIN_MATCH, 1);

            // BỌC RAW STATS VÀO ĐÚNG FORMAT CỦA BACKEND YÊU CẦU: { "rawStats": { ... } }
            var payloadObj = new { rawStats = myStats.RawActions };

            // BẮT BUỘC PHẢI DÙNG Newtonsoft.Json (JsonUtility của Unity không hỗ trợ Dictionary)
            string jsonPayload = JsonConvert.SerializeObject(payloadObj);

            return jsonPayload;
        }
    }
}