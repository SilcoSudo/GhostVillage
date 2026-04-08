using UnityEngine;
using System.Collections.Generic;
using Photon.Pun;
using UnityEngine.InputSystem;


namespace Game.Scripts.Gameplay.Core
{
    public class SpectatorController : MonoBehaviour
    {
        [Header("Orbit Settings")]
        [SerializeField] private float _sensitivity = 0.2f;
        [SerializeField] private float _distance = 3.5f; // Khoảng cách từ Camera tới người
        [SerializeField] private Vector3 _targetOffset = new Vector3(0, 1.5f, 0); // Nhìn vào phần ngực/đầu người chơi

        private Transform _currentTarget;
        private List<GameObject> _livingPlayers = new List<GameObject>();
        private int _targetIndex = 0;

        private float _rotX;
        private float _rotY = 20f; // Góc ngước ban đầu
        private bool _isActive = false;

        public void ActivateSpectator()
        {
            _isActive = true;
            _rotX = transform.eulerAngles.y;

            FindNewTarget();
            Debug.Log("<color=magenta>[Spectator] Orbit Camera đã kích hoạt!</color>");
        }

        public void DeactivateSpectator()
        {
            _isActive = false;
        }

        private void Update()
        {
            if (!_isActive) return;

            // Xử lý xoay chuột
            Vector2 mouseDelta = Mouse.current.delta.ReadValue();
            _rotX += mouseDelta.x * _sensitivity;
            _rotY -= mouseDelta.y * _sensitivity;
            _rotY = Mathf.Clamp(_rotY, -20f, 80f); // Không cho lật ngược camera

            // Đổi mục tiêu
            if (Keyboard.current.aKey.wasPressedThisFrame) ChangeTarget(-1);
            if (Keyboard.current.dKey.wasPressedThisFrame) ChangeTarget(1);
        }

        private void LateUpdate()
        {
            if (!_isActive) return;

            // Nếu người đang xem bất ngờ bốc hơi (chết/thoát), tự động tìm người mới
            if (_currentTarget == null || !_currentTarget.gameObject.activeInHierarchy)
            {
                FindNewTarget();
                if (_currentTarget == null) return; // Vẫn không có ai thì chịu
            }

            // ===============================================
            // TÍNH TOÁN QUỸ ĐẠO QUAY (ORBIT MATH)
            // ===============================================
            Quaternion rotation = Quaternion.Euler(_rotY, _rotX, 0);
            Vector3 targetCenter = _currentTarget.position + _targetOffset;

            // Lùi camera ra sau lưng target một khoảng _distance
            Vector3 position = targetCenter - (rotation * Vector3.forward * _distance);

            transform.rotation = rotation;
            transform.position = position;
        }

        private void FindNewTarget()
        {
            _livingPlayers.Clear();
            GameObject[] players = GameObject.FindGameObjectsWithTag("Player");

            foreach (var p in players)
            {
                var knockedState = p.GetComponent<PlayerKnockedState>();

                var pView = p.GetComponent<PhotonView>();

                // Tiêu chí người sống: Không bị Knocked VÀ GameObject còn bật (chưa Escaped)
                if (knockedState != null && !knockedState.isKnocked && p.activeInHierarchy && pView != null && !pView.IsMine)
                {
                    _livingPlayers.Add(p);
                }
            }

            if (_livingPlayers.Count > 0)
            {
                _targetIndex = 0; // Reset index về 0
                SetTarget(_livingPlayers[0].transform);
            }
            else
            {
                Debug.LogWarning("[Spectator] Không tìm thấy ai còn sống để xem!");
                _currentTarget = null;
            }
        }

        private void ChangeTarget(int direction)
        {
            if (_livingPlayers.Count <= 1)
            {
                FindNewTarget();
                if (_livingPlayers.Count <= 1) return;
            }

            // Dùng vòng lặp kiểm tra để tránh bay vào người vừa chết nhưng chưa xóa khỏi list
            int startIdx = _targetIndex;
            do
            {
                _targetIndex = (_targetIndex + direction + _livingPlayers.Count) % _livingPlayers.Count;
                var potentialTarget = _livingPlayers[_targetIndex];

                if (potentialTarget != null && potentialTarget.activeInHierarchy)
                {
                    SetTarget(potentialTarget.transform);
                    return; // Đã tìm thấy người khỏe mạnh
                }

            } while (_targetIndex != startIdx); // Duyệt hết 1 vòng mà không ai sống

            // Nếu chạy tới đây thì team chết sạch
            FindNewTarget();
        }

        private void SetTarget(Transform target)
        {
            _currentTarget = target;
            Debug.Log($"<color=cyan>[Spectator] Đang xem: {target.gameObject.name}</color>");
        }
    }
}