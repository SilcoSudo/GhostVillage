/**
 * Extract media (images and videos) from HTML content
 * @param {string} html - HTML string containing media elements
 * @returns {Object} { media: Array, cleanBody: string }
 */
export const extractMediaFromHtml = (html) => {
  if (!html) return { media: [], cleanBody: "" };

  const media = [];
  let cleanBody = html;

  // Create a temporary DOM to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Extract images
  const images = doc.querySelectorAll("img");
  images.forEach((img) => {
    const src = img.getAttribute("src");
    if (src) {
      media.push({
        url: src,
        type: "image",
      });
      img.remove();
    }
  });

  // Extract YouTube iframes
  const iframes = doc.querySelectorAll('iframe[src*="youtube"]');
  iframes.forEach((iframe) => {
    const src = iframe.getAttribute("src");
    if (src) {
      media.push({
        url: src,
        type: "video",
      });
      iframe.remove();
    }
  });

  cleanBody = doc.body.innerHTML;

  return { media, cleanBody };
};

/**
 * Remove media tags from HTML content
 * @param {string} html - HTML string
 * @returns {string} Clean HTML without media tags
 */
export const removeMediaFromHtml = (html) => {
  if (!html) return "";

  const { cleanBody } = extractMediaFromHtml(html);
  return cleanBody;
};

/**
 * Remove images and videos from HTML content (alias)
 * @param {string} html - HTML string
 * @returns {string} Clean HTML without media tags
 */
export const removeImagesAndVideosFromHtml = (html) => {
  return removeMediaFromHtml(html);
};

/**
 * Get only media from HTML content
 * @param {string} html - HTML string
 * @returns {Array} Array of media objects
 */
export const getMediaFromHtml = (html) => {
  if (!html) return [];

  const { media } = extractMediaFromHtml(html);
  return media;
};

/**
 * Extract and manipulate images and videos from HTML content (legacy)
 */

export const extractImagesFromHtml = (html) => {
  if (!html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const imgs = doc.querySelectorAll("img");

  return Array.from(imgs).map((img) => ({
    src: img.src,
    alt: img.alt || "Image",
  }));
};

export const extractVideosFromHtml = (html) => {
  if (!html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const iframes = doc.querySelectorAll("iframe");

  return Array.from(iframes).map((iframe) => ({
    src: iframe.src,
    title: iframe.title || "Video",
  }));
};
