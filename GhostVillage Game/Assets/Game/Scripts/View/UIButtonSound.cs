using UnityEngine;
using UnityEngine.UI;
using Game.Core.Audio; // Trỏ về namespace mới

[RequireComponent(typeof(Button))]
public class UIButtonSound : MonoBehaviour
{
    [Tooltip("ID của âm thanh muốn phát khi bấm nút này")]
    public string audioID = "All_Button";

    private void Start()
    {
        var btn = GetComponent<Button>();
        if (btn != null)
        {
            btn.onClick.AddListener(PlaySound);
        }
    }

    private void PlaySound()
    {
        if (GlobalAudioManager.Instance != null)
        {
            GlobalAudioManager.Instance.PlaySFX(audioID);
        }
    }
}