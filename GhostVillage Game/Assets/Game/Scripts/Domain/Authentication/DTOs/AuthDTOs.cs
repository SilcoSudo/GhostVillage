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
        public PlayerDTO player;
    }

    [Serializable]
    public class UserDTO
    {
        public string id;
        public string email;
    }

    [Serializable]
    public class PlayerDTO
    {
        public string _id;
        public PlayerProfileDTO profile;
        // inventory...
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

}
