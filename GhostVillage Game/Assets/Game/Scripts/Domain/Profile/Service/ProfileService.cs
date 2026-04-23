using Cysharp.Threading.Tasks;
using GhostVillage.Domain.Profile;
using Game.Core.Network.API;
using System.Linq;
using System.Collections.Generic;

public class ProfileService
{
    private readonly APIClient _apiClient;
    public ProfileService(APIClient apiClient) => _apiClient = apiClient;

    public async UniTask<FullProfileDTO> GetProfileAsync(string token)
    {
        return await _apiClient.GetAsyncWithAuth<FullProfileDTO>("/api/game/profile", token);
    }

    public async UniTask<FullProfileDTO> GetHistoryAsync(string token)
    {
        return await _apiClient.GetAsyncWithAuth<FullProfileDTO>("/api/game/profile/match-history", token);
    }

    public async UniTask<FullProfileDTO> GetAchievementsAsync(string token)
    {
        return await _apiClient.GetAsyncWithAuth<FullProfileDTO>("/api/game/profile/achievements", token);
    }

    public async UniTask<bool> UpdateMedalsAsync(List<string> medalIds, string token)
    {
        string medalIdsJson = string.Join(",", medalIds.Select(id => $"\"{id}\""));
        string jsonBody = "{\"medalCodes\":[" + medalIdsJson + "]}";

        // CHỈNH SỬA: Truyền List<string> trực tiếp. 
        // APIClient sẽ bóc trường 'data' từ Backend và trả về đúng List<string> này.
        var response = await _apiClient.PostAsyncWithAuth<List<string>>(
            "/api/game/profile/medals",
            jsonBody,
            token
        );

        // Nếu response không null, nghĩa là APIClient đã parse 'data' thành công
        return response != null;
    }

    public async UniTask<bool> ClaimQuestAsync(string questId, string token)
    {
        // Truyền đúng field 'questId' mà controller Backend yêu cầu
        string jsonBody = "{\"questId\":\"" + questId + "\"}";

        var response = await _apiClient.PostAsyncWithAuth<ClaimResultDTO>(
            "/api/quests/claim", // Cổng API mới của sếp
            jsonBody,
            token
        );
        return response != null;
    }

    // Gửi cục JSON rawStats lên Backend để cộng điểm Quest/Achievement
    public async UniTask<bool> UpdateQuestProgressAsync(string jsonPayload, string token)
    {
        // Tái sử dụng ClaimResultDTO để hứng message trả về cho lẹ (nếu cần)
        var response = await _apiClient.PostAsyncWithAuth<ClaimResultDTO>(
            "/api/quests/update-progress",
            jsonPayload,
            token
        );
        return response != null;
    }

    // ========================================================
    // [FIX CHÍ MẠNG]: TẠO DTO ĐỂ HỨNG DATA TỪ BACKEND
    // ========================================================
    [System.Serializable]
    public class AvatarUpdateResponseDTO
    {
        public string avatar;
    }

    // ========================================================
    // [MỚI] API LƯU AVATAR
    // ========================================================
    public async UniTask<bool> UpdateAvatarAsync(string avatarId, string token)
    {
        string jsonBody = $"{{\"avatarId\":\"{avatarId}\"}}";

        // Đổi từ <object> thành <AvatarUpdateResponseDTO> để Unity nó hiểu!
        var response = await _apiClient.PutAsyncWithAuth<AvatarUpdateResponseDTO>(
            "/api/game/player/avatar",
            jsonBody,
            token
        );

        // Bóc được response thì trả về True
        return response != null;
    }
}