// File: src/Game/UI/Core/GlobalUIManager.cs
using UnityEngine;

namespace Game.Script.UI
{
    public class GlobalUIManager : MonoBehaviour
    {
        [SerializeField] private GameObject _loadingPanel;

        // Hàm này gọi từ bất cứ đâu
        public void ShowLoading(bool show)
        {
            _loadingPanel.SetActive(show);
        }
    }
}