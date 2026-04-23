using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.InputSystem; // Cần thiết cho phím tắt

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

    // [CẬP NHẬT]: Thêm phím tắt để thoát nhanh
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
            int index = i; 
            Button btn = tiles[i].GetComponent<Button>();
            if (btn != null)
            {
                btn.onClick.RemoveAllListeners();
                btn.onClick.AddListener(() => OnTileClick(tiles[index]));
            }
            if (tiles[i].name == "Tile_Empty") emptyIndex = i;
        }
    }

    private void OnTileClick(Transform clickedTile)
    {
        int clickedIndex = -1;
        for (int i = 0; i < 9; i++) if (tiles[i] == clickedTile) clickedIndex = i;

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
        Transform temp = tiles[i];
        tiles[i] = tiles[j];
        tiles[j] = temp;

        for (int k = 0; k < 9; k++) tiles[k].SetSiblingIndex(k);

        if (tiles[i].name == "Tile_Empty") emptyIndex = i;
        if (tiles[j].name == "Tile_Empty") emptyIndex = j;
    }

    private void Shuffle(int steps)
    {
        for (int i = 0; i < steps; i++)
        {
            List<int> validMoves = new List<int>();
            int x = emptyIndex % 3, y = emptyIndex / 3;
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
            if (!tiles[i].name.EndsWith((i + 1).ToString()))
            {
                isWin = false;
                break;
            }
        }

        if (isWin)
        {
            // [CẬP NHẬT]: Thông báo thắng đậm chất kinh dị
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