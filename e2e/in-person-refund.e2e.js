/* eslint-env detox/detox, jest */

const {
  navigateTo,
  connectReader,
  checkIfLogExist,
  checkIfConnected,
  changeDiscoveryMethod,
  setSelectedMerchant,
} = require('./utils');

jest.retryTimes(3);

describe('In-Person Refund', () => {
  beforeEach(async () => {
    await device.launchApp({
      permissions: { location: 'always' },
      newInstance: true,
    });
  });

  afterAll(async () => {
    await device.sendToHome();
  });

  it.skip('Collect CA card payment', async () => {
    await navigateTo('Set Merchant');
    await setSelectedMerchant('CI CA TEST ACCT (acct_5555)');

    await navigateTo('Discover Readers');
    await connectReader('wisePad3');

    await navigateTo('Collect card payment');

    const currencyInput = element(by.id('currency-text-field'));
    const amountInput = element(by.id('amount-text-field'));
    const cardNumberInput = element(by.id('card-number-text-field'));

    await waitFor(currencyInput).toBeVisible().withTimeout(16000);
    await waitFor(amountInput).toBeVisible().withTimeout(10000);
    await waitFor(cardNumberInput).toBeVisible().withTimeout(10000);

    const enableInteracSwitch = element(by.id('enable-interac'));
    await waitFor(enableInteracSwitch).toBeVisible().withTimeout(10000);
    await enableInteracSwitch.tap();

    await amountInput.replaceText('20000');
    await currencyInput.replaceText('CAD');

    // set interac test card
    await cardNumberInput.replaceText('4506445006931933');

    await element(by.id('collect-scroll-view')).scrollTo('bottom');

    const capturePaymentIntentSwitch = element(by.id('capture-payment-intent'));
    await waitFor(capturePaymentIntentSwitch).toBeVisible().withTimeout(10000);
    // do not capture PI because this specific card number captures it automatically.
    await capturePaymentIntentSwitch.tap();

    await element(by.id('collect-scroll-view')).scrollTo('bottom');

    const button = element(by.text('Collect payment'));

    await waitFor(button).toBeVisible().withTimeout(10000);

    await button.tap();

    const eventLogTitle = element(by.text('EVENT LOG'));
    await waitFor(eventLogTitle).toBeVisible().withTimeout(16000);

    await checkIfLogExist('Create');
    await checkIfLogExist('Created');
    await checkIfLogExist('Collect');
    await checkIfLogExist('Collected');
    await checkIfLogExist('Process');
    await checkIfLogExist('Processed');
  });

  it.skip('via bluetooth reader', async () => {
    // Temporary skipped on Android due to some issues with refunding payments
    if (device.getPlatform() === 'android') {
      return;
    }
    await navigateTo('Set Merchant');
    await setSelectedMerchant('CI CA TEST ACCT (acct_5555)');

    await navigateTo('Discover Readers');
    await connectReader('wisePad3');

    await checkIfConnected({ device: 'wisePad3' });
    await element(by.id('home-screen')).scrollTo('bottom');

    await navigateTo('In-Person Refund');

    const amountInput = element(by.id('amount-text-field'));
    await waitFor(amountInput).toBeVisible();

    await amountInput.replaceText('100');

    await element(by.id('refund-scroll-view')).scrollTo('bottom');

    const button = element(by.id('collect-refund-button'));

    await waitFor(button).toBeVisible();

    await button.tap();

    const eventLogTitle = element(by.text('EVENT LOG'));
    await waitFor(eventLogTitle).toBeVisible().withTimeout(16000);

    await checkIfLogExist('Collect');
    await checkIfLogExist('Collected');
    await checkIfLogExist('Processing');
    await checkIfLogExist('Succeeded');
  });

  it.skip('via internet reader', async () => {
    // Temporary skipped on Android due to some issues with refunding payments
    if (device.getPlatform() === 'android') {
      return;
    }
    await navigateTo('Set Merchant');
    await setSelectedMerchant('CI CA TEST ACCT (acct_5555)');

    await changeDiscoveryMethod('Internet');
    await navigateTo('Discover Readers');
    await connectReader('verifoneP400');

    await checkIfConnected({ device: 'verifoneP400' });
    await element(by.id('home-screen')).scrollTo('bottom');

    await navigateTo('In-Person Refund');

    const amountInput = element(by.id('amount-text-field'));
    await waitFor(amountInput).toBeVisible();

    await amountInput.replaceText('100');

    await element(by.id('refund-scroll-view')).scrollTo('bottom');

    const button = element(by.id('collect-refund-button'));

    await waitFor(button).toBeVisible();

    await button.tap();

    const eventLogTitle = element(by.text('EVENT LOG'));
    await waitFor(eventLogTitle).toBeVisible().withTimeout(16000);

    await checkIfLogExist('Collect');
    await checkIfLogExist('Collected');
    await checkIfLogExist('Processing');
    await checkIfLogExist('Succeeded');
  });
});
