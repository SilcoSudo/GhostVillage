using Cysharp.Threading.Tasks;
using UnityEngine;
using VContainer;
using Game.Core.Network.API;
using Game.Domain.Perk.DTOs;
using System.Collections.Generic;
using Game.Core.Network;

namespace Game.Domain.Perk.Services
{
    public class PerkService
    {
        private readonly APIClient _apiClient;
        private readonly GameSession _session;

        [Inject]
        public PerkService(APIClient apiClient, GameSession session)
        {
            _apiClient = apiClient;
            _session = session;
        }

        private string Token => _session.Token;

        // 1. GET: Lấy full data Perk của người chơi (dành cho Lobby Modal)
        public async UniTask<PlayerPerksData> GetPlayerPerksAsync()
        {
            string endpoint = "/api/game/player/perks";
            // APIClient của sếp tự động bóc vỏ rồi, nên ta lấy thẳng cái ruột Data!
            return await _apiClient.GetAsyncWithAuth<PlayerPerksData>(endpoint, Token);
        }

        // 2. PUT: Lắp/Tháo Perk (Gửi list ID lên Server)
        public async UniTask<bool> EquipPerksAsync(List<string> perkIds)
        {
            string endpoint = "/api/game/player/equip-perk";
            var body = new EquipPerksRequest { perks = perkIds };
            string jsonBody = JsonUtility.ToJson(body);

            // SỬ DỤNG DTO VỪA TẠO ĐỂ HỨNG DATA
            var response = await _apiClient.PutAsyncWithAuth<EquipPerksResultDTO>(endpoint, jsonBody, Token);

            if (response != null)
            {
                return true; // Parse thành công, JSON hợp lệ!
            }

            Debug.LogError($"[PerkService] Save thất bại do kết nối hoặc Server từ chối!");
            return false;
        }
    }
}