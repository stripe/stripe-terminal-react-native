/* eslint-env detox/detox, jest */

const {
  navigateTo,
  connectReader,
  checkIfConnected,
  collectInteracRefund,
  changeDiscoveryMethod,
  createInteracPayment,
} = require('./utils');

jest.retryTimes(3);

// TODO(nazli): Investigate flakiness (TERMINAL-41034)
// eslint-disable-next-line jest/no-disabled-tests
describe.skip('In-Person Refund', () => {
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
    await changeDiscoveryMethod('Bluetooth Scan');
    await navigateTo('Discover Readers');
    await connectReader();
    await checkIfConnected();
  });

  it('Collect and Refund CA card payment via bt reader', async () => {
    // android cannot currently refund via the simulator
    if (device.getPlatform() === 'android') {
      return;
    }
    await createInteracPayment();

    const backEl = element(by.text('Back'));
    await waitFor(backEl).toBeVisible().withTimeout(10000);
    await backEl.tap();

    await collectInteracRefund();
  });

  it('Collect and Refund CA card payment via smart reader', async () => {
    // android cannot currently refund via the simulator
    if (device.getPlatform() === 'android') {
      return;
    }
    await createInteracPayment('verifoneP400');

    const backEl = element(by.text('Back'));
    await waitFor(backEl).toBeVisible().withTimeout(10000);
    await backEl.tap();

    await collectInteracRefund();
  });
});
