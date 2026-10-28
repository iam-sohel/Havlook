/**
 * Conservative normalization for a known-broken Amazon image rendition.
 *
 * Only the exact investigated pattern is transformed:
 *
 *   https://m.media-amazon.com/images/W/IMAGERENDERING_521856-T1/images/I/<file>
 *
 * becomes:
 *
 *   https://m.media-amazon.com/images/I/<file>
 *
 * All other URLs are returned unchanged. Normalization is purely
 * syntactic; callers must still handle load failures with a fallback.
 */
const AMAZON_BROKEN_RENDITION =
  /^https:\/\/m\.media-amazon\.com\/images\/W\/IMAGERENDERING_521856-T1\/images\/I\/(.+)$/;

export function normalizeProductImageUrl(url: string): string {
  if (typeof url !== "string" || url.length === 0) {
    return url;
  }

  const match = url.match(AMAZON_BROKEN_RENDITION);
  if (!match) {
    return url;
  }

  return `https://m.media-amazon.com/images/I/${match[1]}`;
}
