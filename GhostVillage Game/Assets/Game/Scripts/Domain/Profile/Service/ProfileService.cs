using Cysharp.Threading.Tasks;
using GhostVillage.Domain.Profile;
using Game.Core.Network.API;
using System.Linq;
using System.Collections.Generic;

public class ProfileService {
    private readonly APIClient _apiClient;
    public ProfileService(APIClient apiClient) => _apiClient = apiClient;

    public async UniTask<FullProfileDTO> GetProfileAsync(string token) {
        return await _apiClient.GetAsyncWithAuth<FullProfileDTO>("/api/game/player/profile", token);
    }

    public async UniTask<FullProfileDTO> GetHistoryAsync(string token) {
        return await _apiClient.GetAsyncWithAuth<FullProfileDTO>("/api/game/player/match-history", token);
    }

    public async UniTask<FullProfileDTO> GetAchievementsAsync(string token) {
        return await _apiClient.GetAsyncWithAuth<FullProfileDTO>("/api/game/player/achievements", token);
    }

    public async UniTask<bool> UpdateMedalsAsync(List<string> medalIds, string token) 
    {
        string medalIdsJson = string.Join(",", medalIds.Select(id => $"\"{id}\""));
        string jsonBody = "{\"medalCodes\":[" + medalIdsJson + "]}";

        // CHỈNH SỬA: Truyền List<string> trực tiếp. 
        // APIClient sẽ bóc trường 'data' từ Backend và trả về đúng List<string> này.
        var response = await _apiClient.PostAsyncWithAuth<List<string>>(
            "/api/game/player/medals", 
            jsonBody, 
            token
        );
        
        // Nếu response không null, nghĩa là APIClient đã parse 'data' thành công
        return response != null; 
    }
    
    public async UniTask<bool> ClaimAchievementAsync(string achievementId, string token) 
    {
        string jsonBody = "{\"achievementId\":\"" + achievementId + "\"}";
        var response = await _apiClient.PostAsyncWithAuth<ClaimResultDTO>(
            "/api/game/player/claim-achievement", 
            jsonBody, 
            token
        );
        return response != null; 
    }
}