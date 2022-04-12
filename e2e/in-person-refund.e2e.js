/* eslint-env detox/detox, jest */

const { collectInteracRefund, createInteracPayment } = require('./utils');

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

  it('Collect and Refund CA card payment via bt reader', async () => {
    await createInteracPayment();

    // android cannot currently refund via the simulator
    if (device.getPlatform() === 'android') {
      return;
    }

    const backEl = element(by.text('Back'));
    await waitFor(backEl).toBeVisible().withTimeout(10000);
    await backEl.tap();

    await collectInteracRefund();
  });

  it('Collect and Refund CA card payment via smart reader', async () => {
    await createInteracPayment('verifoneP400');

    // android cannot currently refund via the simulator
    if (device.getPlatform() === 'android') {
      return;
    }

    const backEl = element(by.text('Back'));
    await waitFor(backEl).toBeVisible().withTimeout(10000);
    await backEl.tap();

    await collectInteracRefund();
  });
});
