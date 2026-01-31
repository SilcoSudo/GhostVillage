using UnityEngine;
using Game.Domain.Map.DTOs;

namespace Game.Scripts.View.Lobby.Session
{
    public class GameDataTransfer : MonoBehaviour
    {
        public static GameDataTransfer Instance { get; private set; }

        // Biến này sẽ chứa Config của Map được chọn để mang sang Scene mới
        public MapConfigDTO SelectedMapConfig { get; private set; }

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject); // QUAN TRỌNG: Không bị hủy khi load scene
            }
            else
            {
                Destroy(gameObject);
            }
        }

        public void SetMapConfig(MapConfigDTO config)
        {
            SelectedMapConfig = config;
            Debug.Log($"[GameDataTransfer] Saved Config for: {config.identityConfig.displayName}");
        }
    }
}