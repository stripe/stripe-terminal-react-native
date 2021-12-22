/* eslint-env detox/detox, jest */

const {
  navigateTo,
  connectReader,
  checkIfLogExist,
  disconnectReader,
  goBack,
  checkIfConnected,
  setSimulatedUpdatePlan,
  changeDiscoveryMethod,
} = require('./utils');

describe('Payments', () => {
  beforeAll(async () => {
    // await device.disableSynchronization();
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
    await disconnectReader();
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
    await disconnectReader();
  });

  it('Change discovery method to bluetooth proximity', async () => {
    await changeDiscoveryMethod('Bluetooth Proximity');
  });

  it('Change discovery method to Internet', async () => {
    await changeDiscoveryMethod('Internet');
  });

  // temporary skipped due to bug in stripe-termina-ios which connect the device despite an error.
  //
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('Required update impossible due to low battery', async () => {
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

    await device.reloadReactNative();
    await disconnectReader();
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

    await checkIfLogExist('terminal.createPaymentIntent');
    await checkIfLogExist('Created');
    await checkIfLogExist('terminal.collectPaymentMethod');
    await checkIfLogExist('terminal.didRequestReaderInput');
    await checkIfLogExist('terminal.didRequestReaderDisplayMessage');
    await checkIfLogExist('Collected');
    await checkIfLogExist('terminal.processPayment');
    await checkIfLogExist('Finished');

    await goBack('logs-back');
    await goBack('payment-back');

    // await disconnectReader();
  });

  it('Store card via readReusableCard', async () => {
    await navigateTo('Discover Readers');
    await connectReader();

    await navigateTo('Store card via readReusableCard');

    const eventLogTitle = element(by.text('EVENT LOG'));
    await waitFor(eventLogTitle).toBeVisible().withTimeout(16000);

    await checkIfLogExist('terminal.readReusableCard');

    if (device.getPlatform() === 'ios') {
      await checkIfLogExist('terminal.didRequestReaderInput');
      await checkIfLogExist('terminal.didRequestReaderDisplayMessage');
    }
    await checkIfLogExist('Finished');

    await goBack('logs-back');
    await goBack('payment-back');

    // await disconnectReader();
  });

  it('Store card via SetupIntent', async () => {
    await navigateTo('Discover Readers');
    await connectReader();

    await checkIfConnected();
    await element(by.id('home-screen')).scrollTo('bottom');

    await navigateTo('Store card via Setup Intents');

    const eventLogTitle = element(by.text('EVENT LOG'));
    await waitFor(eventLogTitle).toBeVisible().withTimeout(16000);

    await checkIfLogExist('terminal.createSetupIntent');
    await checkIfLogExist('terminal.collectSetupIntentPaymentMethod');
    await checkIfLogExist('terminal.didRequestReaderInput');
    await checkIfLogExist('terminal.didRequestReaderDisplayMessage');
    await checkIfLogExist('Created');
    await checkIfLogExist('terminal.confirmSetupIntent');
    await checkIfLogExist('Finished');

    await goBack('logs-back');
    await goBack('payment-back');

    // await disconnectReader();
  });

  it('In-Person Refund failed due to unsupported country', async () => {
    await navigateTo('Discover Readers');
    await connectReader('wisePad3');

    await checkIfConnected({ device: 'wisePad3' });
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

    await checkIfLogExist('terminal.collectRefundPaymentMethod');
    await checkIfLogExist('Collected');
    await checkIfLogExist('terminal.processRefund');
    await checkIfLogExist('Failed');

    await goBack('logs-back');
    await goBack('payment-back');

    // await disconnectReader();
  });
});
