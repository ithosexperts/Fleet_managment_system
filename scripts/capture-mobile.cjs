const puppeteer = require('puppeteer-core');
const path = require('path');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 412,
    height: 892,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  });

  await page.goto('https://truck-tracker-api-9yhq.onrender.com/', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));

  // Click 'Sign In as Route Driver' directly
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Sign In as Route Driver') || text.includes('Route Driver')) {
      await b.click();
      break;
    }
  }

  // If still on login, click the submit button
  await new Promise((r) => setTimeout(r, 1000));
  const submitBtns = await page.$$('button');
  for (const b of submitBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Sign In as Route Driver')) {
      await b.click();
      break;
    }
  }

  // Wait for Driver Cockpit to fully load
  await new Promise((r) => setTimeout(r, 4500));

  console.log('Capturing 05-driver-mobile-cockpit.png...');
  await page.screenshot({ path: path.join(__dirname, '../docs/images/05-driver-mobile-cockpit.png') });

  // Open Vehicle Papers Modal
  console.log('Clicking Vehicle Papers...');
  const paperBtns = await page.$$('button');
  for (const b of paperBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Vehicle Papers')) {
      await b.click();
      break;
    }
  }

  await new Promise((r) => setTimeout(r, 2000));
  console.log('Capturing 06-vehicle-papers-compliance.png...');
  await page.screenshot({ path: path.join(__dirname, '../docs/images/06-vehicle-papers-compliance.png') });

  await browser.close();
  console.log('Mobile screenshots captured successfully!');
}

run().catch(console.error);
