using UnityEngine;
using Photon.Voice.Unity;

public class VoiceSingleton : MonoBehaviour
{
    private static VoiceSingleton _instance;

    private void Awake()
    {
        // 1. Nếu trên đời này đã có 1 thằng Voice rồi, TỰ SÁT NGAY LẬP TỨC!
        if (_instance != null && _instance != this)
        {
            Debug.Log("🔇 [VoiceSingleton] Phát hiện bản sao Voice bị thừa khi load lại Scene. Đã tự hủy!");
            Destroy(this.gameObject);
            return;
        }

        // 2. Nếu mình là đứa đầu tiên, lên ngôi Vua và sống mãi mãi qua mọi Scene
        _instance = this;
        DontDestroyOnLoad(this.gameObject);
        Debug.Log("🎤 [VoiceSingleton] Đã khởi tạo đường truyền Mic trường sinh bất tử!");
    }
}