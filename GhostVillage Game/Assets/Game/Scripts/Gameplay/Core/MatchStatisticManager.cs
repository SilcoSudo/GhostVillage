using UnityEngine;
using Photon.Pun;
using System.Collections.Generic;
using System.Linq;
using Game.Domain.Match.DTO;
using Game.Scripts.Gameplay.Result;
using Newtonsoft.Json;
using VContainer;

namespace Game.Scripts.Gameplay.Core
{
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
        // [SỬA LỖI INJECT]: Không dùng field injection, dùng Construct
        private MoonEventManager _moonManager;

        [Inject]
        public void Construct(MoonEventManager moonManager)
        {
            _moonManager = moonManager;
            if (_moonManager == null) Debug.LogError("[MatchStats] MoonEventManager is NULL after Inject!");
        }

        public class MatchPlayerStats
        {
            public int ActorNumber;
            public List<string> EarnedTitles = new List<string>();
            public Dictionary<string, int> RawActions = new Dictionary<string, int>();

            public void AddAction(string actionType, int amount = 1)
            {
                if (!RawActions.ContainsKey(actionType))
                {
                    RawActions[actionType] = 0;
                }
                RawActions[actionType] += amount;
            }

            public int GetActionCount(string actionType)
            {
                return RawActions.ContainsKey(actionType) ? RawActions[actionType] : 0;
            }

            // Tính điểm: Nhận MoonEventManager từ bên ngoài truyền vào
            public (int exp, int coin) CalculateRewards(MatchRoute route, MoonEventManager moonManager)
            {
                int exp = 100;
                int coin = 50;

                if (route == MatchRoute.Escape)
                {
                    exp += 500;
                    coin += 200;
                }

                exp += GetActionCount(MatchActions.KILL_SMALL_MONSTER) * 10;
                coin += GetActionCount(MatchActions.RESCUE_TEAMMATE) * 20;

                // An toàn: Nếu moonManager null thì x1
                float moonMultiplier = moonManager != null ? moonManager.GetExpRewardMultiplier() : 1f;

                // Ép kiểu (int) sau khi nhân
                exp = (int)(exp * moonMultiplier);
                coin = (int)(coin * moonMultiplier);

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

            GameplayEvents.OnPlayerRescued += (healer, target) => ReportAction(healer, MatchActions.RESCUE_TEAMMATE);
            GameplayEvents.OnPlayerKnocked += (actor) => ReportAction(actor, MatchActions.GET_KNOCKED);
            GameplayEvents.OnSmallMonsterKilled += (actor) => ReportAction(actor, MatchActions.KILL_SMALL_MONSTER);
            GameplayEvents.OnBossTargetedPlayer += (actor, duration) => ReportAction(actor, MatchActions.BOSS_TARGET, duration);
            GameplayEvents.OnPlayerScreamed += (actor) => ReportAction(actor, MatchActions.SCREAM);
            GameplayEvents.OnKeyItemGathered += (actor) => ReportAction(actor, MatchActions.GATHER_ITEM);
            GameplayEvents.OnPlayerUsedSiren += (actor) => ReportAction(actor, MatchActions.USE_SIREN);

            _isInitialized = true;
            Debug.Log("[Statistic] Bat dau ghi chep du lieu nguoi choi.");
        }

        private void OnDestroy()
        {
            _isInitialized = false;
            GameplayEvents.OnPlayerUsedSiren -= (actor) => ReportAction(actor, MatchActions.USE_SIREN);
        }

        private void LogStat(int actorNumber, string statName, int amount)
        {
            Debug.Log($"[MatchStats] Player {actorNumber} thuc hien [{statName}] +{amount}.");
        }

        private const byte EVENT_REPORT_STAT = 199;

        private void ReportAction(int actorNumber, string actionType, int amount = 1)
        {
            AddStatLocal(actorNumber, actionType, amount);

            object[] content = new object[] { actorNumber, actionType, amount };

            ExitGames.Client.Photon.SendOptions sendOptions = new ExitGames.Client.Photon.SendOptions { Reliability = true };
            Photon.Realtime.RaiseEventOptions raiseEventOptions = new Photon.Realtime.RaiseEventOptions { Receivers = Photon.Realtime.ReceiverGroup.Others };

            PhotonNetwork.RaiseEvent(EVENT_REPORT_STAT, content, raiseEventOptions, sendOptions);
        }

        private void OnEnable()
        {
            PhotonNetwork.NetworkingClient.EventReceived += OnEventReceived;
        }

        private void OnDisable()
        {
            PhotonNetwork.NetworkingClient.EventReceived -= OnEventReceived;
            _isInitialized = false;
        }

        private void OnEventReceived(ExitGames.Client.Photon.EventData photonEvent)
        {
            if (photonEvent.Code == EVENT_REPORT_STAT)
            {
                object[] data = (object[])photonEvent.CustomData;
                int actorNumber = (int)data[0];
                string actionType = (string)data[1];
                int amount = (int)data[2];

                AddStatLocal(actorNumber, actionType, amount);
            }
        }

        private void AddStatLocal(int actorNumber, string actionType, int amount)
        {
            if (!_stats.ContainsKey(actorNumber)) return;

            _stats[actorNumber].AddAction(actionType, amount);
            LogStat(actorNumber, actionType, amount);
        }

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

        public PlayerResultRequestDTO GetFinalResultForPlayer(Photon.Realtime.Player player, string mongoUserId, bool isWin, string outcome, MatchRoute route)
        {
            if (!_stats.TryGetValue(player.ActorNumber, out var stat))
            {
                stat = new MatchPlayerStats();
            }

            // Gọi hàm tính tiền và nhét _moonManager vào
            var (exp, coin) = stat.CalculateRewards(route, _moonManager);

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

        public string GetRawStatsPayloadForQuestAPI(bool isWin)
        {
            int myActorNum = PhotonNetwork.LocalPlayer.ActorNumber;

            if (!_stats.TryGetValue(myActorNum, out var myStats))
            {
                myStats = new MatchPlayerStats();
            }

            myStats.AddAction(MatchActions.PLAY_MATCH, 1);
            if (isWin)
            {
                myStats.AddAction(MatchActions.WIN_MATCH, 1);
            }

            var payloadObj = new { rawStats = myStats.RawActions };
            string jsonPayload = JsonConvert.SerializeObject(payloadObj);

            return jsonPayload;
        }
    }
}