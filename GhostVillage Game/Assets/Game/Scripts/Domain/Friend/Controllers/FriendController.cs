using Cysharp.Threading.Tasks;
using UnityEngine;
using VContainer;
using R3;
using Game.Domain.Friend.Services;
using Game.Domain.Friend.DTOs;
using System.Collections.Generic;
using Game.Script.UI;
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

        public ReactiveProperty<Dictionary<string, int>> FriendStatuses { get; } = new(new Dictionary<string, int>());

        [Inject]
        public FriendController(FriendService friendService, GlobalUIManager globalUI, GlobalChatManager chatManager)
        {
            _friendService = friendService;
            _globalUI = globalUI;
            _chatManager = chatManager;
            _chatManager.OnFriendStatusUpdated += HandleFriendStatusUpdated;
        }

        private void HandleFriendStatusUpdated(string userId, int status)
        {
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

        // [FIX CHÍ MẠNG 2]: Thêm hàm này để gọi lại data mới nhất khi mở bảng lên
        public async UniTask RefreshDataAsync()
        {
            Debug.Log("<color=cyan>[FriendController] Đang đồng bộ lại danh sách từ Database...</color>");
            IsLoading.Value = true;
            await UniTask.WhenAll(FetchFriendListAsync(), FetchPendingRequestsAsync(), FetchSentRequestsAsync());
            IsLoading.Value = false;
        }

        public async UniTask FetchFriendListAsync()
        {
            var list = await _friendService.GetFriendListAsync();
            FriendList.Value = list;

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

        [Obsolete]
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

        [Obsolete]
        public async UniTask<bool> SendFriendRequest(string targetUserId)
        {
            IsLoading.Value = true;
            try
            {
                bool success = await _friendService.AddFriendAsync(targetUserId);
                if (success)
                {
                    _globalUI.ShowError("Success", "Friend request sent!");
                    await FetchSentRequestsAsync();
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                string errorMsg = "This person is already your friend, or you have already sent them a friend request!";
                if (ex.Message.Contains("400") || ex.Message.Contains("Friend limit reached"))
                {
                    errorMsg = "Cannot send request. This person's friend list might be full!";
                }
                _globalUI.ShowError("Friend Request Error", errorMsg);
                return false;
            }
            finally { IsLoading.Value = false; }
        }

        [Obsolete]
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
                string errorMsg = "Cannot accept request (Request might have been cancelled)!";
                if (ex.Message.Contains("400") || ex.Message.Contains("Friend limit reached"))
                {
                    errorMsg = "Cannot accept request. Friend list might be full (Limit: 20 friends)!";
                }
                _globalUI.ShowError("Accept Request Error", errorMsg);
                await FetchPendingRequestsAsync();
                return false;
            }
            finally { IsLoading.Value = false; }
        }

        [Obsolete]
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
                _globalUI.ShowError("Reject Request Error", "Cannot reject request at this time!");
                return false;
            }
            finally { IsLoading.Value = false; }
        }

        [Obsolete]
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
                _globalUI.ShowError("Unfriend Error", "Cannot remove friend at this time!");
                return false;
            }
            finally { IsLoading.Value = false; }
        }
    }
}