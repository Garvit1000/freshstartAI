const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Font configuration
const fonts = {
  'Helvetica.ttf': 'https://github.com/matomo-org/travis-scripts/raw/master/fonts/Helvetica.ttf',
  'Helvetica-Bold.ttf': 'https://github.com/matomo-org/travis-scripts/raw/master/fonts/Helvetica-Bold.ttf'
};

// Configuration
const fontsDir = path.join(__dirname, 'fonts');
const cachePath = path.join(fontsDir, '.font-cache.json');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir);
}

// Cache management
function loadCache() {
  try {
    return fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};
  } catch (error) {
    console.warn('Failed to load font cache:', error);
    return {};
  }
}

function saveCache(cache) {
  try {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.warn('Failed to save font cache:', error);
  }
}

function calculateFileHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    console.warn('Failed to calculate file hash:', error);
    return null;
  }
}

// Font download function
function downloadFont(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(fontsDir, filename);
    const tempPath = `${filePath}.tmp`;
    
    const fileStream = fs.createWriteStream(tempPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }

      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        fs.renameSync(tempPath, filePath);
        resolve(calculateFileHash(filePath));
      });
    }).on('error', (error) => {
      fs.unlink(tempPath, () => {}); // Clean up temp file
      reject(error);
    });

    fileStream.on('error', (error) => {
      fs.unlink(tempPath, () => {}); // Clean up temp file
      reject(error);
    });
  });
}

// Font verification function
async function verifyFont(filename, url, cache) {
  const filePath = path.join(fontsDir, filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`${filename} not found, downloading...`);
    const hash = await downloadFont(url, filename);
    cache[filename] = { hash, timestamp: Date.now() };
    return true;
  }

  // Check if file is in cache
  if (!cache[filename]) {
    console.log(`${filename} not in cache, verifying...`);
    const hash = calculateFileHash(filePath);
    cache[filename] = { hash, timestamp: Date.now() };
    return true;
  }

  // Verify file hash
  const currentHash = calculateFileHash(filePath);
  if (currentHash !== cache[filename].hash) {
    console.log(`${filename} hash mismatch, downloading...`);
    const hash = await downloadFont(url, filename);
    cache[filename] = { hash, timestamp: Date.now() };
    return true;
  }

  console.log(`${filename} verified from cache`);
  return false;
}

// Main setup function
async function setupFonts() {
  console.log('Verifying fonts...');
  const cache = loadCache();
  let cacheUpdated = false;

  try {
    await Promise.all(
      Object.entries(fonts).map(async ([filename, url]) => {
        const updated = await verifyFont(filename, url, cache);
        cacheUpdated = cacheUpdated || updated;
      })
    );

    if (cacheUpdated) {
      saveCache(cache);
    }
    
    console.log('Font verification complete');
  } catch (error) {
    console.error('Font setup failed:', error);
    throw error;
  }
}

// Export the setup function
module.exports = setupFonts;