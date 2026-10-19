const fs = require('fs');
const path = require('path');
const https = require('https');

const productsDir = path.join(__dirname, '..', 'public', 'products');
const categoriesDir = path.join(__dirname, '..', 'public', 'categories');

if (!fs.existsSync(productsDir)) fs.mkdirSync(productsDir, { recursive: true });
if (!fs.existsSync(categoriesDir)) fs.mkdirSync(categoriesDir, { recursive: true });

const downloads = [
  {
    url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=900&q=85',
    dest: path.join(productsDir, 'cr7-perfume.jpg')
  },
  {
    url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=85',
    dest: path.join(productsDir, 'dunhill-red-inspired-perfume.jpg')
  },
  {
    url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=85',
    dest: path.join(productsDir, 'ameer-al-oudh-bakhoor.jpg')
  },
  {
    url: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=900&q=85',
    dest: path.join(productsDir, 'oudh-salwa-bakhoor.jpg')
  },
  {
    url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=900&q=85',
    dest: path.join(productsDir, 'oudh-safeeq-bakhoor.jpg')
  },
  // Category banner images
  {
    url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=900&q=85',
    dest: path.join(categoriesDir, 'attars.jpg')
  },
  {
    url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=85',
    dest: path.join(categoriesDir, 'perfumes.jpg')
  },
  {
    url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=900&q=85',
    dest: path.join(categoriesDir, 'bakhoor.jpg')
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (targetUrl) => {
      https.get(targetUrl, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          request(response.headers.location);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: Status ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };
    request(url);
  });
}

async function main() {
  console.log('Downloading luxury product images...');
  for (const item of downloads) {
    try {
      await downloadFile(item.url, item.dest);
      console.log(`✓ Downloaded ${path.basename(item.dest)}`);
    } catch (err) {
      console.error(`✗ Error downloading ${item.dest}:`, err.message);
    }
  }
  console.log('All downloads completed!');
}

main();
