/**
 * Extract and manipulate images and videos from HTML content
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

export const removeImagesAndVideosFromHtml = (html) => {
  if (!html) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove all img tags
  doc.querySelectorAll("img").forEach((img) => img.remove());

  // Remove all iframe tags
  doc.querySelectorAll("iframe").forEach((iframe) => iframe.remove());

  return doc.body.innerHTML;
};
