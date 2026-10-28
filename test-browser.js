import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173');
  
  await page.evaluate(() => {
    sessionStorage.setItem('momo_token', 'fake-token');
    sessionStorage.setItem('momo_user', JSON.stringify({ id: 'demo', role: 'OWNER', name: 'Demo' }));
  });
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.evaluate(() => document.getElementById('root')?.innerHTML || 'ROOT NOT FOUND');
  console.log('HTML CONTENT:', content);
  
  await browser.close();
})();
