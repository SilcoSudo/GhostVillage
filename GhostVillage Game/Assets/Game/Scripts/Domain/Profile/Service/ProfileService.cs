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
}