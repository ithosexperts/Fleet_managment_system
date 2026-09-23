const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function verifyLoading() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const outDir = path.join(__dirname, '../docs/images');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1.5 });

  // 1. Intercept auth request or navigate to demonstrate the loading screen with logo
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.url().includes('/api/auth/me')) {
      // Delay response by 3 seconds so the loading state is active and visible
      setTimeout(() => req.continue(), 3000);
    } else {
      req.continue();
    }
  });

  // Set fake token to trigger loading state check
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('truck_tracker_token', 'demo-loading-token');
  });

  // Reload to capture loading state
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 400));

  await page.screenshot({ path: path.join(outDir, '16-app-loading-logo.png') });
  console.log('Saved docs/images/16-app-loading-logo.png');

  await browser.close();
}

verifyLoading().catch((err) => {
  console.error(err);
  process.exit(1);
});
