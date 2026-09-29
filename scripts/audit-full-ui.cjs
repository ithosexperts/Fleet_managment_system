const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function auditUI() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const outDir = path.join(__dirname, '../docs/images/ui-audit');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. DESKTOP AUDIT (1440x900)
  const pageDesktop = await browser.newPage();
  await pageDesktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await pageDesktop.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await pageDesktop.evaluate(() => localStorage.clear());
  await pageDesktop.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  console.log('1. Capturing Desktop Login...');
  await pageDesktop.screenshot({ path: path.join(outDir, 'desk-01-login.png') });

  // Login as Operations Manager
  const buttons = await pageDesktop.$$('button');
  for (const b of buttons) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Dispatch Manager') || text.includes('manager@company.com')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));

  console.log('2. Capturing Desktop Overview...');
  await pageDesktop.screenshot({ path: path.join(outDir, 'desk-02-overview.png') });

  // Navigate to Schedule
  const navBtns = await pageDesktop.$$('aside button');
  for (const b of navBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Schedule')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  console.log('3. Capturing Desktop Schedule...');
  await pageDesktop.screenshot({ path: path.join(outDir, 'desk-03-schedule.png') });

  // Navigate to Live Map / Radar
  for (const b of navBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Live Map') || text.includes('Radar') || text.includes('Fleet')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1200));
  console.log('4. Capturing Desktop Live Fleet...');
  await pageDesktop.screenshot({ path: path.join(outDir, 'desk-04-live-map.png') });

  // Navigate to Documents
  for (const b of navBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Documents')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  console.log('5. Capturing Desktop Documents Hub...');
  await pageDesktop.screenshot({ path: path.join(outDir, 'desk-05-documents.png') });

  // Open Document edit modal
  const editDocBtn = await pageDesktop.$('button[title*="Register or update"]');
  if (editDocBtn) {
    await editDocBtn.click();
    await new Promise(r => setTimeout(r, 800));
    console.log('6. Capturing Desktop Papers Modal...');
    await pageDesktop.screenshot({ path: path.join(outDir, 'desk-06-papers-modal.png') });
    const closeBtn = await pageDesktop.$('.modal-header button');
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  // Navigate to Exceptions
  for (const b of navBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Exceptions')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  console.log('7. Capturing Desktop Exceptions...');
  await pageDesktop.screenshot({ path: path.join(outDir, 'desk-07-exceptions.png') });

  // Navigate to Master Data / Settings
  for (const b of navBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text === 'Settings') {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  console.log('8. Capturing Desktop Settings...');
  await pageDesktop.screenshot({ path: path.join(outDir, 'desk-08-settings.png') });

  await pageDesktop.close();

  // Mobile Audit (Driver cockpit)
  const pageDriver = await browser.newPage();
  await pageDriver.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await pageDriver.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await pageDriver.evaluate(() => localStorage.clear());
  await pageDriver.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  console.log('9. Capturing Mobile Login...');
  await pageDriver.screenshot({ path: path.join(outDir, 'mob-01-login.png') });

  // Login as Driver
  const driverBtns = await pageDriver.$$('button');
  for (const b of driverBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Route Driver') || text.includes('rahul@company.com')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));

  console.log('10. Capturing Mobile Driver Cockpit...');
  await pageDriver.screenshot({ path: path.join(outDir, 'mob-02-driver-cockpit.png') });

  // Click on "Report Delay" or similar
  const actionBtns = await pageDriver.$$('button');
  for (const b of actionBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Report Delay') || text.includes('Delay') || text.includes('देरी')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));
  console.log('11. Capturing Driver Delay Modal...');
  await pageDriver.screenshot({ path: path.join(outDir, 'mob-03-driver-delay.png') });

  await browser.close();
  console.log('UI Audit Complete!');
}

auditUI().catch(err => {
  console.error(err);
  process.exit(1);
});
