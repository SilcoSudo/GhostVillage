using System;

namespace Game.Domain.Authentication.DTOs
{
    [Serializable]
    public class LoginRequestDTO
    {
        public string email;
        public string password;
    }

    // Cấu trúc JSON trả về từ API Login
    [Serializable]
    public class LoginResponseDTO
    {
        public string token;
        public UserDTO user;
    }

    [Serializable]
    public class UserDTO
    {
        public string id;
        public string email;
        public string dateOfBirth; // ISO format: "1995-05-15"
    }

    [Serializable]
    public class MyProfileResponseDTO
    {
        public string uid;
        public PlayerProfileDTO profile;
    }

    [Serializable]
    public class PlayerProfileDTO
    {
        public string displayName;
        public string avatar;
        public int level;
        public int exp;
        public int coin;
    }

    // ===== GOOGLE OAUTH DTOs (NEW) =====

    /// <summary>
    /// Response from GET /api/game/auth/google - Google OAuth URL
    /// Wrapper extracts 'data' field, so this DTO only contains extracted data
    /// </summary>
    [Serializable]
    public class GoogleAuthUrlResponseDTO
    {
        public string authUrl;
    }

    /// <summary>
    /// Response from GET /api/game/auth/google/callback - Handle OAuth code exchange
    /// Wrapper extracts 'data' field, so this DTO only contains extracted data
    /// </summary>
    [Serializable]
    public class GoogleAuthCallbackResponseDTO
    {
        public string error;
        public string token;
        public UserDTO user;
        public bool profileComplete;  // Is dateOfBirth filled?
        public LoginResponseDTO data; // Full player data if profile complete
    }

    /// <summary>
    /// Request to complete user profile (POST /api/game/auth/complete-profile)
    /// </summary>
    [Serializable]
    public class CompleteProfileRequestDTO
    {
        public string dateOfBirth; // ISO format: "1995-05-15"
    }

    /// <summary>
    /// Response from completing profile
    /// Wrapper extracts 'data' field, so this DTO only contains extracted data
    /// </summary>
    [Serializable]
    public class CompleteProfileResponseDTO
    {
        public string token;
        public UserDTO user;
    }

}
