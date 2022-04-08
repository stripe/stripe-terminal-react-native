/* eslint-env detox/detox, jest */

const {
  navigateTo,
  connectReader,
  checkIfLogExist,
  checkIfConnected,
  changeDiscoveryMethod,
} = require('./utils');

const { cleanPaymentMethods } = require('./clean');

jest.retryTimes(5);

describe('Internet reader', () => {
  beforeAll(async () => {
    await cleanPaymentMethods();
  });

  beforeEach(async () => {
    await device.launchApp({
      permissions: { location: 'always' },
      newInstance: true,
    });
  });

  afterAll(async () => {
    await device.sendToHome();
  });

  it('Connect and disconnect', async () => {
    await changeDiscoveryMethod('Internet');
    await navigateTo('Discover Readers');
    await connectReader('verifoneP400');
    await checkIfConnected({ device: 'verifoneP400' });
  });

  it('Collect card payment', async () => {
    await changeDiscoveryMethod('Internet');
    await navigateTo('Discover Readers');
    await connectReader('verifoneP400');

    await navigateTo('Collect card payment');

    const currencyInput = element(by.id('currency-text-field'));
    const amountInput = element(by.id('amount-text-field'));

    await waitFor(currencyInput).toBeVisible().withTimeout(16000);
    await waitFor(amountInput).toBeVisible();

    await amountInput.replaceText('20000');
    await currencyInput.replaceText('USD');

    await element(by.id('collect-scroll-view')).scrollTo('bottom');

    const button = element(by.text('Collect payment'));

    await waitFor(button).toBeVisible();

    await button.tap();

    const eventLogTitle = element(by.text('EVENT LOG'));
    await waitFor(eventLogTitle).toBeVisible().withTimeout(16000);

    await checkIfLogExist('Create');
    await checkIfLogExist('Created');
    await checkIfLogExist('Collect');
    await checkIfLogExist('Collected');
    await checkIfLogExist('Process');
    await checkIfLogExist('Processed');
    await checkIfLogExist('Capture');
    await checkIfLogExist('Captured');
  });

  it('Store card via readReusableCard', async () => {
    await changeDiscoveryMethod('Internet');
    await navigateTo('Discover Readers');
    await connectReader('verifoneP400');

    await navigateTo('Store card via readReusableCard');

    const eventLogTitle = element(by.text('EVENT LOG'));
    await waitFor(eventLogTitle).toBeVisible().withTimeout(16000);

    await checkIfLogExist('Start');
    await checkIfLogExist('Finished');
  });

  it('Store card via SetupIntent', async () => {
    // Store card via SetupIntent is not available for verifoneP400 on iOS
    // while this is the only available simulated reader on Android
    const readerName =
      device.getPlatform() === 'ios' ? 'wisePosE' : 'verifoneP400';
    await changeDiscoveryMethod('Internet');
    await navigateTo('Discover Readers');
    await connectReader(readerName);

    await checkIfConnected({ device: readerName });
    await element(by.id('home-screen')).scrollTo('bottom');

    await navigateTo('Store card via Setup Intents');

    const eventLogTitle = element(by.text('EVENT LOG'));
    await waitFor(eventLogTitle).toBeVisible().withTimeout(16000);

    await checkIfLogExist('Create');
    await checkIfLogExist('Collect');
    await checkIfLogExist('Created');
    await checkIfLogExist('Process');
    await checkIfLogExist('Finished');
  });

  it('setReaderDisplay/clearReaderDisplay', async () => {
    // The only available verifoneP400 reader doesn't support setReaderDisplay funtionality in simulated mode.
    if (device.getPlatform() === 'android') {
      return;
    }
    await changeDiscoveryMethod('Internet');
    await navigateTo('Discover Readers');
    await connectReader('verifoneP400');

    await checkIfConnected({ device: 'verifoneP400' });
    await element(by.id('home-screen')).scrollTo('bottom');

    await navigateTo('Set reader display');

    const setButton = element(by.id('set-reader-display'));
    await waitFor(setButton).toBeVisible().withTimeout(10000);
    await setButton.tap();

    await waitFor(element(by.text('setReaderDisplay success')))
      .toBeVisible()
      .withTimeout(16000);

    const confirmAlertButton = element(by.text('OK'));
    await waitFor(confirmAlertButton).toBeVisible();
    await confirmAlertButton.tap();

    const clearButton = element(by.id('clear-reader-display'));
    await waitFor(clearButton).toBeVisible().withTimeout(10000);
    await clearButton.tap();

    await waitFor(element(by.text('clearReaderDisplay success')))
      .toBeVisible()
      .withTimeout(16000);
  });
});
