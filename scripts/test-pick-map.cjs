const puppeteer = require('puppeteer-core');

async function test() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

  console.log('Navigating to login...');
  await page.goto('https://truck-tracker-api-9yhq.onrender.com/login', { waitUntil: 'networkidle0' });
  
  // Login
  console.log('Logging in...');
  await page.evaluate(() => {
    const email = document.querySelector('input[type="email"]');
    const pass = document.querySelector('input[type="password"]');
    if (email) { email.value = 'manager@company.com'; email.dispatchEvent(new Event('input', { bubbles: true })); }
    if (pass) { pass.value = 'manager123'; pass.dispatchEvent(new Event('input', { bubbles: true })); }
    const btn = document.querySelector('button[type="submit"]');
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 3000));
  console.log('Current URL after login:', page.url());

  // Open Trips tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const tripTab = tabs.find(t => (t.textContent || '').toLowerCase().includes('trips'));
    if (tripTab) tripTab.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Click Create Trip
  console.log('Opening Create Trip modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const createBtn = btns.find(b => (b.textContent || '').toLowerCase().includes('create trip') || (b.textContent || '').toLowerCase().includes('new trip'));
    if (createBtn) createBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Click Pick on Map button
  console.log('Clicking Pick on Map...');
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pickBtn = btns.find(b => (b.textContent || '').includes('Pick on Map'));
    if (pickBtn) {
      pickBtn.click();
      return true;
    }
    return false;
  });
  console.log('Pick on Map clicked:', clicked);

  await new Promise(r => setTimeout(r, 3000));
  
  const screenshotPath = 'C:\\Users\\MSI\\.gemini\\antigravity-ide\\brain\\4e6a2c4f-f1e6-48eb-aa52-ffd0fc9e1e35\\pick_on_map_test.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to:', screenshotPath);

  // Check what is in the DOM
  const domInfo = await page.evaluate(() => {
    return {
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      overlaysCount: document.querySelectorAll('.modal-overlay').length,
      modalsCount: document.querySelectorAll('.modal-content').length,
      mapPickerContainers: document.querySelectorAll('.leaflet-container').length,
      htmlText: document.body.innerText.slice(0, 300)
    };
  });
  console.log('DOM Info:', domInfo);

  await browser.close();
}

test().catch(console.error);
