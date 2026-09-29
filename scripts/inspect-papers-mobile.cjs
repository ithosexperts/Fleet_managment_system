const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function inspectPapers() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const outDir = path.join(__dirname, '../docs/images/mobile-review');
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  // Login as Operations Manager
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Dispatch Manager') || text.includes('manager@company.com')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));

  // Click "Docs" in bottom navigation
  const bottomBtns = await page.$$('.manager-bottom-nav button');
  for (const b of bottomBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Docs')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));

  // Click "+ Register & Update Document"
  const regBtn = await page.$('button[title*="Register or update official vehicle compliance papers"]');
  if (regBtn) {
    await regBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    console.log('Capturing vehicle papers modal on mobile...');
    await page.screenshot({ path: path.join(outDir, '06-manager-mobile-papers-modal.png') });
  }

  await browser.close();
  console.log('Papers modal captured!');
}

inspectPapers().catch(err => {
  console.error(err);
  process.exit(1);
});
