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
        // SỬA HÀM NÀY TRONG InputRebindService.cs
        public void StartRebind(string actionName, int bindingIndex, Action<string, string> onResult)
        {
            var action = _inputActions.asset.FindAction(actionName);
            if (action == null) return;

            action.Disable();

            var rebindOperation = action.PerformInteractiveRebinding(bindingIndex)
                .WithControlsExcluding("Mouse")
                .WithCancelingThrough("<Keyboard>/escape")
                .OnApplyBinding((operation, path) =>
                {
                    // 1. KIỂM TRA TRÙNG PHÍM
                    bool isDuplicate = false;
                    foreach (var map in _inputActions.asset.actionMaps)
                    {
                        foreach (var b in map.bindings)
                        {
                            if (b.effectivePath == path)
                            {
                                // Nếu trùng phím ở một Action khác -> Đánh dấu trùng
                                if (b.action != actionName) { isDuplicate = true; break; }
                            }
                        }
                    }

                    if (isDuplicate)
                    {
                        Debug.LogWarning($"[InputRebind] Phím '{path}' bị trùng!");
                        operation.Cancel();
                    }
                    else
                    {
                        // [FIX CHÍ MẠNG]: Phải gọi dòng này thì Input System mới thực sự đè phím mới vào asset
                        operation.action.ApplyBindingOverride(bindingIndex, path);
                    }
                })
                .OnComplete(operation =>
                {
                    // Lấy phím mới sau khi đã Apply thành công
                    string finalPath = action.bindings[bindingIndex].overridePath;
                    string displayString = action.GetBindingDisplayString(bindingIndex);

                    operation.Dispose();
                    action.Enable();
                    onResult?.Invoke(finalPath, displayString);
                })
                .OnCancel(operation =>
                {
                    // [FIX LỖI MẤT PHÍM]: Khi hủy, lấy lại phím đang có (cũ hoặc override cũ)
                    string currentPath = action.bindings[bindingIndex].overridePath ?? action.bindings[bindingIndex].path;
                    string displayString = action.GetBindingDisplayString(bindingIndex);

                    operation.Dispose();
                    action.Enable();
                    onResult?.Invoke(currentPath, displayString);
                });

            rebindOperation.Start();
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