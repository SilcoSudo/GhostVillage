using UnityEngine;
using Photon.Pun;
using System.Collections.Generic;
using System.Linq;
using Game.Domain.Match.DTO;
using Game.Scripts.Gameplay.Result;
// Bắt buộc dùng thư viện này để Parse Dictionary thành chuỗi JSON hợp lệ truyền lên Backend.
using Newtonsoft.Json;

namespace Game.Scripts.Gameplay.Core
{
    // Bộ từ điển hằng số lưu tên các hành động, dùng để đồng bộ chính xác giữa Unity Client và Backend.
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

    // Lớp quản lý và ghi chép mọi thông số thống kê của các người chơi trong phòng đấu.
    [RequireComponent(typeof(PhotonView))]
    public class MatchStatisticManager : MonoBehaviourPun
    {
        // Lớp con bọc dữ liệu thống kê của từng cá nhân người chơi.
        public class MatchPlayerStats
        {
            // ID của người chơi trên hệ thống Photon.
            public int ActorNumber;

            // Danh sách các danh hiệu đạt được vào cuối ván đấu.
            public List<string> EarnedTitles = new List<string>();

            // Từ điển lưu trữ linh hoạt mọi hành động (Key: Tên hành động, Value: Số lần thực hiện).
            public Dictionary<string, int> RawActions = new Dictionary<string, int>();

            // Phương thức cộng dồn số lượng cho một hành động cụ thể.
            public void AddAction(string actionType, int amount = 1)
            {
                if (!RawActions.ContainsKey(actionType))
                {
                    RawActions[actionType] = 0;
                }
                RawActions[actionType] += amount;
            }

            // Lấy số lượng của một hành động đã thực hiện, trả về 0 nếu chưa từng làm.
            public int GetActionCount(string actionType)
            {
                return RawActions.ContainsKey(actionType) ? RawActions[actionType] : 0;
            }

            // Tính toán phần thưởng kinh nghiệm và tiền xu dựa trên kết quả game và thống kê hành động.
            public (int exp, int coin) CalculateRewards(MatchRoute route)
            {
                int exp = 100;
                int coin = 50;

                if (route == MatchRoute.Escape)
                {
                    exp += 500;
                    coin += 200;
                }

                // Thưởng cộng thêm dựa trên các số liệu thô đã thực hiện trong game.
                exp += GetActionCount(MatchActions.KILL_SMALL_MONSTER) * 10;
                coin += GetActionCount(MatchActions.RESCUE_TEAMMATE) * 20;

                return (exp, coin);
            }
        }

        // Từ điển tổng quản lý dữ liệu thống kê của tất cả người chơi trong phòng.
        private Dictionary<int, MatchPlayerStats> _stats = new Dictionary<int, MatchPlayerStats>();
        private bool _isInitialized = false;

        // Khởi tạo hệ thống theo dõi, tạo mới dữ liệu và đăng ký lắng nghe các sự kiện gameplay.
        public void InitializeTracker()
        {
            if (_isInitialized) return;

            _stats.Clear();

            // Tạo hồ sơ thống kê cho tất cả người chơi đang có trong phòng.
            foreach (var p in PhotonNetwork.PlayerList)
            {
                _stats[p.ActorNumber] = new MatchPlayerStats { ActorNumber = p.ActorNumber };
            }

            // Đăng ký kết nối các sự kiện tương ứng với từng tên hành động chuẩn xác.
            GameplayEvents.OnPlayerRescued += (healer, target) => ReportAction(healer, MatchActions.RESCUE_TEAMMATE);
            GameplayEvents.OnPlayerKnocked += (actor) => ReportAction(actor, MatchActions.GET_KNOCKED);
            GameplayEvents.OnSmallMonsterKilled += (actor) => ReportAction(actor, MatchActions.KILL_SMALL_MONSTER);
            GameplayEvents.OnBossTargetedPlayer += (actor) => ReportAction(actor, MatchActions.BOSS_TARGET);
            GameplayEvents.OnPlayerScreamed += (actor) => ReportAction(actor, MatchActions.SCREAM);
            GameplayEvents.OnKeyItemGathered += (actor) => ReportAction(actor, MatchActions.GATHER_ITEM);
            GameplayEvents.OnPlayerUsedSiren += (actor) => ReportAction(actor, MatchActions.USE_SIREN);

            _isInitialized = true;
            Debug.Log("[Statistic] Bat dau ghi chep du lieu nguoi choi.");
        }

        // Hủy đăng ký lắng nghe sự kiện khi đối tượng bị phá hủy để tránh rò rỉ bộ nhớ.
        private void OnDestroy()
        {
            _isInitialized = false;
            GameplayEvents.OnPlayerUsedSiren -= (actor) => ReportAction(actor, MatchActions.USE_SIREN);
        }

        // In log cục bộ khi có người chơi thực hiện hành động.
        private void LogStat(int actorNumber, string statName, int amount)
        {
            Debug.Log($"[MatchStats] Player {actorNumber} thuc hien [{statName}] +{amount}.");
        }

        // ==========================================
        // GỬI LỆNH QUA MẠNG (FIX LỖI BẰNG RAISE EVENT)
        // ==========================================

        // Khai báo một mã Event Code tùy ý (dưới 200) để dành riêng cho việc Report
        private const byte EVENT_REPORT_STAT = 199;

        private void ReportAction(int actorNumber, string actionType, int amount = 1)
        {
            // Nếu gọi trực tiếp hàm này, ghi số tại máy mình trước
            AddStatLocal(actorNumber, actionType, amount);

            // Sau đó, Gửi tín hiệu báo cho tất cả máy khác (ngoại trừ máy mình) biết
            object[] content = new object[] { actorNumber, actionType, amount };

            // [SỬA LẠI ĐÚNG CÚ PHÁP CỦA PHOTON]
            ExitGames.Client.Photon.SendOptions sendOptions = new ExitGames.Client.Photon.SendOptions { Reliability = true };
            Photon.Realtime.RaiseEventOptions raiseEventOptions = new Photon.Realtime.RaiseEventOptions { Receivers = Photon.Realtime.ReceiverGroup.Others };

            PhotonNetwork.RaiseEvent(EVENT_REPORT_STAT, content, raiseEventOptions, sendOptions);
        }

        // Lắng nghe Event từ mạng đổ về
        private void OnEnable()
        {
            PhotonNetwork.NetworkingClient.EventReceived += OnEventReceived;
        }

        private void OnDisable()
        {
            PhotonNetwork.NetworkingClient.EventReceived -= OnEventReceived;
            _isInitialized = false;
            // ... (Đoạn dọn rác event cũ sếp cứ giữ nguyên) ...
        }

        private void OnEventReceived(ExitGames.Client.Photon.EventData photonEvent)
        {
            if (photonEvent.Code == EVENT_REPORT_STAT)
            {
                // Nhận được tín hiệu từ máy khác, bóc tách dữ liệu ra
                object[] data = (object[])photonEvent.CustomData;
                int actorNumber = (int)data[0];
                string actionType = (string)data[1];
                int amount = (int)data[2];

                // Ghi số vào sổ của máy mình
                AddStatLocal(actorNumber, actionType, amount);
            }
        }

        // Hàm gốc để thực thi việc cộng điểm
        private void AddStatLocal(int actorNumber, string actionType, int amount)
        {
            if (!_stats.ContainsKey(actorNumber)) return;

            _stats[actorNumber].AddAction(actionType, amount);
            LogStat(actorNumber, actionType, amount);
        }

        // ==========================================
        // TÍNH TOÁN TITLE CUỐI TRẬN (LƯU HISTORY)
        // ==========================================

        // Đánh giá và trao danh hiệu (Title) cho người chơi vào cuối trận dựa trên số liệu cao nhất.
        public void CalculateFinalTitles()
        {
            if (_stats.Count == 0) return;

            // Tìm ra các mốc kỷ lục cao nhất trong phòng đấu.
            int maxKills = _stats.Values.Max(x => x.GetActionCount(MatchActions.KILL_SMALL_MONSTER));
            int maxTargets = _stats.Values.Max(x => x.GetActionCount(MatchActions.BOSS_TARGET));
            int maxRescues = _stats.Values.Max(x => x.GetActionCount(MatchActions.RESCUE_TEAMMATE));
            int maxKnocks = _stats.Values.Max(x => x.GetActionCount(MatchActions.GET_KNOCKED));
            int maxScreams = _stats.Values.Max(x => x.GetActionCount(MatchActions.SCREAM));

            // Xét duyệt trao danh hiệu cho từng người chơi đạt điều kiện.
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

        // Đóng gói toàn bộ kết quả của một người chơi thành DTO để chuẩn bị gửi lên Backend lưu History.
        public PlayerResultRequestDTO GetFinalResultForPlayer(Photon.Realtime.Player player, string mongoUserId, bool isWin, string outcome, MatchRoute route)
        {
            if (!_stats.TryGetValue(player.ActorNumber, out var stat))
            {
                stat = new MatchPlayerStats();
            }

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

        // Rút trích số liệu thô (Raw Data) thành chuỗi JSON chuẩn để gọi API tính toán tiến độ nhiệm vụ (Quest).
        public string GetRawStatsPayloadForQuestAPI(bool isWin)
        {
            int myActorNum = PhotonNetwork.LocalPlayer.ActorNumber;

            if (!_stats.TryGetValue(myActorNum, out var myStats))
            {
                myStats = new MatchPlayerStats();
            }

            // Tự động chèn thêm hành động tổng kết trận đấu trước khi gửi đi.
            myStats.AddAction(MatchActions.PLAY_MATCH, 1);
            if (isWin)
            {
                myStats.AddAction(MatchActions.WIN_MATCH, 1);
            }

            // Bọc dữ liệu thô vào đối tượng trung gian để định dạng chuẩn với Backend yêu cầu.
            var payloadObj = new { rawStats = myStats.RawActions };

            // Bắt buộc sử dụng Newtonsoft.Json vì JsonUtility của Unity không hỗ trợ Serialize kiểu Dictionary.
            string jsonPayload = JsonConvert.SerializeObject(payloadObj);

            return jsonPayload;
        }
    }
}