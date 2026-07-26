/**
 * Organic "leaf/teardrop" shape used across the Minimal Orgânico redesign:
 * three fully round corners plus one soft corner. React Native doesn't
 * support the CSS `border-radius: 50% 50% 50% 16px` shorthand, so corners
 * are set individually.
 */
export const teardrop = (size: number, sharpCorner = 16) => ({
  width: size,
  height: size,
  borderTopLeftRadius: size / 2,
  borderTopRightRadius: size / 2,
  borderBottomRightRadius: size / 2,
  borderBottomLeftRadius: sharpCorner,
});
