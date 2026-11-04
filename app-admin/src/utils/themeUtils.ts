export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export function getContrastColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#ffffff';
  // Luminance standard formula (YIQ)
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 160 ? '#18181b' : '#ffffff';
}

export function applyThemeVariables(primary?: string, secondary?: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const validPrimary = primary && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(primary)
    ? primary
    : '#D4AF37';

  const validSecondary = secondary && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(secondary)
    ? secondary
    : '#343434';

  root.style.setProperty('--brand-primary', validPrimary);
  root.style.setProperty('--brand-secondary', validSecondary);
  root.style.setProperty('--brand-primary-contrast', getContrastColor(validPrimary));
  root.style.setProperty('--brand-secondary-contrast', getContrastColor(validSecondary));

  const rgbPrimary = hexToRgb(validPrimary);
  if (rgbPrimary) {
    root.style.setProperty('--brand-primary-rgb', `${rgbPrimary.r}, ${rgbPrimary.g}, ${rgbPrimary.b}`);
  }

  const rgbSecondary = hexToRgb(validSecondary);
  if (rgbSecondary) {
    root.style.setProperty('--brand-secondary-rgb', `${rgbSecondary.r}, ${rgbSecondary.g}, ${rgbSecondary.b}`);
  }
}
