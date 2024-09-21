require('dotenv').config();


// The url to change each time
const reservation_url = process.env.RESERVATION_URL;
// The desired time to book the court
const time_to_reserve = '19:59:58';
// variables for the court number
const court_number = '#u6510_btnButtonReservation1';
// variables for the person
const person_number = '#u3600_btnSelect1';

const puppeteer = require('puppeteer');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const browser = await puppeteer.launch({});

  const page = await browser.newPage();

  // Go to main page
  await page.goto(process.env.MAIN_URL);
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

  // Go to the website where we can reserve badminton
  console.log('waiting for target time...');

  // Function to wait until time is met
  function waitForCondition(target_time, interval = 200) {
    return new Promise((resolve, reject) => {
      const checkCondition = () => {

        now = new Date(); // Assume current time is June 7, 2024, 15:30:45
        hours = String(now.getHours()).padStart(2, '0');
        minutes = String(now.getMinutes()).padStart(2, '0');
        seconds = String(now.getSeconds()).padStart(2, '0');

        if (target_time === `${hours}:${minutes}:${seconds}`) {
          resolve();
        } else {
          setTimeout(checkCondition, interval);
        }
      };
      
      checkCondition();
    });
  }

  await waitForCondition(time_to_reserve);

  page.goto(reservation_url);

  // CHOOSE COURT
  try {
    //const timeout = 10000;
    const startTime = Date.now();

    await page.waitForSelector(court_number);

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    const previous = await page.url();
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

  await browser.close();
  process.exit();

})();
