using UnityEngine;

public interface IPuzzleInteractTarget
{
    void Interact(GameObject actor);
    string GetPromptMessage();
}

[DisallowMultipleComponent]
public class PuzzleInteractable : Interactable
{
    [Header("Puzzle Reference")]
    [Tooltip("Kéo component puzzle vào đây. Puzzle đó phải implement IPuzzleInteractTarget.")]
    [SerializeField] private MonoBehaviour targetPuzzle;

    private IPuzzleInteractTarget _target;

    private void Awake()
    {
        ResolveTarget();

        if (string.IsNullOrWhiteSpace(promptText))
        {
            promptText = "Tương tác puzzle";
        }
    }

    private void OnValidate()
    {
        ResolveTarget();
    }

    public override void Interact(GameObject actor)
    {
        if (_target == null)
        {
            Debug.LogError("[PuzzleInteractable] Target puzzle chưa được gán đúng hoặc không implement IPuzzleInteractTarget!");
            return;
        }

        _target.Interact(actor);
    }

    public override string GetPromptMessage()
    {
        if (_target != null)
        {
            return _target.GetPromptMessage();
        }

        return base.GetPromptMessage();
    }

    private void ResolveTarget()
    {
        if (targetPuzzle == null || targetPuzzle is not IPuzzleInteractTarget)
        {
            var candidates = GetComponents<MonoBehaviour>();
            foreach (var candidate in candidates)
            {
                if (candidate is IPuzzleInteractTarget)
                {
                    targetPuzzle = candidate;
                    break;
                }
            }
        }

        _target = targetPuzzle as IPuzzleInteractTarget;
    }
}