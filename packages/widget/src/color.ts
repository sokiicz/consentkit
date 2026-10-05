/**
 * color.ts — contrast helpers so the toggle switches stay visible on any banner colours.
 * Colours come from the config as CSS strings (hex, names, hsl…); a canvas normalises them.
 */

type Rgb = [number, number, number];

export function toRgb(css: string): Rgb | null {
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return null;
    // An invalid colour leaves the previous value, so start from a sentinel no real config uses.
    ctx.fillStyle = '#010203';
    ctx.fillStyle = css;
    const v = String(ctx.fillStyle);
    if (v === '#010203') return null;
    if (v[0] === '#' && v.length === 7) {
      return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
    }
    const m = v.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
  } catch {
    return null;
  }
}

function luminance([r, g, b]: Rgb): number {
  const lin = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export interface ToggleColors {
  /** Track colour when a switch is on. */
  onFill: string;
  /** Knob colour when a switch is on. */
  onThumb: string;
}

/**
 * The accent colour fills an "on" switch only when it stands out from the banner by at
 * least 3:1 (WCAG 1.4.11 for controls). Otherwise the text colour does, which always does.
 * The knob takes whichever of the two banner colours contrasts more with the track.
 */
export function pickToggleColors(banner: { primaryColor: string; accentColor: string; textColor: string }): ToggleColors {
  const bg = toRgb(banner.primaryColor);
  const text = toRgb(banner.textColor);
  const accent = toRgb(banner.accentColor);
  if (!bg || !text) return { onFill: banner.textColor, onThumb: banner.primaryColor };

  const useAccent = accent !== null && contrast(accent, bg) >= 3;
  const onFill = useAccent ? banner.accentColor : banner.textColor;
  const fillRgb = (useAccent ? accent : text) as Rgb;
  const onThumb = contrast(bg, fillRgb) >= contrast(text, fillRgb) ? banner.primaryColor : banner.textColor;
  return { onFill, onThumb };
}
