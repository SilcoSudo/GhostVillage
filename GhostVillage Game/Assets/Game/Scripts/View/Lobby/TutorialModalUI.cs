using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;
using System;

namespace Game.Scripts.UI.Lobby
{
    // ĐÓNG GÓI DỮ LIỆU SLIDE HƯỚNG DẪN ĐỂ CHỈNH TRÊN INSPECTOR
    [Serializable]
    public class TutorialSlide
    {
        public string Title;
        [TextArea(3, 5)] public string Description;
        public Sprite Image;
    }

    public class TutorialModalUI : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Image _imgTutorialPic;
        [SerializeField] private TextMeshProUGUI _txtTutorialTitle;
        [SerializeField] private TextMeshProUGUI _txtTutorialDesc;
        [SerializeField] private Button _btnNext;
        [SerializeField] private Button _btnPrev;

        // Expose nút Close ra để LobbyUIManager bắt sự kiện tắt + khóa chuột
        public Button BtnClose => _btnClose;
        [SerializeField] private Button _btnClose;

        [Header("Data")]
        [SerializeField] private List<TutorialSlide> _slides = new List<TutorialSlide>();

        private int _currentIndex = 0;

        private void Awake()
        {
            if (_btnNext) _btnNext.onClick.AddListener(NextSlide);
            if (_btnPrev) _btnPrev.onClick.AddListener(PrevSlide);

            gameObject.SetActive(false); // Băng dính dán mỏ lúc mới vào game
        }

        public void OpenModal()
        {
            gameObject.SetActive(true);
            _currentIndex = 0; // Mở lên là xem lại từ trang đầu
            UpdateUI();
        }

        public void CloseModal()
        {
            gameObject.SetActive(false);
        }

        private void NextSlide()
        {
            if (_slides == null || _slides.Count == 0) return;
            _currentIndex = (_currentIndex + 1) % _slides.Count; // Hết thì quay lại trang 1
            UpdateUI();
        }

        private void PrevSlide()
        {
            if (_slides == null || _slides.Count == 0) return;
            _currentIndex--;
            if (_currentIndex < 0) _currentIndex = _slides.Count - 1; // Lùi quá thì về trang cuối
            UpdateUI();
        }

        private void UpdateUI()
        {
            if (_slides == null || _slides.Count == 0) return;

            var slide = _slides[_currentIndex];

            if (_txtTutorialTitle) _txtTutorialTitle.text = slide.Title;
            if (_txtTutorialDesc) _txtTutorialDesc.text = slide.Description;
            if (_imgTutorialPic)
            {
                _imgTutorialPic.sprite = slide.Image;
                // Nếu trang nào không có ảnh thì nó tự tắt cái khung ảnh đi
                _imgTutorialPic.gameObject.SetActive(slide.Image != null);
            }
        }
    }
}