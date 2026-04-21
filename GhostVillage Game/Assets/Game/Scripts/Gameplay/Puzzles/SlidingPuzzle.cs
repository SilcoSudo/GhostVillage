using UnityEngine;
using System.Collections.Generic;
using UnityEngine.UI;

public class PuzzleManager : MonoBehaviour
{
    [Header("Puzzle Settings 3x3")]
    [Tooltip("Kéo 8 ô (đã gắn Tile.cs) vào đây theo thứ tự từ 1 đến 8")]
    public Tile[] tiles = new Tile[8]; 
    public float tileSize = 1.1f; 
    public int shuffleSteps = 50; 

    [Header("Puzzle Image")]
    [Tooltip("Ảnh gốc sẽ được cắt thành 3x3 và bỏ ô trống góc phải dưới")]
    [SerializeField] private Texture2D puzzleImage;
    [Tooltip("Tự gán mảnh ảnh lên tile ở Start")]
    [SerializeField] private bool applyPuzzleImageOnStart = true;
    [Tooltip("Ưu tiên gán cho SpriteRenderer nếu tile có component này")]
    [SerializeField] private bool preferSpriteRenderer = true;

    [Header("Timer Settings")]
    public float timeLimit = 120f; // 2 phút = 120 giây
    private float currentTime;
    private bool isTimerRunning = false;

    private Tile[,] board = new Tile[3, 3]; // Giảm xuống 3x3
    private Vector2Int emptyPos = new Vector2Int(2, 2); // Ô trống mặc định ở góc dưới cùng bên phải (2, 2)
    private bool isFinished = false;

    void Start()
    {
        SetupBoard();
        if (applyPuzzleImageOnStart)
        {
            ApplyPuzzleImage();
        }
        Shuffle(shuffleSteps);

        // Khởi động bộ đếm thời gian
        currentTime = timeLimit;
        isTimerRunning = true;
    }

    void Update()
    {
        // Chạy đếm ngược thời gian nếu game chưa kết thúc
        if (isTimerRunning && !isFinished)
        {
            currentTime -= Time.deltaTime;
            
            // Bạn có thể tham chiếu text UI để hiển thị thời gian ở đây
            // Debug.Log("Thời gian còn lại: " + Mathf.Ceil(currentTime) + "s");

            if (currentTime <= 0)
            {
                currentTime = 0;
                GameOver(); // Gọi hàm thua cuộc khi hết giờ
            }
        }
    }

    void SetupBoard()
    {
        int index = 0;
        for (int y = 0; y < 3; y++)
        {
            for (int x = 0; x < 3; x++)
            {
                if (x == 2 && y == 2) continue; // Bỏ qua ô cuối cùng (2,2)

                Tile tile = tiles[index];
                tile.Init(new Vector2Int(x, y));
                board[x, y] = tile;
                
                tile.transform.position = GetWorldPosition(x, y);
                index++;
            }
        }
        board[2, 2] = null; 
    }

    Vector3 GetWorldPosition(int x, int y)
    {
        return new Vector3(x * tileSize, -y * tileSize, 0) + transform.position;
    }

    public void OnTileClicked(Tile clickedTile)
    {
        if (isFinished) return; 

        Vector2Int pos = clickedTile.gridPos;
        
        if (Mathf.Abs(pos.x - emptyPos.x) + Mathf.Abs(pos.y - emptyPos.y) == 1)
        {
            board[emptyPos.x, emptyPos.y] = clickedTile;
            board[pos.x, pos.y] = null;

            Vector3 newWorldPos = GetWorldPosition(emptyPos.x, emptyPos.y);
            clickedTile.MoveTo(newWorldPos, emptyPos);
            
            emptyPos = pos;

            CheckWin();
        }
    }

    void Shuffle(int steps)
    {
        for (int i = 0; i < steps; i++)
        {
            List<Vector2Int> validMoves = GetValidMoves();
            Vector2Int randomMove = validMoves[Random.Range(0, validMoves.Count)];
            
            Tile tileToMove = board[randomMove.x, randomMove.y];
            
            board[emptyPos.x, emptyPos.y] = tileToMove;
            board[randomMove.x, randomMove.y] = null;
            
            tileToMove.Init(emptyPos); 
            tileToMove.transform.position = GetWorldPosition(emptyPos.x, emptyPos.y);
            
            emptyPos = randomMove;
        }
    }

    List<Vector2Int> GetValidMoves()
    {
        List<Vector2Int> moves = new List<Vector2Int>();
        // Giới hạn di chuyển cho lưới 3x3 (tối đa là index 2)
        if (emptyPos.x > 0) moves.Add(new Vector2Int(emptyPos.x - 1, emptyPos.y));
        if (emptyPos.x < 2) moves.Add(new Vector2Int(emptyPos.x + 1, emptyPos.y));
        if (emptyPos.y > 0) moves.Add(new Vector2Int(emptyPos.x, emptyPos.y - 1));
        if (emptyPos.y < 2) moves.Add(new Vector2Int(emptyPos.x, emptyPos.y + 1));
        return moves;
    }

    void CheckWin()
    {
        int count = 1;
        for (int y = 0; y < 3; y++)
        {
            for (int x = 0; x < 3; x++)
            {
                if (x == 2 && y == 2) continue; 

                if (board[x, y] == null || board[x, y].number != count)
                {
                    return; 
                }
                count++;
            }
        }
        
        isFinished = true;
        isTimerRunning = false; // Dừng thời gian khi thắng
        Debug.Log("Giải đố thành công! Kích hoạt mở cửa.");
    }

    void GameOver()
    {
        isFinished = true; // Khóa bảng, không cho bấm nữa
        isTimerRunning = false;
        
        Debug.Log("Hết giờ! Jumpscare!!!");
        // Kích hoạt Event thua cuộc tại đây (gọi animation quái vật, reload scene, v.v.)
    }

    [ContextMenu("Apply Puzzle Image")]
    public void ApplyPuzzleImage()
    {
        if (puzzleImage == null || tiles == null || tiles.Length == 0)
        {
            return;
        }

        for (int i = 0; i < tiles.Length; i++)
        {
            Tile tile = tiles[i];
            if (tile == null) continue;

            int tileNumber = tile.number;
            if (tileNumber <= 0) tileNumber = i + 1;

            Sprite tileSprite = CreateSpriteForTileNumber(tileNumber);
            if (tileSprite == null) continue;

            bool applied = false;

            if (preferSpriteRenderer)
            {
                var sr = tile.GetComponentInChildren<SpriteRenderer>(true);
                if (sr != null)
                {
                    sr.sprite = tileSprite;
                    applied = true;
                }
            }

            if (!applied)
            {
                var uiImage = tile.GetComponentInChildren<Image>(true);
                if (uiImage != null)
                {
                    uiImage.sprite = tileSprite;
                    uiImage.preserveAspect = true;
                    applied = true;
                }
            }

            if (!applied)
            {
                var sr = tile.GetComponentInChildren<SpriteRenderer>(true);
                if (sr != null)
                {
                    sr.sprite = tileSprite;
                    applied = true;
                }
            }

            if (!applied)
            {
                var renderer = tile.GetComponentInChildren<Renderer>(true);
                if (renderer != null && renderer.material != null)
                {
                    renderer.material.mainTexture = tileSprite.texture;
                }
            }
        }
    }

    private Sprite CreateSpriteForTileNumber(int tileNumber)
    {
        if (puzzleImage == null) return null;

        int gridSize = 3;
        int zeroBased = Mathf.Clamp(tileNumber - 1, 0, 7);
        int cellX = zeroBased % gridSize;
        int cellYFromTop = zeroBased / gridSize;

        int cellWidth = puzzleImage.width / gridSize;
        int cellHeight = puzzleImage.height / gridSize;
        int cellYFromBottom = (gridSize - 1) - cellYFromTop;

        Rect rect = new Rect(
            cellX * cellWidth,
            cellYFromBottom * cellHeight,
            cellWidth,
            cellHeight);

        return Sprite.Create(
            puzzleImage,
            rect,
            new Vector2(0.5f, 0.5f),
            100f,
            0,
            SpriteMeshType.FullRect);
    }
}