const { chromium } = require('playwright');

const USERNAME = '';
const PASSWORD = '';
const URL = 'https://www.linkedin.com'

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Log in to LinkedIn
    await page.goto(URL);
    await page.waitForTimeout(1000);
    await page.click('.nav__button-secondary');
    await page.waitForTimeout(1000);
    await page.fill('#username', USERNAME);
    await page.waitForTimeout(500);
    await page.fill('#password', PASSWORD);
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.click('a[href*="/in/"]'); 
    await page.waitForTimeout(2000);

    const peopleList = await page.$$('section.pv-profile-card ul.glDPVVALGvpGwAzPhytksybyUcIQYANGHNUQ li');
    for (const person of peopleList) {
      const connectButton = await person.$('button[aria-label*="Invite"]');
      if (connectButton) {
        await connectButton.click(); 
        await page.waitForTimeout(500); 
      }
    }

    console.log('All possible connections sent!');
  } catch (error) {
    console.error('Error executing the script:', error);
  } finally {
    await browser.close();
  }
})();
