using UnityEngine;
using TMPro;

public class GameplayUIManager : MonoBehaviour
{
    [Header("Interaction UI")]
    [SerializeField] private GameObject interactPanel;
    [SerializeField] private TextMeshProUGUI interactText;

    private void OnEnable()
    {
        InteractionEvents.OnInteractHover += UpdateInteractUI;
    }

    private void OnDisable()
    {
        InteractionEvents.OnInteractHover -= UpdateInteractUI;
    }

    private void UpdateInteractUI(string msg, bool show)
    {
        if (interactPanel)
        {
            interactText.text = msg;
            interactPanel.SetActive(show);
        }
    }
}