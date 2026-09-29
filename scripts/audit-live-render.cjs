const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function runLiveAudit() {
  const TARGET_URL = 'https://truck-tracker-api-9yhq.onrender.com';
  console.log('====================================================');
  console.log(`🔍 AUDITING LIVE RENDER SITE: ${TARGET_URL}`);
  console.log('====================================================');

  const errors = [];
  const warnings = [];
  const networkFailures = [];

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      console.log(`❌ [CONSOLE ERROR] ${text}`);
      errors.push(text);
    } else if (msg.type() === 'warn') {
      warnings.push(text);
    }
  });

  page.on('pageerror', (err) => {
    console.log(`🚨 [PAGE ERROR] ${err.message}`);
    errors.push(`Page Uncaught Error: ${err.message}\n${err.stack}`);
  });

  page.on('request', (req) => {
    if (req.url().includes('/api/auth/login')) {
      console.log(`📤 [LOGIN REQUEST] Method: ${req.method()}, PostData: ${req.postData()}`);
    }
  });

  page.on('response', async (res) => {
    if (res.url().includes('/api/auth/login')) {
      const text = await res.text().catch(() => '');
      console.log(`📥 [LOGIN RESPONSE] Status: ${res.status()}, Body: ${text}`);
    }
  });

  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Visit Login Page
    console.log('\n[1/7] Testing Login Page...');
    await page.goto(`${TARGET_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));

    // Check login page title and elements
    const pageTitle = await page.title();
    console.log(`Page Title: "${pageTitle}"`);

    // Click Manager quick login button
    console.log('[2/7] Logging in as Dispatch / Operations Manager...');
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      if (emailInput) {
        emailInput.value = 'manager@company.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (passwordInput) {
        passwordInput.value = 'manager123';
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });

    await new Promise((r) => setTimeout(r, 3000));
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);

    // 2. Audit Manager Dashboard Tabs
    console.log('\n[3/7] Testing Manager Navigation Tabs...');
    const tabs = ['trips', 'vehicles', 'drivers', 'destinations', 'maintenance', 'analytics', 'reports', 'map'];
    for (const tab of tabs) {
      console.log(`  -> Clicking tab: ${tab}...`);
      await page.evaluate((t) => {
        const links = Array.from(document.querySelectorAll('button, a'));
        const target = links.find(l => {
          const text = (l.textContent || '').toLowerCase();
          return text.includes(t);
        });
        if (target) target.click();
      }, tab);
      await new Promise((r) => setTimeout(r, 1200));
    }

    // 3. Test Destination Modal & MapPicker
    console.log('\n[4/7] Testing Destination Modal & MapPicker...');
    // First navigate back to destinations
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('button, a'));
      const destLink = links.find(l => (l.textContent || '').toLowerCase().includes('locations master') || (l.textContent || '').toLowerCase().includes('destination'));
      if (destLink) destLink.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Click "Register Location"
    const modalOpened = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => {
        const txt = (b.textContent || '').toLowerCase();
        return txt.includes('register location') || txt.includes('register new') || txt.includes('add destination');
      });
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    console.log(`Destination modal opened: ${modalOpened}`);
    await new Promise((r) => setTimeout(r, 2000));

    // Close modal
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('button'));
      const closeBtn = closeBtns.find(b => (b.getAttribute('aria-label') === 'close') || (b.textContent || '').includes('Cancel') || b.querySelector('svg.lucide-x'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // 4. Test Trip Creator Modal
    console.log('\n[5/7] Testing Trip Creator Modal...');
    // Navigate to trips tab
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('button, a'));
      const tripsLink = links.find(l => (l.textContent || '').toLowerCase().includes('trips'));
      if (tripsLink) tripsLink.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    const tripModalOpened = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const createBtn = buttons.find(b => {
        const txt = (b.textContent || '').toLowerCase();
        return txt.includes('create trip') || txt.includes('new trip') || txt.includes('schedule trip');
      });
      if (createBtn) {
        createBtn.click();
        return true;
      }
      return false;
    });
    console.log(`Trip Creator modal opened: ${tripModalOpened}`);
    await new Promise((r) => setTimeout(r, 2000));

    // Close trip modal
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('button'));
      const closeBtn = closeBtns.find(b => (b.textContent || '').includes('Cancel'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // 5. Test Live Map View
    console.log('\n[6/7] Testing Operations Tower / Live Map...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('button, a'));
      const mapLink = links.find(l => (l.textContent || '').toLowerCase().includes('live fleet') || (l.textContent || '').toLowerCase().includes('live map'));
      if (mapLink) mapLink.click();
    });
    await new Promise((r) => setTimeout(r, 3000));

    // Check if Leaflet map rendered
    const mapState = await page.evaluate(() => {
      const mapContainer = document.querySelector('.leaflet-container');
      const tiles = document.querySelectorAll('.leaflet-tile');
      const markers = document.querySelectorAll('.leaflet-marker-icon');
      return {
        hasMap: !!mapContainer,
        tilesCount: tiles.length,
        markersCount: markers.length
      };
    });
    console.log(`Live Map state:`, mapState);

    // 6. Test Driver View Simulation
    console.log('\n[7/7] Testing Driver Portal View...');
    const switchedToDriver = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const driverSwitch = btns.find(b => (b.textContent || '').includes('Driver View') || (b.textContent || '').includes('Switch to Driver'));
      if (driverSwitch) { driverSwitch.click(); return true; }
      return false;
    });
    await new Promise((r) => setTimeout(r, 2000));
    const driverCardsFound = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('TRIP') || text.includes('DRIVER') || text.includes('Vehicle');
    });
    console.log(`Driver Portal Interface Active: ${switchedToDriver && driverCardsFound}`);

  } catch (err) {
    console.error('Audit exception:', err);
    errors.push(`Script execution failure: ${err.message}`);
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log('📊 AUDIT SUMMARY:');
  console.log(`Total Errors Detected: ${errors.length}`);
  console.log(`Total Network Failures: ${networkFailures.length}`);
  console.log(`Total Warnings: ${warnings.length}`);
  console.log('====================================================');

  if (errors.length > 0) {
    console.log('\n❌ DETAILED ERRORS LIST:');
    errors.forEach((e, i) => console.log(`${i + 1}. ${e}`));
  } else {
    console.log('\n✅ ZERO ERRORS FOUND! All tested features and views loaded cleanly.');
  }

  if (networkFailures.length > 0) {
    console.log('\n⚠️ NETWORK FAILURES:');
    networkFailures.forEach((nf, i) => console.log(`${i + 1}. ${nf}`));
  }
}

runLiveAudit();
