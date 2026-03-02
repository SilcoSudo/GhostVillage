using UnityEngine;
using Photon.Pun;
using System.Collections.Generic;
using System.Linq;
using Game.Domain.Match.DTO;
using Game.Scripts.Gameplay.Result;

namespace Game.Scripts.Gameplay.Core
{
    // [FIX 1] Bắt buộc phải có PhotonView để gọi RPC
    [RequireComponent(typeof(PhotonView))]
    public class MatchStatisticManager : MonoBehaviourPun // Thêm Pun để dùng photonView.RPC
    {
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

            // Đăng ký Event Local
            GameplayEvents.OnPlayerRescued += HandlePlayerRescued;
            GameplayEvents.OnPlayerKnocked += RecordKnockdown;
            GameplayEvents.OnSmallMonsterKilled += RecordSmallMonsterKill;
            GameplayEvents.OnBossTargetedPlayer += RecordBossTarget;
            GameplayEvents.OnPlayerScreamed += RecordScream;
            GameplayEvents.OnKeyItemGathered += RecordKeyItemGathered;

            _isInitialized = true;
            Debug.Log("📊 [Statistic] Bắt đầu ghi chép dữ liệu người chơi!");
        }

        private void OnDestroy()
        {
            if (_isInitialized)
            {
                GameplayEvents.OnPlayerRescued -= HandlePlayerRescued;
                GameplayEvents.OnPlayerKnocked -= RecordKnockdown;
                GameplayEvents.OnSmallMonsterKilled -= RecordSmallMonsterKill;
                GameplayEvents.OnBossTargetedPlayer -= RecordBossTarget;
                GameplayEvents.OnPlayerScreamed -= RecordScream;
                GameplayEvents.OnKeyItemGathered -= RecordKeyItemGathered;
                _isInitialized = false;
            }
        }

        private void LogStat(int actorNumber, string statName)
        {
            if (_stats.TryGetValue(actorNumber, out var stat))
            {
                Debug.Log($"<color=yellow>➕ [MatchStats]</color> Player {actorNumber} vừa được cộng điểm {statName}.");
            }
        }

        // ==========================================
        // [FIX 2] GỬI LỆNH QUA MẠNG KHI CÓ EVENT LOCAL
        // Khi Event ở máy nào nổ, máy đó sẽ kêu Master ghi sổ.
        // ==========================================

        private void HandlePlayerRescued(int healer, int target)
        {
            photonView.RPC(nameof(RPC_AddStat), RpcTarget.All, healer, "Rescue");
        }
        private void RecordKnockdown(int actorNumber)
        {
            photonView.RPC(nameof(RPC_AddStat), RpcTarget.All, actorNumber, "Knock");
        }
        private void RecordSmallMonsterKill(int actorNumber)
        {
            photonView.RPC(nameof(RPC_AddStat), RpcTarget.All, actorNumber, "Kill");
        }
        private void RecordBossTarget(int actorNumber)
        {
            photonView.RPC(nameof(RPC_AddStat), RpcTarget.All, actorNumber, "Target");
        }
        private void RecordScream(int actorNumber)
        {
            photonView.RPC(nameof(RPC_AddStat), RpcTarget.All, actorNumber, "Scream");
        }
        private void RecordKeyItemGathered(int actorNumber)
        {
            photonView.RPC(nameof(RPC_AddStat), RpcTarget.All, actorNumber, "Item");
        }

        // ==========================================
        // [FIX 3] RPC NHẬN VÀ CỘNG ĐIỂM TRÊN TẤT CẢ CÁC MÁY
        // ==========================================
        [PunRPC]
        private void RPC_AddStat(int actorNumber, string statType)
        {
            if (!_stats.ContainsKey(actorNumber)) return;

            switch (statType)
            {
                case "Rescue": _stats[actorNumber].TeammatesRescued++; LogStat(actorNumber, "Cứu người"); break;
                case "Knock": _stats[actorNumber].TimesKnocked++; LogStat(actorNumber, "Bị Knock"); break;
                case "Kill": _stats[actorNumber].SmallMonstersKilled++; LogStat(actorNumber, "Giết quái"); break;
                case "Target": _stats[actorNumber].BossTargetCount++; LogStat(actorNumber, "Bị Boss dí"); break;
                case "Scream": _stats[actorNumber].ScreamCount++; LogStat(actorNumber, "Hét"); break;
                case "Item": _stats[actorNumber].KeyItemsGathered++; LogStat(actorNumber, "Nhặt đồ"); break;
            }
        }


        // --- HÀM TÍNH TOÁN CUỐI TRẬN ---
        public void CalculateFinalTitles()
        {
            if (_stats.Count == 0) return;

            int maxKills = _stats.Values.Max(x => x.SmallMonstersKilled);
            int maxTargets = _stats.Values.Max(x => x.BossTargetCount);
            int maxRescues = _stats.Values.Max(x => x.TeammatesRescued);
            int maxKnocks = _stats.Values.Max(x => x.TimesKnocked);
            int maxScreams = _stats.Values.Max(x => x.ScreamCount);

            foreach (var stat in _stats.Values)
            {
                stat.EarnedTitles.Clear();
                if (stat.SmallMonstersKilled == maxKills && maxKills > 0) stat.EarnedTitles.Add(TitleNames.GRIM_REAPER);
                if (stat.BossTargetCount == maxTargets && maxTargets > 0) stat.EarnedTitles.Add(TitleNames.PRIME_TARGET);
                if (stat.TeammatesRescued == maxRescues && maxRescues > 0) stat.EarnedTitles.Add(TitleNames.WALKING_HOSPITAL);
                if (stat.TimesKnocked == maxKnocks && maxKnocks > 0) stat.EarnedTitles.Add(TitleNames.PUNCHING_BAG);
                if (stat.ScreamCount == maxScreams && maxScreams > 0) stat.EarnedTitles.Add(TitleNames.HUMAN_SIREN);
            }
        }

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
    }
}