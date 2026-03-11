const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 2000 });
    await page.goto('http://localhost:3001/daily-epaper/print/2026-03-09', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'screenshot.jpg', fullPage: true });
    await browser.close();
})();
