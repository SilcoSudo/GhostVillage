using Cysharp.Threading.Tasks;
using UnityEngine;
using VContainer;
using R3;
using Game.Domain.Friend.Services;
using Game.Domain.Friend.DTOs;
using System.Collections.Generic;
using Game.Script.UI; // Thêm GlobalUIManager
using System;
using Game.Core.Network.Chat;

namespace Game.Domain.Friend.Controllers
{
    public class FriendController
    {
        private readonly FriendService _friendService;
        private readonly GlobalUIManager _globalUI;
        private readonly GlobalChatManager _chatManager;

        public ReactiveProperty<bool> IsLoading { get; } = new(false);
        public ReactiveProperty<List<FriendProfileDTO>> FriendList { get; } = new(new List<FriendProfileDTO>());
        public ReactiveProperty<List<FriendProfileDTO>> PendingRequests { get; } = new(new List<FriendProfileDTO>());
        public ReactiveProperty<List<FriendProfileDTO>> SentRequests { get; } = new(new List<FriendProfileDTO>());
        public ReactiveProperty<PlayerSearchDTO> CurrentSearchResult { get; } = new(null);
        public ReactiveProperty<string> SearchError { get; } = new(string.Empty);

        // 0 = Offline, 2 = Online, v.v..
        public ReactiveProperty<Dictionary<string, int>> FriendStatuses { get; } = new(new Dictionary<string, int>());

        [Inject]
        public FriendController(FriendService friendService, GlobalUIManager globalUI, GlobalChatManager chatManager)
        {
            _friendService = friendService;
            _globalUI = globalUI;
            _chatManager = chatManager;

            // BẮT SỰ KIỆN KHI PHOTON CHAT BÁO CÓ BẠN BÈ ĐỔI TRẠNG THÁI
            _chatManager.OnFriendStatusUpdated += HandleFriendStatusUpdated;
        }

        private void HandleFriendStatusUpdated(string userId, int status)
        {
            // Cập nhật lại Dictionary và kích R3 để UI tự render lại
            var currentDict = new Dictionary<string, int>(FriendStatuses.Value);
            currentDict[userId] = status;
            FriendStatuses.Value = currentDict;
        }

        public async UniTask InitializeDataAsync()
        {
            IsLoading.Value = true;
            _chatManager.Connect();
            await UniTask.WhenAll(FetchFriendListAsync(), FetchPendingRequestsAsync(), FetchSentRequestsAsync());
            IsLoading.Value = false;
        }

        public async UniTask FetchFriendListAsync()
        {
            var list = await _friendService.GetFriendListAsync();
            FriendList.Value = list;

            // NÉM DANH SÁCH USER ID CHO PHOTON CHAT THEO DÕI
            if (list != null && list.Count > 0)
            {
                string[] friendIds = new string[list.Count];
                for (int i = 0; i < list.Count; i++)
                {
                    friendIds[i] = list[i].GetUserId();
                }
                _chatManager.TrackFriends(friendIds);
            }
        }

        public async UniTask FetchPendingRequestsAsync()
        {
            var list = await _friendService.GetPendingRequestsAsync();
            PendingRequests.Value = list;
        }

        public async UniTask FetchSentRequestsAsync()
        {
            var list = await _friendService.GetSentRequestsAsync();
            SentRequests.Value = list;
        }

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
            if (result != null && !string.IsNullOrEmpty(result.userId)) CurrentSearchResult.Value = result;
            else SearchError.Value = "Không tìm thấy người chơi!";

            IsLoading.Value = false;
        }

        // ===============================================
        // CÁC HÀM CÓ DÙNG TRY-CATCH VÀ SHOW GLOBAL POPUP LỖI
        // ===============================================

        public async UniTask<bool> SendFriendRequest(string targetUserId)
        {
            IsLoading.Value = true;
            try
            {
                bool success = await _friendService.AddFriendAsync(targetUserId);
                if (success)
                {
                    _globalUI.ShowError("Thành công", "Đã gửi lời mời kết bạn!");
                    await FetchSentRequestsAsync();
                    return true;  // ✅ FIX: Return true chỉ khi success
                }
                return false;  // ✅ FIX: Return false nếu AddFriendAsync fail
            }
            catch (Exception ex)
            {
                // [FIX]: Hứng cái lỗi ném từ API (VD: Bạn đã đạt giới hạn 20 người bạn)
                // Phải check xem nó có phải UnityWebRequestException không, nếu có thì bóc Message.
                // Ở đây ta cứ in chung chung cái ex.Message trước, APIClient nó sẽ bọc lại
                string errorMsg = "Người này đã là bạn, hoặc bạn đã gửi lời mời trước đó rồi!";

                // Nếu BE trả về 400 kèm message, ta móc nó ra (dựa theo log APIClient của sếp)
                if (ex.Message.Contains("400") || ex.Message.Contains("giới hạn"))
                {
                    // Lọc để hiển thị một câu dễ nhìn hơn nếu có chữ "giới hạn"
                    errorMsg = "Không thể gửi. Có thể danh sách bạn bè của một người đã đầy!";
                }

                _globalUI.ShowError("Lỗi kết bạn", errorMsg);
                return false;
            }
            finally { IsLoading.Value = false; }
        }

        public async UniTask<bool> AcceptRequest(string friendshipId)
        {
            IsLoading.Value = true;
            try
            {
                bool success = await _friendService.AcceptFriendAsync(friendshipId);
                if (success)
                {
                    await FetchPendingRequestsAsync();
                    await FetchFriendListAsync();
                }
                return true;
            }
            catch (Exception ex)
            {
                // [FIX]: Hứng lỗi đầy bạn lúc Accept
                string errorMsg = "Không thể chấp nhận (Có thể lời mời đã bị hủy)!";
                if (ex.Message.Contains("400") || ex.Message.Contains("giới hạn"))
                {
                    errorMsg = "Không thể chấp nhận. Danh sách bạn bè đã đầy (Giới hạn 20 người)!";
                }

                _globalUI.ShowError("Lỗi", errorMsg);
                await FetchPendingRequestsAsync();
                return false;
            }
            finally { IsLoading.Value = false; }
        }

        public async UniTask<bool> RejectRequest(string friendshipId)
        {
            IsLoading.Value = true;
            try
            {
                bool success = await _friendService.RejectFriendAsync(friendshipId);
                if (success) await FetchPendingRequestsAsync();
                return true;
            }
            catch (Exception)
            {
                _globalUI.ShowError("Lỗi", "Không thể từ chối lời mời lúc này!");
                return false;
            }
            finally { IsLoading.Value = false; }
        }

        public async UniTask<bool> Unfriend(string targetUserId)
        {
            IsLoading.Value = true;
            try
            {
                bool success = await _friendService.UnfriendAsync(targetUserId);
                if (success) await FetchFriendListAsync();
                return true;
            }
            catch (Exception)
            {
                _globalUI.ShowError("Lỗi", "Không thể xóa bạn bè lúc này!");
                return false;
            }
            finally { IsLoading.Value = false; }
        }
    }
}