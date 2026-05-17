const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:8000/admin.html');
  console.log("Navigated to admin.html");
  
  await page.fill('#login-email', 'aimc@bds');
  await page.fill('#login-password', 'aimcbds123123');
  
  console.log("Filled form. Clicking submit...");
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(2000);
  console.log("URL after submit:", page.url());
  
  await browser.close();
})();
