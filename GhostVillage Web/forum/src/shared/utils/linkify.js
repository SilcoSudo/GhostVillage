/**
 * Convert URLs and mentions in text to clickable links
 */

export const linkifyHtmlContent = (html) => {
  if (!html) return "";

  let content = html;

  // Convert URLs to links
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  content = content.replace(
    urlRegex,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="url-link">$1</a>'
  );

  // Convert mentions (@username) to links
  const mentionRegex = /(@[\w-]+)/g;
  content = content.replace(
    mentionRegex,
    '<a href="/profile/$1" class="mention-link">$1</a>'
  );

  // Convert hashtags to links
  const hashtagRegex = /(#[\w-]+)/g;
  content = content.replace(
    hashtagRegex,
    '<a href="/search?q=$1" class="hashtag-link">$1</a>'
  );

  return content;
};
