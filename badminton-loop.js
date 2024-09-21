require('dotenv').config();

// The url to change each time
const reservation_url = process.env.RESERVATION_URL;
// variables for the court number
const court_number = '#u6510_btnButtonReservation0';
// variables for the person
const person_number = '#u3600_btnSelect1';

const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SENDER,
      pass: process.env.GMAILPASS,
    },
  });

  const mailOptions = {
    from: process.env.SENDER,
    to: process.env.SENDER,
    subject: 'Puppeteer Script Notification',
    text: 'Finished',
  };

  const browser = await puppeteer.launch({
  });

  const page = await browser.newPage();

  // Go to main page
  await page.goto('https://loisirs.montreal.ca/IC3/#/U2010');
  console.log('went to main page');
  await page.deleteCookie();

  // Click on login
  await page.waitForSelector('#u2000_btnSignIn');
  await page.waitForFunction(() => {
    return document.querySelector('#u2000_btnSignIn') !== null;
  });
  await sleep(5000); // wait to make sure button is interactable with
  await page.click('#u2000_btnSignIn');
  console.log('clicked connection button');

  // Fill in login form
  //await page.waitForSelector('#loginForm\:username');
  await page.waitForSelector('#loginForm\\:username');
  await page.type('#loginForm\\:username', process.env.USERNAME);
  console.log('filled username');

  await page.waitForSelector('#loginForm\\:password');
  await page.type('#loginForm\\:password', process.env.PASSWORD);
  console.log('filled pw');

  // Submit the login form
  await page.click('#loginForm\\:loginButton');
  console.log('submitted login form');

  await page.goto(reservation_url);

  // CHOOSE COURT
  try {

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    let success = false;

    const previous = await page.url();

    page.goto(reservation_url);

    while (!success) {

      await page.waitForSelector('#u2000_searchResultCount');

      try {
        await page.waitForSelector(court_number, { timeout: 500 });
      }
      catch (error) {
      }

      let courtButton = false;

      try {
        courtButton = await page.$(court_number);
      }
      catch (error) {
      }

      const startTime = Date.now();

      if (courtButton) {
        while (Date.now() - startTime < 10000) {
          try {
            await page.click(court_number);
            const currentURL = await page.url();
            if (currentURL !== previous) {
                break; // Exit the loop if the button was clicked successfully
              }
          } catch (error) {
          }
        }
      }
      if(courtButton) {
        break;
      }
      page.reload();
    }

  } catch (error) {
    console.error('Button for choosing court not found within the specified time:', error);
  }

  // CHOOSE PERSON
  try {
    const startTime = Date.now();

    await page.waitForSelector(person_number);

    while (Date.now() - startTime < 10000) { // Set a timeout after 10s
      try {
        await page.click(person_number);
        const memberSelected = await page.evaluate(() => {
            // Check if the button changed status
            return document.querySelector(person_number).getAttribute('ng-if') === 'member.selected == true';
        });
        if (memberSelected) {
            break; // Exit the loop if the button was clicked successfully
        }
      } catch (error) {
      }
    }

  } catch (error) {
    console.error('Button for choosing person was error', error);
  }

  await console.log('finished');

  const infor = await transporter.sendMail(mailOptions);

  await browser.close();
  process.exit();

})();
