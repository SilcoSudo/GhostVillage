using UnityEngine;
using UnityEngine.UI;
using TMPro;
using VContainer;
using R3;
using Game.Domain.Settings.Controllers;

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
        [SerializeField] private TMP_Dropdown _dropdownLanguage;
        [SerializeField] private Slider _sliderSensitivity;
        [SerializeField] private TMP_Text _txtSensitivityVal;

        [Header("--- KEYBINDING BUTTONS ---")]
        [Header("--- KEYBINDING BUTTONS ---")]
        // Nhóm Di chuyển
        [SerializeField] private Button _btnRebindMoveUp;
        [SerializeField] private Button _btnRebindMoveDown;
        [SerializeField] private Button _btnRebindMoveLeft;
        [SerializeField] private Button _btnRebindMoveRight;
        [SerializeField] private Button _btnRebindSprint;
        // Nhóm Hành động
        [SerializeField] private Button _btnRebindUseItem; // F - Ánh xạ vào Action "Interact" (Dựa theo ảnh UI, nút Use Item và Interact đều là phím F)
        [SerializeField] private Button _btnRebindDropItem; // Q - Ánh xạ vào Action nào? (Trong danh sách Action không thấy Drop, giả sử bạn sẽ thêm Action "Drop")
        [SerializeField] private Button _btnRebindInteract; // Dư thừa vì UseItem đã xài phím F? Nếu có Action "Interact" riêng thì để. Dựa theo UI, "Interact" và "Use Item" có vẻ bị trùng. Sẽ map vào Action "Interact".
        // Nhóm Túi đồ
        [SerializeField] private Button _btnRebindSlot1; // 1 - Ánh xạ vào Action nào? (Trong danh sách Action không thấy Slot1)
        [SerializeField] private Button _btnRebindSlot2; // 2
        [SerializeField] private Button _btnRebindSlot3; // 3
        // Nhóm Hệ thống
        [SerializeField] private Button _btnRebindChat; // Enter - Ánh xạ vào Action nào?
        [SerializeField] private Button _btnRebindEscTab; // Esc - Ánh xạ vào Action "EscapeTab"
        [SerializeField] private Button _btnRebindReadyUp; // R - Ánh xạ vào Action nào?


        private SettingsController _settingsController;
        private readonly CompositeDisposable _disposables = new();
        private bool _isInitialized = false;

        private void Start()
        {
            SetupTabButtons();
            _btnClose.onClick.AddListener(() => _modalPanel.SetActive(false));
            SwitchTab(0);
        }

        public void Init(SettingsController controller)
        {
            if (_isInitialized) return;

            _settingsController = controller;

            if (_settingsController == null)
            {
                Debug.LogError("[SettingsUIManager] LỖI: Nhận SettingsController NULL!");
                return;
            }

            _btnRestoreDefault.onClick.AddListener(() =>
            {
                _settingsController.RestoreDefault();
            });

            BindGraphicsToR3();
            BindAudioToR3();
            SetupRebindButtons(); // THÊM DÒNG NÀY

            _isInitialized = true;
            Debug.Log("[SettingsUIManager] Đã khởi tạo và Bind R3 thành công.");
        }

        // ================== HỆ THỐNG ĐỔI PHÍM (INPUT REBINDING) ==================
        private void SetupRebindButtons()
        {
            // 1. Nhóm di chuyển (Composite WASD - Tên action là "Move")
            // Trong Input System, Composite "Move" thường có các index: 1=Up, 2=Down, 3=Left, 4=Right
            BindRebindButton(_btnRebindMoveUp, "Move", 1);
            BindRebindButton(_btnRebindMoveDown, "Move", 2);
            BindRebindButton(_btnRebindMoveLeft, "Move", 3);
            BindRebindButton(_btnRebindMoveRight, "Move", 4);

            BindRebindButton(_btnRebindSprint, "Sprint", 0);

            // 2. Nhóm Hành động
            BindRebindButton(_btnRebindInteract, "Interact", 0);
            BindRebindButton(_btnRebindUseItem, "UseItem", 0);
            BindRebindButton(_btnRebindDropItem, "DropItem", 0);

            // 3. Nhóm túi đồ
            BindRebindButton(_btnRebindSlot1, "Item_Slot1", 0);
            BindRebindButton(_btnRebindSlot2, "Item_Slot2", 0);
            BindRebindButton(_btnRebindSlot3, "Item_Slot3", 0);

            // 4. Nhóm Hệ thống
            BindRebindButton(_btnRebindChat, "Chat", 0);
            BindRebindButton(_btnRebindReadyUp, "ReadyUp", 0);
            BindRebindButton(_btnRebindEscTab, "Esc_Tab", 0);
        }

        private void BindRebindButton(Button btn, string actionName, int bindingIndex)
        {
            if (btn == null) return;

            TMP_Text btnText = btn.GetComponentInChildren<TMP_Text>();
            if (btnText == null) return;

            // Hiển thị chữ lúc mới bật lên
            btnText.text = _settingsController.GetBindingName(actionName, bindingIndex);

            btn.onClick.AddListener(() =>
            {
                btnText.text = "..."; // Hiển thị trạng thái đang chờ nhập phím

                _settingsController.StartRebind(actionName, bindingIndex, (newKeyName) =>
                {
                    btnText.text = newKeyName; // Cập nhật tên phím mới sau khi bấm xong
                });
            });
        }

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

        // ================== GRAPHICS BINDING ==================
        private void BindGraphicsToR3()
        {
            if (_dropdownResolution == null || _dropdownScreenMode == null || _dropdownQuality == null)
            {
                Debug.LogError("❌ LỖI: Bỏ sót Dropdown trong Graphics!");
                return;
            }

            // Dùng SetValueWithoutNotify để tránh vòng lặp
            _settingsController.Is1080p.Subscribe(is1080 => _dropdownResolution.SetValueWithoutNotify(is1080 ? 0 : 1)).AddTo(_disposables);
            _settingsController.IsFullscreen.Subscribe(isFull => _dropdownScreenMode.SetValueWithoutNotify(isFull ? 0 : 1)).AddTo(_disposables);
            _settingsController.QualityPreset.Subscribe(val => _dropdownQuality.SetValueWithoutNotify(val)).AddTo(_disposables);

            _dropdownResolution.onValueChanged.AddListener(val => ApplyGraphics());
            _dropdownScreenMode.onValueChanged.AddListener(val => ApplyGraphics());
            _dropdownQuality.onValueChanged.AddListener(val => ApplyGraphics());
        }

        private void ApplyGraphics()
        {
            bool is1080 = _dropdownResolution.value == 0;
            bool isFull = _dropdownScreenMode.value == 0;
            int quality = _dropdownQuality.value;
            _settingsController.UpdateGraphics(is1080, isFull, quality);
        }

        // ================== AUDIO BINDING ==================
        private void BindAudioToR3()
        {
            if (_sliderMaster == null || _sliderMusic == null || _sliderSFX == null)
            {
                Debug.LogError("❌ LỖI: Bỏ sót Slider trong Audio!");
                return;
            }

            // Dùng SetValueWithoutNotify để tránh vòng lặp
            _settingsController.MasterVolume.Subscribe(v =>
            {
                _sliderMaster.SetValueWithoutNotify(v);
                if (_txtMasterVal != null) _txtMasterVal.text = $"{(int)(v * 100)}%";
            }).AddTo(_disposables);

            _settingsController.MusicVolume.Subscribe(v =>
            {
                _sliderMusic.SetValueWithoutNotify(v);
                if (_txtMusicVal != null) _txtMusicVal.text = $"{(int)(v * 100)}%";
            }).AddTo(_disposables);

            _settingsController.SFXVolume.Subscribe(v =>
            {
                _sliderSFX.SetValueWithoutNotify(v);
                if (_txtSFXVal != null) _txtSFXVal.text = $"{(int)(v * 100)}%";
            }).AddTo(_disposables);

            _sliderMaster.onValueChanged.AddListener(val => ApplyAudio());
            _sliderMusic.onValueChanged.AddListener(val => ApplyAudio());
            _sliderSFX.onValueChanged.AddListener(val => ApplyAudio());
        }

        private void ApplyAudio()
        {
            _settingsController.UpdateAudio(_sliderMaster.value, _sliderSFX.value, _sliderMusic.value);

            // Cập nhật lại UI Text ngay khi kéo
            if (_txtMasterVal != null) _txtMasterVal.text = $"{(int)(_sliderMaster.value * 100)}%";
            if (_txtMusicVal != null) _txtMusicVal.text = $"{(int)(_sliderMusic.value * 100)}%";
            if (_txtSFXVal != null) _txtSFXVal.text = $"{(int)(_sliderSFX.value * 100)}%";
        }

        private void OnDestroy()
        {
            _disposables.Dispose();
        }

        public void ShowSettings(bool isShow)
        {
            _modalPanel.SetActive(isShow);
        }
    }
}