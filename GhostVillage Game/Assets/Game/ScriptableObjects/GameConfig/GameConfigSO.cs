using UnityEngine;

namespace Game.ScriptableObjects.GameConfig // Đặt namespace cho chuyên nghiệp
{
    [CreateAssetMenu(fileName = "GameConfig", menuName = "Config/GameConfig")]
    public class GameConfigSO : ScriptableObject
    {
        [Header("Server Settings")]
        public string ServerUrl = "http://localhost:5000"; // Default cho local

        [Header("Game Settings")]
        public string GameVersion = "1.0.0";
        public bool IsDebugMode = true;
    }
}