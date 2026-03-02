using System;
using UnityEngine;

public static class InteractionEvents
{
    // Sự kiện khi người chơi nhìn vào/nhìn ra khỏi vật thể
    // string: Nội dung prompt (VD: "Mở cửa (F)")
    // bool: true = hiện, false = ẩn
    public static event Action<string, bool> OnInteractHover;

    public static void TriggerHover(string prompt, bool isHovering)
    {
        OnInteractHover?.Invoke(prompt, isHovering);
    }
}