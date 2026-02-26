/**
 * Font Loader — dynamically loads Google Fonts for Fabric.js canvas rendering.
 *
 * Key insight: Canvas API renders text immediately. If the font isn't loaded yet,
 * it falls back to a system font and does NOT re-render when the font arrives.
 * Therefore we MUST await font loading before rendering/updating the canvas.
 */

const loadedFonts = new Set<string>();
let cssInjected = false;

/**
 * Inject Google Fonts CSS2 stylesheet link into <head> (once).
 * This only downloads the CSS (small), not the actual font files.
 * Font files are downloaded on-demand when text uses that font.
 */
export function injectGoogleFontsCSS(url: string): void {
  if (cssInjected) return;
  if (typeof document === 'undefined') return;

  const existing = document.querySelector(`link[href="${url}"]`);
  if (existing) {
    cssInjected = true;
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
  cssInjected = true;
}

/**
 * Ensure a specific font family is loaded and ready for canvas rendering.
 * Returns true when the font is available, false on timeout/error.
 *
 * Uses the CSS Font Loading API (document.fonts.load).
 */
export async function ensureFontLoaded(
  fontFamily: string,
  timeout = 5000,
): Promise<boolean> {
  // Strip fallback stack — we just need the primary family
  const primary = fontFamily.split(',')[0].trim().replace(/["']/g, '');

  if (loadedFonts.has(primary)) return true;

  if (typeof document === 'undefined') return false;

  try {
    // Check if already loaded
    const check = document.fonts.check(`16px "${primary}"`);
    if (check) {
      loadedFonts.add(primary);
      return true;
    }

    // Trigger load with timeout
    const result = await Promise.race([
      document.fonts.load(`16px "${primary}"`),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeout)),
    ]);

    if (result !== null) {
      loadedFonts.add(primary);
      return true;
    }

    console.warn(`Font "${primary}" timed out after ${timeout}ms`);
    return false;
  } catch (err) {
    console.warn(`Failed to load font "${primary}":`, err);
    return false;
  }
}

/**
 * Check if a font is already loaded (synchronous).
 */
export function isFontLoaded(fontFamily: string): boolean {
  const primary = fontFamily.split(',')[0].trim().replace(/["']/g, '');
  if (loadedFonts.has(primary)) return true;

  if (typeof document === 'undefined') return false;

  const check = document.fonts.check(`16px "${primary}"`);
  if (check) {
    loadedFonts.add(primary);
    return true;
  }
  return false;
}
