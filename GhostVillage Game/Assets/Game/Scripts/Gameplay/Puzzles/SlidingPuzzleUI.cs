using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.InputSystem; 

public class SlidingPuzzleUI : MonoBehaviour
{
    public static SlidingPuzzleUI Instance;

    [Header("--- UI References ---")]
    public GameObject panelMain; 
    public Transform gridBoard;  
    public TextMeshProUGUI textHeader;
    public TextMeshProUGUI textStatus;

    private Transform[] tiles = new Transform[9];
    private int emptyIndex = 8;
    private SlidingPuzzle currentPuzzle3D;

    void Awake()
    {
        if (Instance == null) Instance = this;
        if (panelMain != null) panelMain.SetActive(false);
    }

    public void OpenPuzzle(SlidingPuzzle puzzle)
    {
        currentPuzzle3D = puzzle;
        panelMain.SetActive(true);
        if (textStatus != null) textStatus.text = "Click adjacent tile to slide.";

        InitializeBoard();
        Shuffle(50);
    }

    public void ClosePuzzle()
    {
        panelMain.SetActive(false);
        if (currentPuzzle3D != null) currentPuzzle3D.OnPlayerCanceled();
    }

    private void Update()
    {
        if (panelMain.activeSelf && Keyboard.current != null)
        {
            if (Keyboard.current.fKey.wasPressedThisFrame || 
                Keyboard.current.enterKey.wasPressedThisFrame || 
                Keyboard.current.escapeKey.wasPressedThisFrame)
            {
                ClosePuzzle();
            }
        }
    }

    private void InitializeBoard()
    {
        for (int i = 0; i < 9; i++)
        {
            tiles[i] = gridBoard.GetChild(i);
            
            // [CÚ FIX ĂN TIỀN LÀ ĐÂY]: Bắt chết reference của viên gạch tại thời điểm này
            Transform currentTile = tiles[i]; 
            
            Button btn = currentTile.GetComponent<Button>();
            if (btn != null)
            {
                btn.onClick.RemoveAllListeners();
                
                // Truyền thẳng cục gạch vào hàm, không dùng Index nữa!
                btn.onClick.AddListener(() => OnTileClick(currentTile));
            }
            if (currentTile.name == "Tile_Empty") emptyIndex = i;
        }
    }

    private void OnTileClick(Transform clickedTile)
    {
        int clickedIndex = -1;
        
        // Quét lại mảng tiles hiện tại xem viên gạch bị bấm đang nằm ở Index thứ mấy
        for (int i = 0; i < 9; i++) 
        {
            if (tiles[i] == clickedTile) 
            {
                clickedIndex = i;
                break;
            }
        }

        if (IsAdjacent(clickedIndex, emptyIndex))
        {
            SwapTiles(clickedIndex, emptyIndex);
            CheckWin();
        }
    }

    private bool IsAdjacent(int index1, int index2)
    {
        int x1 = index1 % 3, y1 = index1 / 3;
        int x2 = index2 % 3, y2 = index2 / 3;
        return Mathf.Abs(x1 - x2) + Mathf.Abs(y1 - y2) == 1;
    }

    private void SwapTiles(int i, int j)
    {
        // Hoán đổi vị trí trong bộ nhớ code
        Transform temp = tiles[i];
        tiles[i] = tiles[j];
        tiles[j] = temp;

        // Hoán đổi vị trí hiển thị trên màn hình (UI Sibling Index)
        for (int k = 0; k < 9; k++) tiles[k].SetSiblingIndex(k);

        // Cập nhật lại vị trí của ô Trống
        if (tiles[i].name == "Tile_Empty") emptyIndex = i;
        if (tiles[j].name == "Tile_Empty") emptyIndex = j;
    }

    private void Shuffle(int steps)
    {
        for (int i = 0; i < steps; i++)
        {
            List<int> validMoves = new List<int>();
            int x = emptyIndex % 3, y = emptyIndex / 3;
            
            // Tìm các ô có thể hoán đổi với ô trống
            if (x > 0) validMoves.Add(emptyIndex - 1);
            if (x < 2) validMoves.Add(emptyIndex + 1);
            if (y > 0) validMoves.Add(emptyIndex - 3);
            if (y < 2) validMoves.Add(emptyIndex + 3);

            SwapTiles(emptyIndex, validMoves[Random.Range(0, validMoves.Count)]);
        }
    }

    private void CheckWin()
    {
        bool isWin = true;
        for (int i = 0; i < 8; i++)
        {
            // Kiểm tra xem tên viên gạch có kết thúc bằng con số đúng vị trí của nó không
            if (!tiles[i].name.EndsWith((i + 1).ToString()))
            {
                isWin = false;
                break;
            }
        }

        if (isWin)
        {
            if (textStatus != null) textStatus.text = "THE SEAL IS BROKEN!";
            
            for (int i = 0; i < 9; i++) 
            {
                Button btn = tiles[i].GetComponent<Button>();
                if (btn != null) btn.interactable = false;
            }
            StartCoroutine(WinRoutine());
        }
    }

    private IEnumerator WinRoutine()
    {
        yield return new WaitForSeconds(1.5f); 
        panelMain.SetActive(false);
        if (currentPuzzle3D != null) currentPuzzle3D.OnPuzzleSolvedLocal();
    }
}