// using Cysharp.Threading.Tasks;
// using Game.Domain.Authentication.DTOs;
// using Newtonsoft.Json;
// using UnityEngine;

// namespace Game.Core.ReactiveRepo
// {
//     public class PlayerDataSyncService
//     {
//         private readonly PlayerDataStore _store;

//         public PlayerDataSyncService(PlayerDataStore store) => _store = store;

//         /// <summary>
//         /// Nạp toàn bộ dữ liệu vào Store sau khi login thành công.
//         /// </summary>
//         public async UniTask SyncAllDataAsync(LoginResponseDTO loginData)
//         {
//             Debug.Log("[Sync] Bắt đầu nạp dữ liệu vào Cục Data...");

//             // 1. Nạp Profile từ dữ liệu Login
//             _store.Initialize(loginData);

//             // 2. (Mở rộng sau này) Gọi thêm API lấy Thành tựu, Lịch sử đấu...
//             // var achievements = await _apiClient.GetAsync("/api/achievements");
//             // _store.UpdateAchievements(achievements);

//             await UniTask.Delay(500); // Giả lập độ trễ cho mượt UI
//             Debug.Log("[Sync] Đồng bộ hoàn tất!");
//         }

//         /// <summary>
//         /// Tuyệt chiêu "Virtual DOM": Chỉ cập nhật phần thay đổi từ JSON.
//         /// </summary>
//         public void MergeDeltaUpdate(string jsonDelta)
//         {
//             // Newtonsoft.Json sẽ tự tìm các trường tương ứng trong Store và đè dữ liệu mới lên
//             JsonConvert.PopulateObject(jsonDelta, _store);
//             Debug.Log($"[Sync] Đã gộp thay đổi: {jsonDelta}");
//         }
//     }
// }