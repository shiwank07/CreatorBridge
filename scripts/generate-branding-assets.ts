import { writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "public", "branding", "branzzo-logo.png");

async function squareIcon(size: number) {
  return sharp(source).resize(size, size, { fit: "cover" }).png().toBuffer();
}

function pngAsIco(png: Buffer, size: number) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(size >= 256 ? 0 : size, 6);
  header.writeUInt8(size >= 256 ? 0 : size, 7);
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18);
  return Buffer.concat([header, png]);
}

async function main() {
  const [appIcon, appleIcon, faviconPng, socialLogo] = await Promise.all([
    squareIcon(512),
    squareIcon(180),
    squareIcon(256),
    squareIcon(250),
  ]);

  const socialText = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#a855f7" stop-opacity=".24"/>
          <stop offset="1" stop-color="#22d3ee" stop-opacity=".14"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="#070712"/>
      <circle cx="310" cy="315" r="290" fill="url(#glow)"/>
      <text x="400" y="285" fill="#ffffff" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="88" font-weight="800">Branzzo</text>
      <text x="405" y="355" fill="#c4b5fd" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="34" font-weight="600">Where Brands Meet Creators</text>
    </svg>
  `);

  const socialImage = await sharp({
    create: { width: 1200, height: 630, channels: 3, background: "#070712" },
  })
    .composite([
      { input: socialText, left: 0, top: 0 },
      { input: socialLogo, left: 90, top: 190 },
    ])
    .png()
    .toBuffer();

  await Promise.all([
    writeFile(path.join(root, "app", "icon.png"), appIcon),
    writeFile(path.join(root, "app", "apple-icon.png"), appleIcon),
    writeFile(path.join(root, "public", "favicon.ico"), pngAsIco(faviconPng, 256)),
    writeFile(path.join(root, "public", "branding", "branzzo-og.png"), socialImage),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
