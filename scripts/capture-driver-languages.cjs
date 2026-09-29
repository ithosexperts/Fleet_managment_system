const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function captureDriver() {
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
  await page.setViewport({ width: 420, height: 860, deviceScaleFactor: 2 });

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  // Find and click "Route Driver" quick launch button on LoginView
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Route Driver') || text.includes('rahul@company.com')) {
      await b.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2000));
  console.log('Capturing 13-driver-english.png...');
  await page.screenshot({ path: path.join(outDir, '13-driver-english.png') });

  // Switch to Hindi
  const hindiBtns = await page.$$('button');
  for (const b of hindiBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text === 'हिन्दी') {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  console.log('Capturing 14-driver-hindi.png...');
  await page.screenshot({ path: path.join(outDir, '14-driver-hindi.png') });

  // Switch to Hinglish
  const hinglishBtns = await page.$$('button');
  for (const b of hinglishBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text === 'Hinglish') {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  console.log('Capturing 15-driver-hinglish.png...');
  await page.screenshot({ path: path.join(outDir, '15-driver-hinglish.png') });

  console.log('Driver language screenshots captured successfully!');
  await browser.close();
}

captureDriver().catch(err => {
  console.error(err);
  process.exit(1);
});
