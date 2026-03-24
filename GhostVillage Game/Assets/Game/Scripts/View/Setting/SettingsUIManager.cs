using UnityEngine;
using UnityEngine.UI;
using TMPro;
using VContainer;
using R3;
using Game.Domain.Settings.Controllers;
using System;

namespace Game.UI.Settings
{
    public class SettingsUIManager : MonoBehaviour
    {
        [Header("--- Main Tabs ---")]
        [SerializeField] private GameObject _modalPanel;
        [SerializeField] private Button _btnClose;
        [SerializeField] private Button _btnRestoreDefault;

        [Header("--- Tab Buttons ---")]
        [SerializeField] private Button _btnTabGraphic;
        [SerializeField] private Button _btnTabAudio;
        [SerializeField] private Button _btnTabGamePlay;

        [Header("--- Tab Contents ---")]
        [SerializeField] private GameObject _grpGraphic;
        [SerializeField] private GameObject _grpAudio;
        [SerializeField] private GameObject _grpGamePlay;

        [Header("--- GRAPHIC SETTINGS ---")]
        // Dropdown Quality Sếp nhớ tạo 3 Element ở Inspector: Low, Medium, High nhé!
        [SerializeField] private TMP_Dropdown _dropdownResolution;
        [SerializeField] private TMP_Dropdown _dropdownScreenMode;
        [SerializeField] private TMP_Dropdown _dropdownQuality;

        [Header("--- AUDIO SETTINGS ---")]
        [SerializeField] private Slider _sliderMaster;
        [SerializeField] private TMP_Text _txtMasterVal;
        [SerializeField] private Slider _sliderMusic;
        [SerializeField] private TMP_Text _txtMusicVal;
        [SerializeField] private Slider _sliderSFX;
        [SerializeField] private TMP_Text _txtSFXVal;

        [Header("--- GAMEPLAY SETTINGS ---")]
        [SerializeField] private Slider _sliderSensitivity;
        [SerializeField] private TMP_Text _txtSensitivityVal;

        [Header("--- KEYBINDING BUTTONS ---")]
        [SerializeField] private Button _btnRebindMoveUp;
        [SerializeField] private Button _btnRebindMoveDown;
        [SerializeField] private Button _btnRebindMoveLeft;
        [SerializeField] private Button _btnRebindMoveRight;
        [SerializeField] private Button _btnRebindSprint;

        [SerializeField] private Button _btnRebindUseItem;
        [SerializeField] private Button _btnRebindDropItem;
        [SerializeField] private Button _btnRebindInteract;

        [SerializeField] private Button _btnRebindSlot1;
        [SerializeField] private Button _btnRebindSlot2;
        [SerializeField] private Button _btnRebindSlot3;

        // Giao quyền tắt Panel cho GlobalUIManager để nó còn khóa chuột!
        public Action OnCloseRequested;

        private SettingsController _settingsController;
        private readonly CompositeDisposable _disposables = new();
        private bool _isInitialized = false;

        private void Start()
        {
            SetupTabButtons();

            // FIX KẸT CHUỘT: Tự mình không tắt nữa, hét lên cho sếp tổng tắt!
            _btnClose.onClick.AddListener(() => OnCloseRequested?.Invoke());

            SwitchTab(0);
        }

        public void Init(SettingsController controller)
        {
            if (_isInitialized) return;

            _settingsController = controller;

            if (_settingsController == null) return;

            _btnRestoreDefault.onClick.AddListener(() =>
            {
                _settingsController.RestoreDefault();
            });

            // Nghe lén sự kiện Restore để vẽ lại nút phím
            _settingsController.OnSettingsRestored += RefreshAllBindingTexts;

            BindGraphicsToR3();
            BindAudioToR3();
            BindGameplayToR3();
            SetupRebindButtons();

            _isInitialized = true;
        }

        private void OnDestroy()
        {
            if (_settingsController != null)
            {
                _settingsController.OnSettingsRestored -= RefreshAllBindingTexts;
            }
            _disposables.Dispose();
        }

        // ================== HỆ THỐNG ĐỔI PHÍM ==================
        private void SetupRebindButtons()
        {
            RefreshAllBindingTexts(); // Tách ra thành 1 hàm để dùng lại

            _btnRebindMoveUp.onClick.AddListener(() => StartRebindProcess(_btnRebindMoveUp, "Move", 1));
            _btnRebindMoveDown.onClick.AddListener(() => StartRebindProcess(_btnRebindMoveDown, "Move", 2));
            _btnRebindMoveLeft.onClick.AddListener(() => StartRebindProcess(_btnRebindMoveLeft, "Move", 3));
            _btnRebindMoveRight.onClick.AddListener(() => StartRebindProcess(_btnRebindMoveRight, "Move", 4));
            _btnRebindSprint.onClick.AddListener(() => StartRebindProcess(_btnRebindSprint, "Sprint", 0));

            _btnRebindInteract.onClick.AddListener(() => StartRebindProcess(_btnRebindInteract, "Interact", 0));
            _btnRebindUseItem.onClick.AddListener(() => StartRebindProcess(_btnRebindUseItem, "UseItem", 0));
            _btnRebindDropItem.onClick.AddListener(() => StartRebindProcess(_btnRebindDropItem, "DropItem", 0));

            _btnRebindSlot1.onClick.AddListener(() => StartRebindProcess(_btnRebindSlot1, "Item_Slot1", 0));
            _btnRebindSlot2.onClick.AddListener(() => StartRebindProcess(_btnRebindSlot2, "Item_Slot2", 0));
            _btnRebindSlot3.onClick.AddListener(() => StartRebindProcess(_btnRebindSlot3, "Item_Slot3", 0));
        }

        private void RefreshAllBindingTexts()
        {
            UpdateButtonText(_btnRebindMoveUp, "Move", 1);
            UpdateButtonText(_btnRebindMoveDown, "Move", 2);
            UpdateButtonText(_btnRebindMoveLeft, "Move", 3);
            UpdateButtonText(_btnRebindMoveRight, "Move", 4);
            UpdateButtonText(_btnRebindSprint, "Sprint", 0);

            UpdateButtonText(_btnRebindInteract, "Interact", 0);
            UpdateButtonText(_btnRebindUseItem, "UseItem", 0);
            UpdateButtonText(_btnRebindDropItem, "DropItem", 0);

            UpdateButtonText(_btnRebindSlot1, "Item_Slot1", 0);
            UpdateButtonText(_btnRebindSlot2, "Item_Slot2", 0);
            UpdateButtonText(_btnRebindSlot3, "Item_Slot3", 0);
        }

        private void UpdateButtonText(Button btn, string actionName, int bindingIndex)
        {
            if (btn == null) return;
            TMP_Text btnText = btn.GetComponentInChildren<TMP_Text>();
            if (btnText != null)
            {
                btnText.text = _settingsController.GetBindingName(actionName, bindingIndex);
            }
        }

        private void StartRebindProcess(Button btn, string actionName, int bindingIndex)
        {
            TMP_Text btnText = btn.GetComponentInChildren<TMP_Text>();
            if (btnText == null) return;

            btnText.text = "..."; // Chờ nhập phím
            _settingsController.StartRebind(actionName, bindingIndex, (newKeyName) =>
            {
                btnText.text = newKeyName;
            });
        }

        // ================== CHUYỂN TAB ==================
        private void SetupTabButtons()
        {
            _btnTabGraphic.onClick.AddListener(() => SwitchTab(0));
            _btnTabAudio.onClick.AddListener(() => SwitchTab(1));
            _btnTabGamePlay.onClick.AddListener(() => SwitchTab(2));
        }

        private void SwitchTab(int index)
        {
            _grpGraphic.SetActive(index == 0);
            _grpAudio.SetActive(index == 1);
            _grpGamePlay.SetActive(index == 2);
        }

        // ================== CÁP R3 ==================
        private void BindGraphicsToR3()
        {
            _settingsController.Is1080p.Subscribe(is1080 => _dropdownResolution.SetValueWithoutNotify(is1080 ? 0 : 1)).AddTo(_disposables);
            _settingsController.IsFullscreen.Subscribe(isFull => _dropdownScreenMode.SetValueWithoutNotify(isFull ? 0 : 1)).AddTo(_disposables);
            _settingsController.QualityPreset.Subscribe(val => _dropdownQuality.SetValueWithoutNotify(val)).AddTo(_disposables);

            _dropdownResolution.onValueChanged.AddListener(val => ApplyGraphics());
            _dropdownScreenMode.onValueChanged.AddListener(val => ApplyGraphics());
            _dropdownQuality.onValueChanged.AddListener(val => ApplyGraphics());
        }

        private void ApplyGraphics()
        {
            _settingsController.UpdateGraphics(_dropdownResolution.value == 0, _dropdownScreenMode.value == 0, _dropdownQuality.value);
        }

        private void BindAudioToR3()
        {
            _settingsController.MasterVolume.Subscribe(v => { _sliderMaster.SetValueWithoutNotify(v); if (_txtMasterVal) _txtMasterVal.text = $"{(int)(v * 100)}%"; }).AddTo(_disposables);
            _settingsController.MusicVolume.Subscribe(v => { _sliderMusic.SetValueWithoutNotify(v); if (_txtMusicVal) _txtMusicVal.text = $"{(int)(v * 100)}%"; }).AddTo(_disposables);
            _settingsController.SFXVolume.Subscribe(v => { _sliderSFX.SetValueWithoutNotify(v); if (_txtSFXVal) _txtSFXVal.text = $"{(int)(v * 100)}%"; }).AddTo(_disposables);

            _sliderMaster.onValueChanged.AddListener(val => ApplyAudio());
            _sliderMusic.onValueChanged.AddListener(val => ApplyAudio());
            _sliderSFX.onValueChanged.AddListener(val => ApplyAudio());
        }

        private void ApplyAudio()
        {
            _settingsController.UpdateAudio(_sliderMaster.value, _sliderSFX.value, _sliderMusic.value);
            if (_txtMasterVal) _txtMasterVal.text = $"{(int)(_sliderMaster.value * 100)}%";
            if (_txtMusicVal) _txtMusicVal.text = $"{(int)(_sliderMusic.value * 100)}%";
            if (_txtSFXVal) _txtSFXVal.text = $"{(int)(_sliderSFX.value * 100)}%";
        }

        private void BindGameplayToR3()
        {
            _settingsController.MouseSensitivity.Subscribe(v =>
            {
                _sliderSensitivity.SetValueWithoutNotify(v);
                if (_txtSensitivityVal) _txtSensitivityVal.text = v.ToString("F1"); // Hiện 1 số thập phân
            }).AddTo(_disposables);

            _sliderSensitivity.onValueChanged.AddListener(val =>
            {
                _settingsController.UpdateGameplay(val);
                if (_txtSensitivityVal) _txtSensitivityVal.text = val.ToString("F1");
            });
        }

        public void ShowSettings(bool isShow)
        {
            _modalPanel.SetActive(isShow);
        }
    }
}