using System.Collections.Generic;
using Cysharp.Threading.Tasks;
using GhostVillage.Domain.Profile;
using UnityEngine;

public class ProfileController
{
    private readonly ProfileService _service;
    // Biến lưu trữ dữ liệu tập trung trong bộ nhớ để các Tab dùng chung
    private FullProfileDTO _masterData = new FullProfileDTO
    {
        achievements = new List<QuestItemDTO>(),
        selectedMedals = new List<string>()
    };
    private List<string> _tempMedalIds = new List<string>();

    public ProfileController(ProfileService service)
    {
        _service = service;
    }

    // Trả về dữ liệu hiện tại đang có trong Controller
    public FullProfileDTO GetCurrentData() => _masterData;

    public async UniTask<FullProfileDTO> RefreshTabData(int tabIndex)
    {
        string token = PlayerPrefs.GetString("AccessToken", "");
        Debug.Log($"<color=orange>[Controller]</color> Bắt đầu nạp Tab {tabIndex}...");

        FullProfileDTO result = null;
        switch (tabIndex)
        {
            case 0:
                var (pResponse, aResponse) = await UniTask.WhenAll(
                _service.GetProfileAsync(token),
                _service.GetAchievementsAsync(token)
                );

                if (pResponse != null)
                {
                    _masterData.profile = pResponse.profile;
                    _masterData.selectedMedals = pResponse.selectedMedals;
                }
                if (aResponse != null)
                {
                    _masterData.achievements = aResponse.achievements;
                }

                result = _masterData;
                break;
            case 1:
                result = await _service.GetHistoryAsync(token);
                if (result != null && result.history != null)
                {
                    _masterData.history = result.history;
                    Debug.Log($"<color=green>[Controller]</color> Đã nhận {result.history.Count} trận đấu.");
                    // LOG CHI TIẾT ITEM ĐẦU TIÊN ĐỂ KIỂM TRA MAPPING
                    if (result.history.Count > 0)
                    {
                        var first = result.history[0];
                        Debug.Log($"<color=green>[Data Check]</color> Trận đầu: {first.resultStatus}, Map: {first.matchId.mapName}, Win: {first.isWin}");
                    }
                }
                break;
            case 2:
                result = await _service.GetAchievementsAsync(token);
                if (result != null && result.achievements != null)
                {
                    _masterData.achievements = result.achievements;
                    Debug.Log($"<color=green>[Controller]</color> Đã nhận {result.achievements.Count} thành tựu.");
                }
                break;
        }

        if (result == null) Debug.LogWarning($"<color=red>[Controller]</color> API Tab {tabIndex} trả về NULL!");
        return _masterData;
    }

    // Khởi tạo danh sách tạm thời từ dữ liệu Master
    public void SetTempMedals(List<string> initialMedals)
    {
        _tempMedalIds = initialMedals != null ? new List<string>(initialMedals) : new List<string>();
    }

    // Lấy danh sách tạm thời để UI vẽ dấu tích
    public List<string> GetTempMedals()
    {
        return _tempMedalIds;
    }

    // Xử lý logic chọn/bỏ chọn tối đa 3 cái
    public void ToggleMedalInList(string medalId)
    {
        if (_tempMedalIds.Contains(medalId))
        {
            _tempMedalIds.Remove(medalId);
        }
        else
        {
            if (_tempMedalIds.Count >= 3)
            {
                Debug.LogWarning("Chỉ được chọn tối đa 3 huy chương!");
                return;
            }
            _tempMedalIds.Add(medalId);
        }
    }

    // Lưu dữ liệu từ Temp lên Server và cập nhật Master
    public async UniTask<bool> SaveSelectedMedalsToServer()
    {
        string token = PlayerPrefs.GetString("AccessToken", "");
        // Giả sử bạn đã viết hàm UpdateMedalsAsync trong ProfileService
        bool success = await _service.UpdateMedalsAsync(_tempMedalIds, token);

        if (success)
        {
            _masterData.selectedMedals = new List<string>(_tempMedalIds);
        }
        return success;
    }

    public async UniTask<bool> ClaimAchievement(string id)
    {
        string token = PlayerPrefs.GetString("AccessToken", "");
        return await _service.ClaimQuestAsync(id, token);
    }
}