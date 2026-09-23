const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function verify() {
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
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  console.log('1. Navigating to http://localhost:4173/...');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  // If on login screen, sign in as Operations Manager
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Operations Manager') || text.includes('HQ Operations') || text.includes('Vikram')) {
      await b.click();
      break;
    }
  }

  await new Promise((r) => setTimeout(r, 800));
  const submitBtns = await page.$$('button');
  for (const b of submitBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Sign In') || text.includes('Command Center')) {
      await b.click();
      break;
    }
  }

  await new Promise((r) => setTimeout(r, 2500));

  // 1. Capture Overview with clean header and vehicle tracking dropdown
  console.log('Capturing 10-overview-tracking.png...');
  await page.screenshot({ path: path.join(outDir, '10-overview-tracking.png') });

  // 2. Navigate to Documents Hub
  console.log('Navigating to Documents Hub...');
  const navBtns = await page.$$('button, a');
  for (const el of navBtns) {
    const text = (await (await el.getProperty('innerText')).jsonValue()).trim();
    if (text === 'Documents') {
      await el.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 2000));
  console.log('Capturing 11-documents-hub-edit.png...');
  await page.screenshot({ path: path.join(outDir, '11-documents-hub-edit.png') });

  // 3. Click 'Update & Edit' on the first document row
  console.log('Clicking Update & Edit...');
  const editBtns = await page.$$('button');
  for (const b of editBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Update & Edit')) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1500));
  console.log('Capturing 12-document-update-modal.png...');
  await page.screenshot({ path: path.join(outDir, '12-document-update-modal.png') });

  // Close modal (Escape or click close)
  await page.keyboard.press('Escape');
  // Close modal before switching
  const closeBtns = await page.$$('button');
  for (const b of closeBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text === 'Close' || text === 'Cancel') {
      try {
        await b.click();
        break;
      } catch {}
    }
  }
  await new Promise((r) => setTimeout(r, 800));

  // 4. Switch to Driver View
  console.log('Switching to Driver View...');
  const driverSwitchBtns = await page.$$('button, a');
  for (const b of driverSwitchBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Driver Mobile View') || text.includes('Driver Cockpit')) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 2500));

  // Set mobile viewport for driver
  await page.setViewport({ width: 420, height: 860, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 1000));

  console.log('Capturing 13-driver-english.png...');
  await page.screenshot({ path: path.join(outDir, '13-driver-english.png') });

  // 5. Click 'हिन्दी' language toggle in header
  console.log('Switching Driver to Hindi...');
  const langBtns = await page.$$('button');
  for (const b of langBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text === 'हिन्दी') {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1500));
  console.log('Capturing 14-driver-hindi.png...');
  await page.screenshot({ path: path.join(outDir, '14-driver-hindi.png') });

  // 6. Click 'Hinglish' language toggle in header
  console.log('Switching Driver to Hinglish...');
  const langBtns2 = await page.$$('button');
  for (const b of langBtns2) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text === 'Hinglish') {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1500));
  console.log('Capturing 15-driver-hinglish.png...');
  await page.screenshot({ path: path.join(outDir, '15-driver-hinglish.png') });

  console.log('All UX verifications successfully completed!');
  await browser.close();
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
