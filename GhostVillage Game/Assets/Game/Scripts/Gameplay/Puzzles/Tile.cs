using UnityEngine;

public class Tile : MonoBehaviour
{
    [Header("Tile Data")]
    [Tooltip("Số thứ tự đúng của ô (1..8 với puzzle 3x3)")]
    public int number = 1;

    [HideInInspector]
    public Vector2Int gridPos;

    [Header("Move")]
    [SerializeField] private bool smoothMove = false;
    [SerializeField] private float moveDuration = 0.12f;

    private Coroutine _moveRoutine;

    public void Init(Vector2Int pos)
    {
        gridPos = pos;
    }

    public void MoveTo(Vector3 worldPosition, Vector2Int newGridPos)
    {
        gridPos = newGridPos;

        if (!smoothMove)
        {
            transform.position = worldPosition;
            return;
        }

        if (_moveRoutine != null)
        {
            StopCoroutine(_moveRoutine);
        }

        _moveRoutine = StartCoroutine(MoveRoutine(worldPosition));
    }

    private System.Collections.IEnumerator MoveRoutine(Vector3 targetPos)
    {
        Vector3 startPos = transform.position;
        float duration = Mathf.Max(0.01f, moveDuration);
        float t = 0f;

        while (t < 1f)
        {
            t += Time.deltaTime / duration;
            transform.position = Vector3.Lerp(startPos, targetPos, t);
            yield return null;
        }

        transform.position = targetPos;
        _moveRoutine = null;
    }
}
