const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function inspectMobile() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const outDir = path.join(__dirname, '../docs/images/mobile-review');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const page = await browser.newPage();
  // iPhone 14 / modern Android resolution
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

  await new Promise(r => setTimeout(r, 2000));
  console.log('Capturing mobile overview...');
  await page.screenshot({ path: path.join(outDir, '01-manager-mobile-overview.png') });

  // Open Schedule Trip Modal
  const scheduleTripBtn = await page.$('button.btn-primary');
  if (scheduleTripBtn) {
    await scheduleTripBtn.click();
    await new Promise(r => setTimeout(r, 800));
    console.log('Capturing mobile schedule modal...');
    await page.screenshot({ path: path.join(outDir, '02-manager-mobile-modal.png') });
    const closeBtn = await page.$('.modal-header button');
    if (closeBtn) {
      await closeBtn.click();
    }
    await new Promise(r => setTimeout(r, 800));
  }

  // Click "Docs" in bottom navigation
  const bottomBtns = await page.$$('.manager-bottom-nav button');
  for (const b of bottomBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Docs')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1200));
  console.log('Capturing mobile documents hub...');
  await page.screenshot({ path: path.join(outDir, '04-manager-mobile-documents.png') });

  // Click "Schedule" in bottom navigation
  const bottomBtns2 = await page.$$('.manager-bottom-nav button');
  for (const b of bottomBtns2) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Schedule')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1200));
  console.log('Capturing mobile schedule screen...');
  await page.screenshot({ path: path.join(outDir, '05-manager-mobile-schedule.png') });

  console.log('Mobile review screenshots captured!');
  await browser.close();
}

inspectMobile().catch(err => {
  console.error(err);
  process.exit(1);
});
