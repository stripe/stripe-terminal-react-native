/* eslint-env detox/detox, jest */

export const navigateTo = async (buttonText: string) => {
  const button = element(by.text(buttonText));
  await waitFor(button).toBeVisible().withTimeout(16000);
  await button.tap();
};

export const connectReader = async (name?: string = 'chipper2X') => {
  await waitFor(element(by.text(`SimulatorID - ${name}`)))
    .toBeVisible()
    .withTimeout(16000);
  const button = element(by.text(`SimulatorID - ${name}`));
  await button.tap();
};

export const setSimulatedUpdatePlan = async (
  plan: string = 'Update required'
) => {
  const defaultPlan = 'No Update';
  const picker = element(by.id('update-plan-picker'));

  await picker.tap();

  if (device.getPlatform() === 'ios') {
    await element(by.type('UIPickerView')).setColumnToValue(0, plan);
    await picker.tap();
  } else {
    await element(by.text(plan)).tap();
  }
};

export const checkIfConnected = async ({
  timeout = 32000,
  device = 'chipper2X',
} = {}) => {
  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(timeout);

  await waitFor(element(by.text(device)))
    .toBeVisible()
    .withTimeout(timeout);
};

export const disconnectReader = async () => {
  const disconnectButton = element(by.id('disconnect-button'));
  await waitFor(disconnectButton).toBeVisible().withTimeout(16000);
  await disconnectButton.tap();
  await waitFor(element(by.text('Discover Readers')))
    .toBeVisible()
    .withTimeout(16000);
};

export const checkIfLogExist = async (log: string) => {
  await element(by.id('scroll-view')).scrollTo('bottom');
  await waitFor(element(by.text(log)))
    .toBeVisible()
    .withTimeout(16000);
};

export const changeDiscoveryMethod = async (method: string) => {
  const button = element(by.id('discovery-method-button'));
  await waitFor(button).toBeVisible().withTimeout(10000);
  await button.tap();

  const targetMethodButton = element(by.text(method));
  await waitFor(targetMethodButton).toBeVisible().withTimeout(10000);
  await targetMethodButton.tap();

  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(10000);

  await waitFor(element(by.text(method)))
    .toBeVisible()
    .withTimeout(10000);
};

export const goBack = async (label?: string) => {
  if (device.getPlatform() === 'android') {
    await device.pressBack();
  } else {
    if (label) {
      await element(by.label(label)).atIndex(0).tap();
    } else {
      await element(by.traits(['button']))
        .atIndex(0)
        .tap();
    }
  }
};
