const sharp = require('sharp');
const fs = require('fs');

if (!fs.existsSync('./public/icons')) {
  fs.mkdirSync('./public/icons', { recursive: true });
}

const sizes = [192, 512];

async function generateIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#0A8A7B"/>
      <text 
        x="50%" 
        y="52%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-size="${size * 0.35}"
        fill="white"
        font-family="Arial, sans-serif"
        font-weight="bold"
      >물찾</text>
      <text 
        x="50%" 
        y="78%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-size="${size * 0.15}"
        fill="rgba(255,255,255,0.8)"
        font-family="Arial, sans-serif"
      >사</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`./public/icons/icon-${size}.png`);

  console.log(`✅ icon-${size}.png 생성 완료`);
}

async function main() {
  for (const size of sizes) {
    await generateIcon(size);
  }
  console.log('🎉 모든 아이콘 생성 완료!');
}

main().catch(console.error);