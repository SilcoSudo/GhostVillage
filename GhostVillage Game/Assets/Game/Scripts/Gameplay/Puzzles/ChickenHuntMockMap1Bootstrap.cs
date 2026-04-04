using System.Collections.Generic;
using System.Reflection;
using Photon.Pun;
using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>
/// Auto-spawn a Chicken Hunt puzzle in Map_1 for testing.
/// Creates a proper scene object with PhotonView, BoxCollider, and chicken candidates.
/// Real chicken uses chicken_rig.glb model, fake chickens = Cube.
/// </summary>
public static class ChickenHuntMockMap1Bootstrap
{
    private const string TargetSceneName = "Map_1";
    private const string RootName = "ChickenHuntPuzzle";
    private const string RealChickenPrefabPath = "KeyItem_Chicken_World"; // Direct path in Assets/Resources/

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
    private static void RegisterSceneHook()
    {
        SceneManager.sceneLoaded -= OnSceneLoaded;
        SceneManager.sceneLoaded += OnSceneLoaded;
    }

    private static void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        if (!scene.IsValid() || scene.name != TargetSceneName) return;
        SpawnMockPuzzleInMap1(scene);
    }

    private static void SpawnMockPuzzleInMap1(Scene loadedScene)
    {
        if (!loadedScene.IsValid() || loadedScene.name != TargetSceneName) return;

        ChickenHuntPuzzle existingPuzzle = Object.FindObjectOfType<ChickenHuntPuzzle>();
        if (existingPuzzle != null)
        {
            int existingCandidateCount = existingPuzzle.GetComponentsInChildren<ChickenCandidateInteractable>(true).Length;
            if (existingCandidateCount > 0)
            {
                Debug.Log("[ChickenHuntMock] Existing ChickenHuntPuzzle with candidates found in scene. Skip spawn.");
                return;
            }

            Debug.LogWarning("[ChickenHuntMock] Existing ChickenHuntPuzzle has no candidates. Rebuilding candidates.");
        }

        // --- Find 3 chicken coop spawn points ---
        GameObject[] coops = GameObject.FindGameObjectsWithTag("SP_ChickenCoop");
        Vector3 spawnPos;

        if (coops == null || coops.Length == 0)
        {
            Debug.LogWarning("[ChickenHuntMock] No SP_ChickenCoop objects found. Using fallback position.");
            spawnPos = new Vector3(15f, 0.75f, 15f); // Fallback position
        }
        else
        {
            // --- Random pick one coop ---
            GameObject selectedCoop = coops[Random.Range(0, coops.Length)];
            spawnPos = selectedCoop.transform.position;
            Debug.Log($"[ChickenHuntMock] Randomly selected coop: {selectedCoop.name} at position {spawnPos}");
        }

        // --- Create Root Object ---
        GameObject root;
        if (existingPuzzle != null)
        {
            root = existingPuzzle.gameObject;
            root.transform.position = spawnPos;

            for (int i = root.transform.childCount - 1; i >= 0; i--)
            {
                Object.Destroy(root.transform.GetChild(i).gameObject);
            }
        }
        else
        {
            root = new GameObject(RootName);
            root.transform.position = spawnPos;
        }

        ChickenHuntPuzzle puzzle = existingPuzzle != null ? existingPuzzle : root.AddComponent<ChickenHuntPuzzle>();

        // --- Add PhotonView (following pattern of Puzzle_Box_1/2) ---
        PhotonView photonView = root.GetComponent<PhotonView>();
        if (photonView == null)
        {
            photonView = root.AddComponent<PhotonView>();
            photonView.ViewID = 0; // Will be assigned by Photon if networked
            photonView.Synchronization = ViewSynchronization.Unreliable;
        }

        // --- Add BoxCollider (trigger) for puzzle interaction ---
        BoxCollider boxCollider = root.GetComponent<BoxCollider>();
        if (boxCollider == null)
        {
            boxCollider = root.AddComponent<BoxCollider>();
        }
        boxCollider.isTrigger = true;
        boxCollider.size = new Vector3(4f, 1.5f, 4f);

        // --- Create Chicken Candidates ---
        const int candidateCount = 5;
        const int realSlotIndex = 2;
        const float radius = 2f;
        var runtimeCandidates = new List<ChickenCandidateInteractable>(candidateCount);
        int runtimeRealIndex = -1;

        // Try to load real chicken prefab
        GameObject realChickenPrefab = TryLoadRealChickenPrefab();

        for (int i = 0; i < candidateCount; i++)
        {
            bool isReal = i == realSlotIndex;
            GameObject chicken;

            if (isReal && realChickenPrefab != null)
            {
                // Instantiate real chicken from prefab
                chicken = Object.Instantiate(realChickenPrefab);
                chicken.name = "Chicken_REAL";
            }
            else if (isReal)
            {
                // Fallback: use sphere for real chicken if prefab not found
                chicken = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                chicken.name = "Chicken_REAL";
            }
            else
            {
                // Fake chickens = cube
                chicken = GameObject.CreatePrimitive(PrimitiveType.Cube);
                chicken.name = $"Chicken_FAKE_{i}";
            }

            chicken.transform.SetParent(root.transform, true);

            float angle = (Mathf.PI * 2f * i) / candidateCount;
            Vector3 localPos = new Vector3(Mathf.Cos(angle) * radius, 0.9f, Mathf.Sin(angle) * radius);
            chicken.transform.localPosition = localPos;
            chicken.transform.localScale = isReal ? Vector3.one * 1.2f : Vector3.one * 1f; // Scaled up from 0.8/0.7

            Collider rootCollider = EnsureChickenPhysics(chicken, isReal);
            EnsureChickenVisuals(chicken, isReal, rootCollider);

            // Reuse existing component from prefab if available, otherwise add one.
            var candidate = chicken.GetComponent<ChickenCandidateInteractable>();
            if (candidate == null)
            {
                candidate = chicken.AddComponent<ChickenCandidateInteractable>();
            }

            if (candidate != null)
            {
                if (isReal)
                {
                    runtimeRealIndex = runtimeCandidates.Count;
                }

                runtimeCandidates.Add(candidate);
            }
            else
            {
                Debug.LogWarning($"[ChickenHuntMock] Failed to create candidate component for {chicken.name}. Skipping interactable setup.");
            }

            // Set color (only for primitives, real model keeps its original color)
            if (!isReal || realChickenPrefab == null)
            {
                Renderer renderer = chicken.GetComponent<Renderer>();
                if (renderer != null)
                {
                    renderer.material.color = isReal
                        ? new Color(1f, 0.75f, 0.2f, 1f)
                        : new Color(0.85f, 0.85f, 0.85f, 1f);
                }
            }

            Debug.Log($"[ChickenHuntMock] Created {chicken.name} at local pos {localPos}, scale {chicken.transform.localScale}");
        }

        if (runtimeCandidates.Count == 0)
        {
            Debug.LogError("[ChickenHuntMock] No valid chicken candidates were created. Puzzle will not be initialized.");
            return;
        }

        if (runtimeRealIndex < 0)
        {
            runtimeRealIndex = 0;
            Debug.LogWarning("[ChickenHuntMock] Real chicken index fallback to 0 because the intended real candidate was unavailable.");
        }

        puzzle.ConfigureCandidates(runtimeCandidates, runtimeRealIndex);

        // Load and assign KeyItemReward to the puzzle
        AssignKeyItemRewardToPuzzle(puzzle);

        Debug.Log($"[ChickenHuntMock] Spawned ChickenHuntPuzzle at {root.transform.position} (5 chickens: 4 fake cubes + 1 real).");
    }

    private static GameObject TryLoadRealChickenPrefab()
    {
        // Try load from Resources
        GameObject prefab = Resources.Load<GameObject>(RealChickenPrefabPath);
        if (prefab != null)
        {
            Debug.Log($"[ChickenHuntMock]  Loaded real chicken prefab: {RealChickenPrefabPath}");
            return prefab;
        }

        Debug.LogWarning($"[ChickenHuntMock]  Real chicken prefab not found at {RealChickenPrefabPath}. Will use sphere fallback.");
        return null;
    }

    private static Collider EnsureChickenPhysics(GameObject chicken, bool isReal)
    {
        if (chicken == null) return null;

        // PlayerInteract raycasts against collider and reads IInteractable on hit object,
        // so each chicken candidate needs a collider on the same root object.
        Collider rootCollider = chicken.GetComponent<Collider>();
        if (rootCollider == null)
        {
            CapsuleCollider capsule = chicken.AddComponent<CapsuleCollider>();
            capsule.radius = isReal ? 0.45f : 0.35f;
            capsule.height = isReal ? 1.0f : 0.8f;
            capsule.center = new Vector3(0f, capsule.height * 0.5f, 0f);
            rootCollider = capsule;
        }

        if (rootCollider != null)
        {
            rootCollider.isTrigger = false;
        }

        Rigidbody rb = chicken.GetComponent<Rigidbody>();
        if (rb == null)
        {
            rb = chicken.AddComponent<Rigidbody>();
        }

        rb.mass = isReal ? 1.2f : 1f;
        rb.linearDamping = 2f;
        rb.angularDamping = 8f;
        rb.useGravity = true;
        rb.isKinematic = false;
        rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationZ;

        return rootCollider;
    }

    private static void EnsureChickenVisuals(GameObject chicken, bool isReal, Collider rootCollider)
    {
        if (chicken == null) return;

        chicken.SetActive(true);

        int interactableLayer = LayerMask.NameToLayer("Interactable");
        if (interactableLayer < 0)
        {
            interactableLayer = 0;
            Debug.LogWarning("[ChickenHuntMock] Layer 'Interactable' not found. Falling back to Default layer.");
        }

        SetLayerRecursively(chicken.transform, interactableLayer);

        // Ensure raycast hits the root collider that has ChickenCandidateInteractable.
        Collider[] allColliders = chicken.GetComponentsInChildren<Collider>(true);
        for (int i = 0; i < allColliders.Length; i++)
        {
            Collider col = allColliders[i];
            if (col == null || col == rootCollider) continue;
            col.enabled = false;
        }

        Renderer[] renderers = chicken.GetComponentsInChildren<Renderer>(true);
        for (int i = 0; i < renderers.Length; i++)
        {
            if (renderers[i] == null) continue;
            renderers[i].enabled = true;
            if (renderers[i].gameObject.layer != interactableLayer)
            {
                renderers[i].gameObject.layer = interactableLayer;
            }
        }

        // Safety fallback: if model has no renderer, attach a visible marker.
        if (renderers.Length == 0)
        {
            GameObject marker = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            marker.name = isReal ? "Chicken_RenderFallback_REAL" : "Chicken_RenderFallback_FAKE";
            marker.transform.SetParent(chicken.transform, false);
            marker.transform.localPosition = new Vector3(0f, 0.6f, 0f);
            marker.transform.localScale = isReal ? Vector3.one * 0.9f : Vector3.one * 0.7f;

            Renderer markerRenderer = marker.GetComponent<Renderer>();
            if (markerRenderer != null)
            {
                markerRenderer.material.color = isReal
                    ? new Color(1f, 0.75f, 0.2f, 1f)
                    : new Color(0.85f, 0.85f, 0.85f, 1f);
            }

            Collider markerCollider = marker.GetComponent<Collider>();
            if (markerCollider != null)
            {
                Object.Destroy(markerCollider);
            }
        }
    }

    private static void SetLayerRecursively(Transform root, int layer)
    {
        if (root == null) return;

        root.gameObject.layer = layer;
        for (int i = 0; i < root.childCount; i++)
        {
            SetLayerRecursively(root.GetChild(i), layer);
        }
    }

    private static void AssignKeyItemRewardToPuzzle(ChickenHuntPuzzle puzzle)
    {
        if (puzzle == null) return;

        // Load KeyItemChicken (preferred) or fallback to KeyItem_Thread
        KeyItemSO reward = Resources.Load<KeyItemSO>("KeyItems/KeyItemChicken");
        if (reward == null)
        {
            reward = Resources.Load<KeyItemSO>("KeyItems/KeyItem_Thread");
        }
        
        if (reward != null && reward.itemIcon != null)
        {
            // Use reflection to set the private field
            var field = typeof(ChickenHuntPuzzle).GetField("keyItemReward", 
                BindingFlags.NonPublic | BindingFlags.Instance);
            if (field != null)
            {
                field.SetValue(puzzle, reward);
                Debug.Log($"[ChickenHuntMock]  Assigned KeyItem reward to puzzle: {reward.itemName} (icon: {reward.itemIcon.name})");
            }
        }
        else
        {
            Debug.LogWarning("[ChickenHuntMock] ⚠️ KeyItem reward not assigned. Puzzle will use fallback. Reward: " + 
                (reward != null ? $"{reward.itemName} (icon: {(reward.itemIcon != null ? reward.itemIcon.name : "NULL")})" : "NULL"));
        }
    }
}
