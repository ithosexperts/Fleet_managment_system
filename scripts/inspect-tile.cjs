const puppeteer = require('puppeteer-core');

async function inspect() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('LOG:', msg.text()));

  await page.goto('https://truck-tracker-api-9yhq.onrender.com/login', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const email = document.querySelector('input[type="email"]');
    const pass = document.querySelector('input[type="password"]');
    if (email) email.value = 'manager@company.com';
    if (pass) pass.value = 'manager123';
    const btn = document.querySelector('button[type="submit"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2500));
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const t = tabs.find(x => (x.textContent || '').toLowerCase().includes('trips'));
    if (t) t.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => (x.textContent || '').includes('Create Trip') || (x.textContent || '').includes('New Trip'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => (x.textContent || '').includes('Pick on Map'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  // Inspect elements covering the map
  const info = await page.evaluate(() => {
    const map = document.querySelector('.leaflet-container');
    if (!map) return { error: 'No map found' };
    const rect = map.getBoundingClientRect();
    const testX = rect.left + rect.width * 0.7;
    const testY = rect.top + rect.height * 0.3;
    const el = document.elementFromPoint(testX, testY);
    
    const tiles = Array.from(document.querySelectorAll('.leaflet-tile')).map(t => ({
      src: t.src,
      transform: t.style.transform,
      width: t.width,
      height: t.height,
      complete: t.complete,
      naturalWidth: t.naturalWidth
    }));

    return {
      elementUnderPoint: {
        tagName: el ? el.tagName : null,
        className: el ? el.className : null,
        id: el ? el.id : null,
        outerHTML: el ? el.outerHTML.slice(0, 150) : null
      },
      tilesCount: tiles.length,
      tiles
    };
  });

  console.log('Inspect info:', JSON.stringify(info, null, 2));
  await browser.close();
}

inspect().catch(console.error);
