using UnityEngine;

namespace Game.Scripts.View.Lobby.Session
{
    public class GameDataTransfer : MonoBehaviour
    {
        public static GameDataTransfer Instance { get; private set; }

        // CHỈ LƯU MỖI CÁI ID ĐỂ SANG SCENE GAME TỰ FETCH
        public string SelectedMapId { get; private set; }

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        public void SetMapId(string mapId)
        {
            SelectedMapId = mapId;
            Debug.Log($"[GameDataTransfer] Đã nhận vé Map ID: {mapId}");
        }
    }
}