const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, 'public', 'pttc.jpg');
const outputPath = path.join(__dirname, 'public', 'pttc.png');

(async () => {
  try {
    // Chuyển JPG -> PNG
    await sharp(inputPath)
      .png()
      .toFile(outputPath);
    
    console.log('✓ Đã chuyển pttc.jpg -> pttc.png');
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
})();
