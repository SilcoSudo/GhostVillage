using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;
using Game.Domain.Perk.DTOs;

namespace Game.Scripts.UI.Lobby
{
    public class PerkSlotItemUI : MonoBehaviour
    {
        [Header("--- UI REFERENCES ---")]
        [SerializeField] private Image _imgBG;
        [SerializeField] private Image _imgIcon;
        [SerializeField] private TextMeshProUGUI _txtName;
        [SerializeField] private GameObject _objEquippedIndicator;
        [SerializeField] private Button _btnClick;

        [Header("--- COLORS ---")]
        [SerializeField] private Color _normalColor = Color.white; // Sáng
        [SerializeField] private Color _selectedColor = new Color(0.6f, 0.6f, 0.6f, 1f); // Tối đi khi chọn

        private PerkDetailDTO _myPerkData;

        public void Setup(PerkDetailDTO perkData, bool isEquipped, Sprite icon, Action<PerkDetailDTO> onClick)
        {
            _myPerkData = perkData;

            if (_imgIcon != null && icon != null)
            {
                _imgIcon.sprite = icon;
                _imgIcon.gameObject.SetActive(true);
            }

            if (_txtName != null) _txtName.text = perkData.perkName;

            if (_objEquippedIndicator != null) _objEquippedIndicator.SetActive(isEquipped);

            if (_btnClick != null)
            {
                _btnClick.onClick.RemoveAllListeners();
                _btnClick.onClick.AddListener(() => onClick?.Invoke(perkData));
            }
        }

        // ĐỔI MÀU NỀN
        public void SetSelectedVisual(bool isSelected)
        {
            if (_imgBG != null)
            {
                _imgBG.color = isSelected ? _selectedColor : _normalColor;
            }
        }

        public string GetPerkId() => _myPerkData?.perkId;
    }
}