/* eslint-env detox/detox, jest */

const {
  navigateTo,
  connectReader,
  checkIfLogExist,
  checkIfConnected,
  setSimulatedUpdatePlan,
  changeDiscoveryMethod,
} = require('./utils');

const { cleanPaymentMethods } = require('./clean');

jest.retryTimes(3);

describe('Payments', () => {
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
    await navigateTo('Discover Readers');
    await connectReader();
    await checkIfConnected();
  });

  it('Install required update and connect', async () => {
    await navigateTo('Discover Readers');
    await setSimulatedUpdatePlan();
    await connectReader();

    await waitFor(element(by.text('Required update in progress')))
      .toBeVisible()
      .withTimeout(16000);

    await checkIfConnected({
      timeout: device.getPlatform() === 'ios' ? 32000 : 60000,
    });
  });

  it('Change discovery method to bluetooth proximity', async () => {
    if (device.getPlatform() !== 'ios') {
      return;
    }
    await changeDiscoveryMethod('Bluetooth Proximity');
  });

  it('Change discovery method to Internet', async () => {
    await changeDiscoveryMethod('Internet');
  });

  it('Change discovery method to Embedded', async () => {
    if (device.getPlatform() !== 'android') {
      return;
    }
    await changeDiscoveryMethod('Embedded');
  });

  it('Change discovery method to LocalMobile', async () => {
    if (device.getPlatform() !== 'android') {
      return;
    }
    await changeDiscoveryMethod('Local mobile');
  });

  it('Change discovery method to Handoff', async () => {
    if (device.getPlatform() !== 'android') {
      return;
    }
    await changeDiscoveryMethod('Handoff');
  });

  // temporary skipped due to bug in stripe-termina-ios that connects the device despite an error.
  //
  it('Required update impossible due to low battery', async () => {
    // only iOS supports simulated low battery plan
    if (device.getPlatform() !== 'ios') {
      return;
    }
    await navigateTo('Discover Readers');
    await setSimulatedUpdatePlan('Update required; reader has low battery');
    await connectReader();
    await waitFor(
      element(
        by.text(
          "Updating the reader software failed because the reader's battery is too low. Charge the reader before trying again."
        )
      )
    )
      .toBeVisible()
      .withTimeout(16000);
  });

  it('Collect card payment', async () => {
    await navigateTo('Discover Readers');
    await connectReader();

    await navigateTo('Collect card payment');

    const currencyInput = element(by.id('currency-text-field'));
    const amountInput = element(by.id('amount-text-field'));

    await waitFor(currencyInput).toBeVisible().withTimeout(16000);
    await waitFor(amountInput).toBeVisible();

    await amountInput.replaceText('20000');
    await currencyInput.replaceText('USD');

    const button = element(by.text('Collect payment'));

    await waitFor(button).toBeVisible();

    await button.tap();

    const eventLogTitle = element(by.text('EVENT LOG'));
    await waitFor(eventLogTitle).toBeVisible().withTimeout(16000);

    await checkIfLogExist('Create');
    await checkIfLogExist('Created');
    await checkIfLogExist('Collect');
    await checkIfLogExist('insertCard / swipeCard / tapCard');
    await checkIfLogExist('removeCard');
    await checkIfLogExist('Collected');
    await checkIfLogExist('Process');
    await checkIfLogExist('Processed');
    await checkIfLogExist('Capture');
    await checkIfLogExist('Captured');
  });

  it('Store card via readReusableCard', async () => {
    await navigateTo('Discover Readers');
    await connectReader();

    await navigateTo('Store card via readReusableCard');

    const eventLogTitle = element(by.text('EVENT LOG'));
    await waitFor(eventLogTitle).toBeVisible().withTimeout(16000);

    await checkIfLogExist('Start');

    if (device.getPlatform() === 'ios') {
      await checkIfLogExist('insertCard / swipeCard');
      await checkIfLogExist('removeCard');
    }
    await checkIfLogExist('Finished');
  });

  it('Store card via SetupIntent', async () => {
    await navigateTo('Discover Readers');
    await connectReader();

    await checkIfConnected();
    await element(by.id('home-screen')).scrollTo('bottom');

    await navigateTo('Store card via Setup Intents');

    const eventLogTitle = element(by.text('EVENT LOG'));
    await waitFor(eventLogTitle).toBeVisible().withTimeout(16000);

    await checkIfLogExist('Create');
    await checkIfLogExist('Collect');
    await checkIfLogExist('insertCard / swipeCard / tapCard');
    await checkIfLogExist('removeCard');
    await checkIfLogExist('Created');
    await checkIfLogExist('Process');
    await checkIfLogExist('Finished');
  });

  it('In-Person Refund failed due to unsupported country', async () => {
    await navigateTo('Discover Readers');
    await connectReader('chipper2X');

    await checkIfConnected({ device: 'chipper2X' });
    await element(by.id('home-screen')).scrollTo('bottom');

    await navigateTo('In-Person Refund');

    const chargeIdInout = element(by.id('charge-id-text-field'));
    const amountInput = element(by.id('amount-text-field'));

    await waitFor(chargeIdInout).toBeVisible().withTimeout(16000);
    await waitFor(amountInput).toBeVisible();

    await amountInput.replaceText('20000');
    await chargeIdInout.replaceText('ch_3JxsjUBDuqlYGNW21EL8UyOm');

    const button = element(by.id('collect-refund-button'));

    await waitFor(button).toBeVisible();

    await button.tap();

    const eventLogTitle = element(by.text('EVENT LOG'));
    await waitFor(eventLogTitle).toBeVisible().withTimeout(16000);

    await checkIfLogExist('Collect');
    await checkIfLogExist('Failed');
  });
});
