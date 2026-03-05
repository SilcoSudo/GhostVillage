using Cysharp.Threading.Tasks;
using UnityEngine;
using VContainer;
using R3;
using Game.Domain.Friend.Services;
using Game.Domain.Friend.DTOs;
using System.Collections.Generic;

namespace Game.Domain.Friend.Controllers
{
    public class FriendController
    {
        private readonly FriendService _friendService;

        // --- STATE QUẢN LÝ UI (Reactive) ---
        public ReactiveProperty<bool> IsLoading { get; } = new(false);

        public ReactiveProperty<List<FriendProfileDTO>> FriendList { get; } = new(new List<FriendProfileDTO>());
        public ReactiveProperty<List<FriendProfileDTO>> PendingRequests { get; } = new(new List<FriendProfileDTO>());
        public ReactiveProperty<List<FriendProfileDTO>> SentRequests { get; } = new(new List<FriendProfileDTO>());

        // Trạng thái tìm kiếm
        public ReactiveProperty<PlayerSearchDTO> CurrentSearchResult { get; } = new(null);
        public ReactiveProperty<string> SearchError { get; } = new(string.Empty);

        [Inject]
        public FriendController(FriendService friendService)
        {
            _friendService = friendService;
        }

        // Khởi tạo: Lấy danh sách bạn bè và lời mời khi mở Modal
        public async UniTask InitializeDataAsync()
        {
            IsLoading.Value = true;
            await UniTask.WhenAll(
                FetchFriendListAsync(),
                FetchPendingRequestsAsync(),
                FetchSentRequestsAsync()
            );
            IsLoading.Value = false;
        }

        public async UniTask FetchFriendListAsync()
        {
            var list = await _friendService.GetFriendListAsync();
            FriendList.Value = list;
        }

        public async UniTask FetchPendingRequestsAsync()
        {
            var list = await _friendService.GetPendingRequestsAsync();
            PendingRequests.Value = list;

            // Xử lý chấm đỏ Notification ở đây: 
            // Nếu list.Count > 0 thì có thư chưa đọc!
        }

        public async UniTask FetchSentRequestsAsync()
        {
            var list = await _friendService.GetSentRequestsAsync();
            SentRequests.Value = list;
        }

        // TÌM KIẾM
        public async UniTask SearchByUID(string uid)
        {
            if (string.IsNullOrEmpty(uid) || uid.Length != 8)
            {
                SearchError.Value = "UID phải có đúng 8 chữ số!";
                CurrentSearchResult.Value = null;
                return;
            }

            IsLoading.Value = true;
            SearchError.Value = string.Empty;

            var result = await _friendService.SearchPlayerAsync(uid);

            if (result != null && !string.IsNullOrEmpty(result.userId))
            {
                CurrentSearchResult.Value = result;
            }
            else
            {
                SearchError.Value = "Không tìm thấy người chơi!";
                CurrentSearchResult.Value = null;
            }

            IsLoading.Value = false;
        }

        // GỬI LỜI MỜI (Dùng userId từ kết quả tìm kiếm)
        public async UniTask SendFriendRequest(string targetUserId)
        {
            IsLoading.Value = true;
            bool success = await _friendService.AddFriendAsync(targetUserId);
            if (success)
            {
                Debug.Log("Gửi lời mời thành công!");
                await FetchSentRequestsAsync(); // Refresh lại danh sách đã gửi
            }
            IsLoading.Value = false;
        }

        // CHẤP NHẬN
        public async UniTask AcceptRequest(string senderUserId)
        {
            IsLoading.Value = true;
            bool success = await _friendService.AcceptFriendAsync(senderUserId);
            if (success)
            {
                // Cập nhật lại 2 danh sách
                await FetchPendingRequestsAsync();
                await FetchFriendListAsync();
            }
            IsLoading.Value = false;
        }

        // TỪ CHỐI
        public async UniTask RejectRequest(string senderUserId)
        {
            IsLoading.Value = true;
            bool success = await _friendService.RejectFriendAsync(senderUserId);
            if (success) await FetchPendingRequestsAsync();
            IsLoading.Value = false;
        }

        // XÓA BẠN
        public async UniTask Unfriend(string targetUserId)
        {
            IsLoading.Value = true;
            bool success = await _friendService.UnfriendAsync(targetUserId);
            if (success) await FetchFriendListAsync();
            IsLoading.Value = false;
        }
    }
}