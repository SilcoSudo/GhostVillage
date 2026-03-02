const AVATAR_CACHE_PREFIX = "avatar_cache_";
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Check if user is logged in (remember me is active)
 * @returns {boolean}
 */
const isUserLoggedIn = () => {
  return !!localStorage.getItem("token");
};

/**
 * Get cached avatar URL or original URL
 * Only cache if user is logged in (remember me active)
 * @param {string} userId - User ID
 * @param {string} avatarUrl - Original avatar URL
 * @returns {string} - Cached or original URL
 */
export const getAvatarUrl = (userId, avatarUrl) => {
  if (!userId || !avatarUrl) return avatarUrl;

  // Only use cache if user is logged in (remember me active)
  if (!isUserLoggedIn()) {
    return avatarUrl;
  }

  const cacheKey = `${AVATAR_CACHE_PREFIX}${userId}`;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { url, timestamp } = JSON.parse(cached);
      // Check if cache is still valid
      if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
        return url;
      }
      // Cache expired, remove it
      localStorage.removeItem(cacheKey);
    }
  } catch (error) {
    console.error("Error reading avatar cache:", error);
  }

  return avatarUrl;
};

/**
 * Cache avatar when successfully loaded
 * Only cache if user is logged in (remember me active)
 * @param {string} userId - User ID
 * @param {string} avatarUrl - Avatar URL to cache
 */
export const cacheAvatar = (userId, avatarUrl) => {
  if (!userId || !avatarUrl) return;

  // Only cache if user is logged in (remember me active)
  if (!isUserLoggedIn()) {
    return;
  }

  const cacheKey = `${AVATAR_CACHE_PREFIX}${userId}`;
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        url: avatarUrl,
        timestamp: Date.now(),
      }),
    );
  } catch (error) {
    console.error("Error caching avatar:", error);
  }
};

/**
 * Clear avatar cache for a user
 * @param {string} userId - User ID
 */
export const clearAvatarCache = (userId) => {
  if (!userId) return;
  const cacheKey = `${AVATAR_CACHE_PREFIX}${userId}`;
  try {
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error("Error clearing avatar cache:", error);
  }
};

/**
 * Clear ALL avatar caches (call on logout)
 */
export const clearAllAvatarCaches = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(AVATAR_CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Error clearing all avatar caches:", error);
  }
};
