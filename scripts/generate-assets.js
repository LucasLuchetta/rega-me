// Regenerates the launcher, notification and placeholder assets from the brand logo.
// Run from the project root: node scripts/generate-assets.js [outDir]
const path = require('path');
const Jimp = require('jimp-compact');

const ROOT = path.join(__dirname, '..');
const A = (f) => path.join(ROOT, 'assets', f);
const OUT = process.argv[2] || path.join(ROOT, 'assets');
const O = (f) => path.join(OUT, f);

// Source logo geometry (brand/logo-source.png, 1024x1024)
const CX = 513, CY = 514, R = 274;
const GREEN = { r: 83, g: 99, b: 67 };
const CREAM = { r: 247, g: 244, b: 233 };

// Extracts the cream artwork from inside the green circle as an alpha mask.
// Pixels are scored on the green->cream axis so antialiased edges stay smooth.
async function extractArtwork() {
  const src = await Jimp.read(path.join(ROOT, 'brand', 'logo-source.png'));
  const out = new Jimp(1024, 1024, 0x00000000);
  const lum = (c) => 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
  const lo = lum(GREEN), hi = lum(CREAM);

  let minX = 1e9, minY = 1e9, maxX = 0, maxY = 0;
  src.scan(0, 0, 1024, 1024, function (x, y, i) {
    if ((x - CX) ** 2 + (y - CY) ** 2 > R * R) return;
    const d = this.bitmap.data;
    let t = (lum({ r: d[i], g: d[i + 1], b: d[i + 2] }) - lo) / (hi - lo);
    t = Math.max(0, Math.min(1, t));
    if (t <= 0.02) return;
    const j = (1024 * y + x) * 4;
    out.bitmap.data[j] = CREAM.r;
    out.bitmap.data[j + 1] = CREAM.g;
    out.bitmap.data[j + 2] = CREAM.b;
    out.bitmap.data[j + 3] = Math.round(t * 255);
    if (t > 0.5) {
      if (x < minX) minX = x; if (y < minY) minY = y;
      if (x > maxX) maxX = x; if (y > maxY) maxY = y;
    }
  });
  return out.crop(minX, minY, maxX - minX + 1, maxY - minY + 1);
}

// Centers `art` on a `size` canvas so its longest side covers `coverage` of it.
function compose(art, size, coverage, background) {
  const canvas = new Jimp(size, size, background);
  const scale = (size * coverage) / Math.max(art.bitmap.width, art.bitmap.height);
  const layer = art.clone().scale(scale);
  canvas.composite(layer, Math.round((size - layer.bitmap.width) / 2), Math.round((size - layer.bitmap.height) / 2));
  return canvas;
}

const hex = (c) => Jimp.rgbaToInt(c.r, c.g, c.b, 255);

// White water drop on transparent, 96x96, supersampled 4x for clean edges.
// Circle + triangle tangent to it, so the silhouette has no visible seam.
function drawDroplet() {
  const S = 4, N = 96 * S;
  const cx = 48 * S, cy = 61 * S, r = 27 * S, apexY = 8 * S;
  const d = cy - apexY, L = Math.sqrt(d * d - r * r);
  const tx = (r * L) / d, ty = (r * r) / d;
  const ax = cx, ay = apexY;             // apex
  const lx = cx - tx, rx = cx + tx, tyy = cy - ty; // tangent points
  const side = (px, py, x1, y1, x2, y2) => (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1);

  const big = new Jimp(N, N, 0x00000000);
  big.scan(0, 0, N, N, function (x, y, i) {
    const px = x + 0.5, py = y + 0.5;
    const inCircle = (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
    const s1 = side(px, py, ax, ay, rx, tyy);
    const s2 = side(px, py, rx, tyy, lx, tyy);
    const s3 = side(px, py, lx, tyy, ax, ay);
    const inTri = !((s1 < 0 || s2 < 0 || s3 < 0) && (s1 > 0 || s2 > 0 || s3 > 0));
    if (inCircle || inTri) {
      const b = this.bitmap.data;
      b[i] = b[i + 1] = b[i + 2] = 255;
      b[i + 3] = 255;
    }
  });
  return big.resize(96, 96, Jimp.RESIZE_BILINEAR);
}

(async () => {
  const art = await extractArtwork();
  console.log('artwork', art.bitmap.width + 'x' + art.bitmap.height);

  // Adaptive icon foreground: transparent, artwork inside the 66% safe zone.
  await compose(art, 1024, 0.62, 0x00000000).writeAsync(O('adaptive-icon.png'));

  // App / store icon: same artwork full-bleed on the brand green.
  const icon = compose(art, 1024, 0.66, hex(GREEN));
  await icon.writeAsync(O('icon.png'));
  // 512x512 version for the Play Store listing (uploaded by hand, not bundled).
  await icon.clone().resize(512, 512).writeAsync(path.join(ROOT, 'brand', 'store', 'play-icon-512.png'));

  // Favicons for the site published from docs/ (Cloudflare Pages).
  await icon.clone().resize(180, 180).writeAsync(path.join(ROOT, 'docs', 'apple-touch-icon.png'));
  await icon.clone().resize(32, 32).writeAsync(path.join(ROOT, 'docs', 'favicon.png'));

  // Notification icon: Android keeps only the alpha channel and renders it at ~24dp,
  // so the full logo turns to mush. Ship a solid water drop instead.
  await drawDroplet().writeAsync(O('notification-icon.png'));

  // Placeholder: the 2048x2048 / 5MB source was being decoded for every list thumbnail.
  const ph = await Jimp.read(path.join(ROOT, 'brand', 'plant-placeholder-source.png'));
  await ph.resize(512, 512).deflateLevel(9).writeAsync(O('plant-placeholder.png'));

  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
