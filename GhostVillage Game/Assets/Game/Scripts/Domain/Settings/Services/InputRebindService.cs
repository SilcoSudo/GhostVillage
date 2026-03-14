using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;
using Game.Domain.Settings.Data;

namespace Game.Domain.Settings.Services
{
    public class InputRebindService
    {
        private readonly PlayerInputActions _inputActions;

        public InputRebindService(PlayerInputActions inputActions)
        {
            _inputActions = inputActions;
            _inputActions.Enable(); // Đảm bảo Input luôn chạy
        }

        // Đọc từ JSON và áp dụng đè lên Input System
        public void ApplyOverrides(List<KeyBindingOverride> overrides)
        {
            foreach (var over in overrides)
            {
                var action = _inputActions.asset.FindAction(over.ActionName);
                if (action != null)
                {
                    action.ApplyBindingOverride(over.BindingIndex, over.OverridePath);
                }
            }
        }

        // Lệnh bắt đầu nghe phím mới
        public void StartRebind(string actionName, int bindingIndex, Action<string, string> onComplete)
        {
            var action = _inputActions.asset.FindAction(actionName);
            if (action == null)
            {
                Debug.LogError($"[InputRebind] Không tìm thấy Action: {actionName}");
                return;
            }

            action.Disable();

            // Bắt đầu quá trình chờ người chơi bấm phím
            action.PerformInteractiveRebinding(bindingIndex)
                .WithControlsExcluding("Mouse") // Bỏ qua nhấp chuột nếu không muốn gắn vào chuột
                .OnComplete(operation =>
                {
                    operation.Dispose();
                    action.Enable();

                    // Lấy đường dẫn mã hóa (để lưu JSON) và tên hiển thị (để hiện lên UI)
                    string overridePath = action.bindings[bindingIndex].overridePath;
                    string displayString = action.GetBindingDisplayString(bindingIndex);

                    onComplete?.Invoke(overridePath, displayString);
                })
                .OnCancel(operation =>
                {
                    operation.Dispose();
                    action.Enable();
                })
                .Start();
        }

        // Trả về tên phím hiện tại để load lên UI
        public string GetDisplayString(string actionName, int bindingIndex = 0)
        {
            var action = _inputActions.asset.FindAction(actionName);
            if (action == null) return "?";
            return action.GetBindingDisplayString(bindingIndex);
        }

        // Reset toàn bộ phím về mặc định
        public void ResetAllBindings()
        {
            foreach (var action in _inputActions.asset)
            {
                action.RemoveAllBindingOverrides();
            }
        }
    }
}