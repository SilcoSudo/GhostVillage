using TMPro;
using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections.Generic;

namespace Game.UI.Login
{
    /// <summary>
    /// UI Panel for completing user profile (Date of Birth)
    /// Desktop Calendar Date Picker
    /// </summary>
    public class ProfileCompletionUI : MonoBehaviour
    {
        [Header("Calendar UI References")]
        [SerializeField] private TextMeshProUGUI _monthYearText;      // Display current month/year
        [SerializeField] private Button _prevMonthButton;             // Previous month
        [SerializeField] private Button _nextMonthButton;             // Next month
        [SerializeField] private Transform _dayButtonsContainer;      // Container for day buttons (Grid Layout)
        [SerializeField] private Button _dayButtonPrefab;             // Day button prefab
        [SerializeField] private TextMeshProUGUI _selectedDateText;   // Show selected date
        
        [Header("Action Buttons")]
        [SerializeField] private Button _submitButton;
        [SerializeField] private Button _backButton;
        [SerializeField] private TextMeshProUGUI _statusText;
        [SerializeField] private TextMeshProUGUI _titleText;

        private ProfileCompletionController _controller;
        private LoginUIManager _loginUI;

        private DateTime _currentMonth;  // Current viewing month
        private DateTime _selectedDate;  // Selected date
        private Button[] _dayButtons;    // Pool of day buttons
        private const int DAYS_IN_GRID = 42; // 6 weeks * 7 days

        public void Initialize(ProfileCompletionController controller, LoginUIManager loginUI = null)
        {
            _controller = controller;
            _loginUI = loginUI;

            // Initialize calendar to current date or 13 years ago
            _currentMonth = DateTime.Now.AddYears(-13);
            _selectedDate = _currentMonth;

            // Setup button listeners
            if (_submitButton != null)
                _submitButton.onClick.AddListener(OnSubmitClicked);

            if (_backButton != null)
                _backButton.onClick.AddListener(OnBackClicked);

            if (_prevMonthButton != null)
                _prevMonthButton.onClick.AddListener(OnPrevMonth);

            if (_nextMonthButton != null)
                _nextMonthButton.onClick.AddListener(OnNextMonth);

            // Create day buttons pool
            CreateDayButtonsPool();
            
            // Draw calendar
            UpdateCalendar();

            if (_titleText != null)
                _titleText.text = "Select Your Date of Birth";

            if (_statusText != null)
                _statusText.text = "Click a date to select";

            SetInteractable(true);
        }

        /// <summary>
        /// Create pool of day buttons for calendar
        /// </summary>
        private void CreateDayButtonsPool()
        {
            if (_dayButtonPrefab == null || _dayButtonsContainer == null)
            {
                Debug.LogError("[ProfileCompletionUI] Day button prefab or container not assigned!");
                return;
            }

            _dayButtons = new Button[DAYS_IN_GRID];

            for (int i = 0; i < DAYS_IN_GRID; i++)
            {
                Button btn = Instantiate(_dayButtonPrefab, _dayButtonsContainer);
                btn.name = $"DayButton_{i}";
                int dayIndex = i; // Capture for closure
                btn.onClick.AddListener(() => OnDayClicked(dayIndex));
                _dayButtons[i] = btn;
            }
        }

        /// <summary>
        /// Update calendar display
        /// </summary>
        private void UpdateCalendar()
        {
            // Update month/year text
            if (_monthYearText != null)
                _monthYearText.text = _currentMonth.ToString("MMMM yyyy");

            // Get first day of month and number of days
            DateTime firstDay = new DateTime(_currentMonth.Year, _currentMonth.Month, 1);
            int daysInMonth = DateTime.DaysInMonth(_currentMonth.Year, _currentMonth.Month);
            int firstDayOfWeek = (int)firstDay.DayOfWeek; // 0 = Sunday

            // Clear all buttons first
            foreach (var btn in _dayButtons)
            {
                btn.gameObject.SetActive(false);
                btn.interactable = true;
            }

            // Draw day numbers
            for (int day = 1; day <= daysInMonth; day++)
            {
                int buttonIndex = firstDayOfWeek + day - 1;
                if (buttonIndex < DAYS_IN_GRID)
                {
                    Button btn = _dayButtons[buttonIndex];
                    btn.gameObject.SetActive(true);
                    btn.GetComponentInChildren<TextMeshProUGUI>().text = day.ToString();

                    // Check if this is today or selected date
                    DateTime btnDate = new DateTime(_currentMonth.Year, _currentMonth.Month, day);
                    if (btnDate == _selectedDate.Date)
                    {
                        btn.image.color = new Color(0.2f, 0.7f, 1f, 1f); // Blue highlight
                    }
                    else
                    {
                        btn.image.color = Color.white;
                    }
                }
            }

            // Update selected date display
            UpdateDateDisplay();
        }

        /// <summary>
        /// Update selected date text
        /// </summary>
        private void UpdateDateDisplay()
        {
            if (_selectedDateText != null)
            {
                string dateStr = _selectedDate.ToString("dddd, d MMMM yyyy");
                int age = CalculateAge(_selectedDate);
                _selectedDateText.text = $"{dateStr} (Age: {age})";

                // Color code by age
                if (age < 13)
                {
                    _selectedDateText.color = new Color(1f, 0.3f, 0.3f); // Red warning
                }
                else
                {
                    _selectedDateText.color = new Color(0.3f, 1f, 0.3f); // Green OK
                }
            }
        }

        /// <summary>
        /// Calculate age from date of birth
        /// </summary>
        private int CalculateAge(DateTime dateOfBirth)
        {
            int age = DateTime.Now.Year - dateOfBirth.Year;
            if (DateTime.Now.Month < dateOfBirth.Month || 
                (DateTime.Now.Month == dateOfBirth.Month && DateTime.Now.Day < dateOfBirth.Day))
            {
                age--;
            }
            return age;
        }

        /// <summary>
        /// Handle day button click
        /// </summary>
        private void OnDayClicked(int buttonIndex)
        {
            // Calculate which date was clicked
            DateTime firstDay = new DateTime(_currentMonth.Year, _currentMonth.Month, 1);
            int firstDayOfWeek = (int)firstDay.DayOfWeek;
            int dayNumber = buttonIndex - firstDayOfWeek + 1;

            if (dayNumber > 0 && dayNumber <= DateTime.DaysInMonth(_currentMonth.Year, _currentMonth.Month))
            {
                _selectedDate = new DateTime(_currentMonth.Year, _currentMonth.Month, dayNumber);
                UpdateCalendar();
            }
        }

        /// <summary>
        /// Navigate to previous month
        /// </summary>
        private void OnPrevMonth()
        {
            _currentMonth = _currentMonth.AddMonths(-1);
            UpdateCalendar();
        }

        /// <summary>
        /// Navigate to next month
        /// </summary>
        private void OnNextMonth()
        {
            _currentMonth = _currentMonth.AddMonths(1);
            UpdateCalendar();
        }

        /// <summary>
        /// Handle submit button click
        /// </summary>
        private void OnSubmitClicked()
        {
            int age = CalculateAge(_selectedDate);
            if (age < 13)
            {
                SetStatus("<color=red>You must be at least 13 years old</color>");
                return;
            }

            SetInteractable(false);
            SetStatus("Saving profile...");
            _controller.SubmitDateOfBirth(_selectedDate, this);
        }

        /// <summary>
        /// Handle back button click - return to login
        /// </summary>
        private void OnBackClicked()
        {
            gameObject.SetActive(false);

            if (_loginUI != null)
            {
                _loginUI.gameObject.SetActive(true);
                _loginUI.SetInteractable(true);
                _loginUI.SetStatus("Ready to Login");
            }
        }

        /// <summary>
        /// Set UI interactability
        /// </summary>
        public void SetInteractable(bool isEnable)
        {
            if (_prevMonthButton != null) _prevMonthButton.interactable = isEnable;
            if (_nextMonthButton != null) _nextMonthButton.interactable = isEnable;
            if (_submitButton != null) _submitButton.interactable = isEnable;
            if (_backButton != null) _backButton.interactable = isEnable;

            if (_dayButtons != null)
            {
                foreach (var btn in _dayButtons)
                {
                    if (btn != null) btn.interactable = isEnable;
                }
            }
        }

        /// <summary>
        /// Update status text
        /// </summary>
        public void SetStatus(string message)
        {
            if (_statusText != null)
                _statusText.text = message;
        }
    }
}
