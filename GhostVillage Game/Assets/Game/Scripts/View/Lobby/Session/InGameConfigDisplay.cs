using UnityEngine;
using TMPro;
using Game.Domain.Map.DTOs;

namespace Game.Scripts.View.Lobby.Session
{
    public class InGameConfigDisplay : MonoBehaviour
    {
        [Header("UI Reference")]
        [SerializeField] private TextMeshProUGUI _txtConfigDump;

        private void Start()
        {
            // Lấy data từ chiếc hộp
            if (GameDataTransfer.Instance != null && GameDataTransfer.Instance.SelectedMapConfig != null)
            {
                ShowConfig(GameDataTransfer.Instance.SelectedMapConfig);
            }
            else
            {
                _txtConfigDump.text = "Error: No Map Config Found!";
                Debug.LogError("Không tìm thấy Config từ Lobby chuyển sang!");
            }
        }

        private void ShowConfig(MapConfigDTO config)
        {
            // Dump toàn bộ object ra JSON text để debug
            string jsonDebug = JsonUtility.ToJson(config, true);

            _txtConfigDump.text = $"<color=yellow>--- LOADED MAP CONFIG ---</color>\n" +
                                  $"Name: {config.identityConfig.displayName}\n" +
                                  $"ID: {config.identityConfig.mapId}\n\n" +
                                  $"<color=green>RAW JSON:</color>\n{jsonDebug}";
        }
    }
}