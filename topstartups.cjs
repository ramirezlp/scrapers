const { chromium } = require('playwright');
const xlsx = require('xlsx');

async function scrapeStartups() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    //await page.goto('https://topstartups.io/?company_size=11-50+employees');
    await page.goto('https://topstartups.io/?company_size=51-100+employees');
    //https://topstartups.io/?company_size=51-100+employees

    async function scrapePage() {
        return await page.evaluate(() => {
            const startups = [];
            const items = document.querySelectorAll('#item-card-filter');

            items.forEach((item) => {
                const nameElement = item.querySelector('h3');
                const hqElement = item.querySelector('p:nth-child(6)');
                const industryElements = item.querySelectorAll('span#industry-tags');
                const fundingElement = item.querySelector('p:nth-child(8)');
                const websiteElement = item.querySelector('a[target="_blank"]');

                const name = nameElement && nameElement.textContent ? nameElement.textContent.trim() : 'N/A';
                const hq = hqElement && hqElement.textContent ? hqElement.textContent.split('📍HQ: ')[1]?.trim() : 'N/A';
                const industry = industryElements.length > 0 ? Array.from(industryElements).map((el) => el.textContent?.trim()).join(', ') : 'N/A';
                const funding = fundingElement && fundingElement.textContent ? fundingElement.textContent.trim() : 'N/A';
                const website = websiteElement ? websiteElement.href : 'N/A';

                startups.push({
                    name: name || 'N/A',
                    hq: hq || 'N/A',
                    industry: industry || 'N/A',
                    funding: funding || 'N/A',
                    website: website || 'N/A'
                });
            });

            return startups;
        });
    }

    let allStartups = [];
    let hasMorePages = true;

    while (hasMorePages) {
        const startups = await scrapePage();
        allStartups = allStartups.concat(startups);

        const showMoreButton = await page.$('#load-button');
        if (showMoreButton) {
            await showMoreButton.click();
            await page.waitForTimeout(2000);
        } else {
            hasMorePages = false;
        }
    }

    const workbook = xlsx.utils.book_new();
    const worksheetData = allStartups.map((startup) => [
        startup.name,
        startup.hq,
        startup.industry,
        startup.funding,
        startup.website,
    ]);
    const worksheet = xlsx.utils.aoa_to_sheet([['Name', 'HQ', 'Industry', 'Funding', 'Website'], ...worksheetData]);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Startups');

    xlsx.writeFile(workbook, 'startups_51_100.xlsx');

    console.log('Data has been scraped and saved to startups.xlsx');
    await browser.close();
}

scrapeStartups().catch((error) => {
    console.error('Error:', error);
});
