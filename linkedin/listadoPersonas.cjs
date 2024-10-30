const { chromium } = require('playwright');
const xlsx = require('xlsx');

const USERNAME = '';
const PASSWORD = '';
const COMPANY_NAME = 'Sema4.ai';
const URL = 'https://www.linkedin.com';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
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

    await page.waitForSelector('input[aria-label="Search"]');
    await page.fill('input[aria-label="Search"]', COMPANY_NAME);
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    await page.waitForSelector('button:has-text("Companies")');
    await page.click('button:has-text("Companies")');
    await page.waitForTimeout(2000);

    await page.waitForSelector('.reusable-search__entity-result-list');
    const firstCompanyLink = await page.$('.reusable-search__entity-result-list li:first-child a');
    if (!firstCompanyLink) {
      console.log('Empresa no encontrada. Abortando.');
      return;
    }
    await firstCompanyLink.click();
    await page.waitForTimeout(3000);

    await page.waitForSelector('nav[aria-label="Organization’s page navigation"] a[href*="/people/"]');
    await page.click('nav[aria-label="Organization’s page navigation"] a[href*="/people/"]');
    await page.waitForTimeout(3000);

    const profiles = [];
    let loadMoreButton;
    do {
      const cards = await page.$$('.org-people-profile-card');
      for (const card of cards) {
        const name = await card.$eval('.org-people-profile-card__profile-title', el => el.innerText);
        const title = await card.$eval('.artdeco-entity-lockup__subtitle', el => el.innerText);

        let profileUrl = null;
        try {
          profileUrl = await card.$eval('.app-aware-link', el => el.href);
        } catch (error) {
          console.warn(`No se encontró el enlace del perfil para ${name}`);
        }

        console.log(title.toLowerCase())
        if (!name.includes('LinkedIn') && title.toLowerCase().includes('founder') || title.toLowerCase().includes('recruiter') || title.toLowerCase().includes('head') || title.toLowerCase().includes('manager') || title.toLowerCase().includes('director') || title.toLowerCase().includes('leader')) {
          profiles.push({ name, title, profileUrl });
        }
      }

      loadMoreButton = await page.$('.scaffold-finite-scroll__load-button');
      if (loadMoreButton) {
        await loadMoreButton.click();
        await page.waitForTimeout(3000);
      }
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(3000);
    } while (loadMoreButton);

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(profiles);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Empleados');
    xlsx.writeFile(workbook, 'Empleados_Empresa.xlsx');

    console.log('Script completado. Datos guardados en Empleados_Empresa.xlsx');
  } catch (error) {
    console.error('Error ejecutando el script:', error);
  } finally {
    await browser.close();
  }
})();
