import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "public", "branding", "branzzo-logo.png");

async function squareIcon(size, padding = 0) {
  const inner = Math.max(1, size - padding * 2);
  const logo = await sharp(source).resize(inner, inner, { fit: "cover" }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: "#05050d" } })
    .composite([{ input: logo, left: padding, top: padding }])
    .png()
    .toBuffer();
}

function pngsAsIco(entries) {
  const header = Buffer.alloc(6 + entries.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = header.length;
  entries.forEach(({ png, size }, index) => {
    const directoryOffset = 6 + index * 16;
    header.writeUInt8(size >= 256 ? 0 : size, directoryOffset);
    header.writeUInt8(size >= 256 ? 0 : size, directoryOffset + 1);
    header.writeUInt16LE(1, directoryOffset + 4);
    header.writeUInt16LE(32, directoryOffset + 6);
    header.writeUInt32LE(png.length, directoryOffset + 8);
    header.writeUInt32LE(offset, directoryOffset + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...entries.map(({ png }) => png)]);
}

async function main() {
  const [appIcon, appleIcon, icon48, icon192, maskableIcon, favicon16, favicon32, favicon48, socialLogo] = await Promise.all([
    squareIcon(512),
    squareIcon(180),
    squareIcon(48),
    squareIcon(192),
    squareIcon(512, 52),
    squareIcon(16),
    squareIcon(32),
    squareIcon(48),
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
      <text x="405" y="355" fill="#c4b5fd" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="31" font-weight="600">Creator Marketplace for Brands &amp; Creators</text>
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

  const iconsDirectory = path.join(root, "public", "icons");
  await mkdir(iconsDirectory, { recursive: true });
  await Promise.all([
    writeFile(path.join(root, "app", "icon.png"), appIcon),
    writeFile(path.join(root, "app", "apple-icon.png"), appleIcon),
    writeFile(path.join(root, "public", "favicon.ico"), pngsAsIco([{ png: favicon16, size: 16 }, { png: favicon32, size: 32 }, { png: favicon48, size: 48 }])),
    writeFile(path.join(iconsDirectory, "icon-48.png"), icon48),
    writeFile(path.join(iconsDirectory, "icon-192.png"), icon192),
    writeFile(path.join(iconsDirectory, "icon-512.png"), appIcon),
    writeFile(path.join(iconsDirectory, "maskable-512.png"), maskableIcon),
    writeFile(path.join(root, "public", "apple-touch-icon.png"), appleIcon),
    writeFile(path.join(root, "public", "mstile-150x150.png"), await squareIcon(150)),
    writeFile(path.join(root, "public", "branding", "branzzo-og.png"), socialImage),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
