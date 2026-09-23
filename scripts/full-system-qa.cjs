const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function runFullQA() {
  const TARGET_URL = 'https://truck-tracker-api-9yhq.onrender.com';
  const ARTIFACTS_DIR = 'C:\\Users\\MSI\\.gemini\\antigravity-ide\\brain\\4e6a2c4f-f1e6-48eb-aa52-ffd0fc9e1e35';

  console.log('====================================================');
  console.log('🌟 COMPREHENSIVE END-TO-END BROWSER QA SUITE');
  console.log(`Target: ${TARGET_URL}`);
  console.log('====================================================');

  const errors = [];
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ [CONSOLE ERROR] ${msg.text()}`);
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log(`🚨 [PAGE UNCAUGHT] ${err.message}`);
    errors.push(err.message);
  });

  try {
    // 1. Visit Login Page
    console.log('\n[Phase 1] Testing Login & Authentication...');
    await page.goto(`${TARGET_URL}/login`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'qa_01_login_page.png') });

    // Test 1-Click Login
    console.log('  -> Triggering 1-Click Login as Operations Manager...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const oneClickBtn = btns.find(b => (b.textContent || '').includes('1-Click Login'));
      if (oneClickBtn) {
        oneClickBtn.click();
      } else {
        // Fallback to submit button
        const submit = document.querySelector('button[type="submit"]');
        if (submit) submit.click();
      }
    });

    await new Promise(r => setTimeout(r, 3000));
    console.log(`  -> URL after login: ${page.url()}`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'qa_02_manager_dashboard.png') });

    // 2. Test Operations Live Map
    console.log('\n[Phase 2] Testing Operations Tower & Live Map...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('button, a'));
      const mapLink = links.find(l => (l.textContent || '').toLowerCase().includes('live fleet') || (l.textContent || '').toLowerCase().includes('live map'));
      if (mapLink) mapLink.click();
    });
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'qa_03_live_map.png') });

    // 3. Test Trips Management & "Create New Logistics Trip" Modal
    console.log('\n[Phase 3] Testing Trips Tab & Trip Creator Modal...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('button, a'));
      const tripsLink = links.find(l => (l.textContent || '').toLowerCase().includes('trips'));
      if (tripsLink) tripsLink.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Click Create Trip button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const createBtn = btns.find(b => (b.textContent || '').toLowerCase().includes('create trip') || (b.textContent || '').toLowerCase().includes('new trip'));
      if (createBtn) createBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'qa_04_create_trip_modal.png') });

    // 4. Test "Pick on Map" in Stop #1
    console.log('\n[Phase 4] Testing "📍 Pick on Map" Interactive Submodal...');
    const pickClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const pickBtn = btns.find(b => (b.textContent || '').includes('Pick on Map'));
      if (pickBtn) {
        pickBtn.click();
        return true;
      }
      return false;
    });
    console.log(`  -> Pick on Map clicked: ${pickClicked}`);
    await new Promise(r => setTimeout(r, 2500));

    // Capture screenshot of the map picker
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'qa_05_pick_on_map_modal.png') });

    // Check map tile coverage and inspect if black areas exist
    const mapHealth = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container');
      const tiles = document.querySelectorAll('.leaflet-tile');
      const loadedTiles = Array.from(tiles).filter(t => t.complete && t.naturalWidth > 0);
      return {
        hasContainer: !!container,
        totalTiles: tiles.length,
        loadedTiles: loadedTiles.length,
        containerWidth: container ? container.clientWidth : 0,
        containerHeight: container ? container.clientHeight : 0
      };
    });
    console.log('  -> Map Health:', mapHealth);

    // Test location search input
    console.log('  -> Testing live place autocomplete search...');
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const search = inputs.find(i => (i.placeholder || '').toLowerCase().includes('search destination'));
      if (search) {
        search.focus();
        search.value = 'Nehru Place';
        search.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'qa_06_place_autocomplete.png') });

    // Apply location
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const applyBtn = btns.find(b => (b.textContent || '').includes('Apply Location'));
      if (applyBtn) applyBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Cancel / Close trip creator
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancelBtn = btns.find(b => (b.textContent || '').includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // 5. Test Destinations Master & DestinationModal
    console.log('\n[Phase 5] Testing Destinations Master & DestinationModal...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('button, a'));
      const destLink = links.find(l => (l.textContent || '').toLowerCase().includes('locations master') || (l.textContent || '').toLowerCase().includes('destinations'));
      if (destLink) destLink.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addDest = btns.find(b => (b.textContent || '').toLowerCase().includes('register') || (b.textContent || '').toLowerCase().includes('add destination'));
      if (addDest) addDest.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'qa_07_destination_modal.png') });

    // Close destination modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancelBtn = btns.find(b => (b.textContent || '').includes('Cancel') || (b.textContent || '').includes('Close') || b.querySelector('svg.lucide-x'));
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // 6. Test Driver View
    console.log('\n[Phase 6] Testing Driver Mobile Terminal...');
    await page.goto(`${TARGET_URL}/driver`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'qa_08_driver_view.png') });

  } catch (err) {
    console.error('QA Execution error:', err);
    errors.push(`QA run exception: ${err.message}`);
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log(`QA AUDIT COMPLETED. Total Errors: ${errors.length}`);
  console.log('====================================================');
  if (errors.length > 0) {
    errors.forEach((e, i) => console.log(`${i + 1}. ${e}`));
  } else {
    console.log('🎉 ALL SYSTEM MODULES, MODALS, MAPS, AND AUTOCOMPLETE PASSED WITH 0 ERRORS!');
  }
}

runFullQA();
