using UnityEngine;

[DisallowMultipleComponent]
public class ChickenCandidateInteractable : Interactable
{
    private ChickenHuntPuzzle _owner;
    private int _candidateIndex = -1;
    private bool _isRealChicken;

    [Header("Audio")]
    [SerializeField] private AudioSource chickenAudioSource;
    [SerializeField] private AudioClip fakeChickenCry;
    [SerializeField] [Range(0f, 1f)] private float fakeChickenCryVolume = 1f;

    public bool IsRealChicken => _isRealChicken;
    public int CandidateIndex => _candidateIndex;

    public void Setup(ChickenHuntPuzzle owner, int index, bool isReal)
    {
        _owner = owner;
        _candidateIndex = index;
        _isRealChicken = isReal;
    }

    public override void Interact(GameObject actor)
    {
        Debug.Log($"[ChickenCandidate] Interact called! Actor: {actor.name}, IsReal: {_isRealChicken}");
        
        if (_owner == null)
        {
            Debug.LogWarning("[ChickenCandidate] Owner puzzle is missing.");
            return;
        }

        Debug.Log($"[ChickenCandidate] Calling OnCandidateInteracted on owner {_owner.gameObject.name}");
        _owner.OnCandidateInteracted(this, actor);
    }

    public override string GetPromptMessage()
    {
        if (_owner == null)
        {
            return base.GetPromptMessage();
        }

        return _owner.GetCandidatePrompt(this);
    }

    public void PlayFakeChickenCry()
    {
        if (_isRealChicken || fakeChickenCry == null) return;

        AudioSource source = chickenAudioSource != null ? chickenAudioSource : GetComponent<AudioSource>();
        if (source != null)
        {
            source.PlayOneShot(fakeChickenCry, fakeChickenCryVolume);
            return;
        }

        AudioSource.PlayClipAtPoint(fakeChickenCry, transform.position, fakeChickenCryVolume);
    }
}
