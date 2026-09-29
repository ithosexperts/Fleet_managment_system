const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  await page.goto('https://truck-tracker-api-9yhq.onrender.com/', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));

  // Click Manager login
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Operations Manager') || text.includes('Vikram') || text.includes('HQ Operations')) {
      await b.click();
      break;
    }
  }

  await new Promise((r) => setTimeout(r, 1000));
  const submitBtns = await page.$$('button');
  for (const b of submitBtns) {
    const text = (await (await b.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Sign In') || text.includes('Command Center')) {
      await b.click();
      break;
    }
  }

  await new Promise((r) => setTimeout(r, 4000));

  // 1. Overview
  await page.screenshot({ path: path.join(__dirname, '../docs/images/01-operations-overview.png') });

  // 2. Click 'Schedule' tab
  console.log('Clicking Schedule...');
  const navBtns = await page.$$('button, a');
  for (const el of navBtns) {
    const text = (await (await el.getProperty('innerText')).jsonValue()).trim();
    if (text === 'Schedule') {
      await el.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 3500));
  await page.screenshot({ path: path.join(__dirname, '../docs/images/02-dispatch-schedule-board.png') });

  // 3. Click 'Live Fleet' tab
  console.log('Clicking Live Fleet...');
  const navBtns2 = await page.$$('button, a');
  for (const el of navBtns2) {
    const text = (await (await el.getProperty('innerText')).jsonValue()).trim();
    if (text.includes('Live Fleet')) {
      await el.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(__dirname, '../docs/images/03-live-fleet-radar.png') });

  // 4. Click 'Documents' tab
  console.log('Clicking Documents...');
  const navBtns3 = await page.$$('button, a');
  for (const el of navBtns3) {
    const text = (await (await el.getProperty('innerText')).jsonValue()).trim();
    if (text === 'Documents' || text.includes('Documents')) {
      await el.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 3500));
  await page.screenshot({ path: path.join(__dirname, '../docs/images/04-compliance-documents-hub.png') });

  // 5. Click 'Reports' tab
  console.log('Clicking Reports...');
  const navBtns4 = await page.$$('button, a');
  for (const el of navBtns4) {
    const text = (await (await el.getProperty('innerText')).jsonValue()).trim();
    if (text === 'Reports' || text.includes('Reports')) {
      await el.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 3500));
  await page.screenshot({ path: path.join(__dirname, '../docs/images/05-delay-attribution-chart.png') });

  await browser.close();
  console.log('Desktop suite completed!');
}

run().catch(console.error);
