using Cysharp.Threading.Tasks;
using UnityEngine;
using VContainer;
using R3;
using Game.Domain.Perk.Services;
using Game.Domain.Perk.DTOs;
using System.Collections.Generic;
using Game.Script.UI; // Để gọi GlobalUIManager nếu bị lỗi mạng
using System;

namespace Game.Domain.Perk.Controllers
{
    public class PerkController
    {
        private readonly PerkService _perkService;
        private readonly GlobalUIManager _globalUI;

        // --- CÁC BIẾN R3 ĐỂ UI (ManagePerkModal) CẮM VÀO LẮNG NGHE ---
        public ReactiveProperty<bool> IsLoading { get; } = new(false);
        public ReactiveProperty<PlayerPerksData> PerkData { get; } = new(null);

        [Inject]
        public PerkController(PerkService perkService, GlobalUIManager globalUI)
        {
            _perkService = perkService;
            _globalUI = globalUI;
        }

        // HÀM NÀY ĐƯỢC GỌI KHI NGƯỜI CHƠI MỞ BẢNG PERK TRONG LOBBY
        public async UniTask FetchPerkDataAsync()
        {
            IsLoading.Value = true;
            try
            {
                var data = await _perkService.GetPlayerPerksAsync();
                if (data != null)
                {
                    PerkData.Value = data;
                }
                else
                {
                    _globalUI.ShowError("Error", "Can not load Perk!");
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[PerkController] Lỗi Fetch Data: {ex.Message}");
                _globalUI.ShowError("Error", "Can not connect to server!");
            }
            finally
            {
                IsLoading.Value = false;
            }
        }

        // HÀM NÀY ĐƯỢC GỌI KHI NGƯỜI CHƠI BẤM NÚT [SAVE] TRÊN UI LOBBY
        public async UniTask<bool> SaveEquippedPerksAsync(List<string> selectedPerkIds)
        {
            IsLoading.Value = true;
            _globalUI.ShowLoading(true, "Saving...");

            try
            {
                bool success = await _perkService.EquipPerksAsync(selectedPerkIds);
                if (success)
                {
                    // LƯU DATA VÀO TÚI PHOTON NGAY VÀ LUÔN ĐỂ MANG VÀO GAME
                    var props = new ExitGames.Client.Photon.Hashtable
                    {
                        { "MyPerks", selectedPerkIds.ToArray() }
                    };
                    Photon.Pun.PhotonNetwork.LocalPlayer.SetCustomProperties(props);

                    // Cập nhật lại cái R3 cho đồng bộ Local
                    var currentData = PerkData.Value;
                    if (currentData != null)
                    {
                        currentData.equippedPerks = new List<string>(selectedPerkIds);
                        PerkData.Value = currentData; // Kích R3
                    }

                    _globalUI.ShowLoading(false);
                    return true;
                }
                else
                {
                    _globalUI.ShowLoading(false);
                    _globalUI.ShowError("Error", "Failed to save perks. Please try again!");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[PerkController] Lỗi Save Data: {ex.Message}");
                _globalUI.ShowLoading(false);
                _globalUI.ShowError("Error", "Failed to save perks due to network issues!");
                return false;
            }
        }
    }
}