/* eslint-env detox/detox, jest */

const navigateTo = async (buttonText) => {
  const button = element(by.text(buttonText));
  await waitFor(button).toBeVisible().withTimeout(16000);
  await button.tap();
};

const connectReader = async (name = 'chipper2X') => {
  await waitFor(element(by.text(`SimulatorID - ${name}`)))
    .toBeVisible()
    .withTimeout(16000);
  const button = element(by.text(`SimulatorID - ${name}`));
  await button.tap();
};

const setSelectedMerchant = async (acctId = 'CI US TEST ACCT (acct_1234)') => {
  const picker = element(by.id('select-merchant-picker'));
  await waitFor(picker).toBeVisible().withTimeout(16000);

  await picker.tap();

  if (device.getPlatform() === 'ios') {
    await element(by.type('UIPickerView')).setColumnToValue(0, acctId);
    await picker.tap();
  } else {
    await element(by.text(acctId)).tap();
  }
  await element(by.id('header-back')).tap();
};

const setSelectedCurrency = async (currency = 'USD') => {
  const picker = element(by.id('select-currency-picker'));
  await waitFor(picker).toBeVisible().withTimeout(16000);

  await picker.tap();

  if (device.getPlatform() === 'ios') {
    await element(by.id('select-currency-picker')).setColumnToValue(
      0,
      currency
    );
    await picker.tap();
  } else {
    await element(by.text(currency)).tap();
  }
};

const setSimulatedUpdatePlan = async (plan = 'Update required') => {
  const picker = element(by.id('update-plan-picker'));
  const touchable = element(by.id('close-picker'));
  await picker.tap();

  if (device.getPlatform() === 'ios') {
    await element(by.type('UIPickerView')).setColumnToValue(0, plan);
    await touchable.tap();
  } else {
    await element(by.text(plan)).tap();
  }
};

const checkIfConnected = async ({
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

const disconnectReader = async () => {
  const disconnectButton = element(by.id('disconnect-button'));
  await waitFor(disconnectButton).toBeVisible().withTimeout(16000);
  await disconnectButton.tap();
  await waitFor(element(by.text('Discover Readers')))
    .toBeVisible()
    .withTimeout(16000);
};

const checkIfLogExist = async (log) => {
  await element(by.id('scroll-view')).scrollTo('bottom');
  await waitFor(element(by.text(log)))
    .toBeVisible()
    .withTimeout(16000);
};

const discBtnMap = {
  'Internet': 'internet-btn',
  'Bluetooth Scan': 'bt-scn-btn',
  'Bluetooth Proximity': 'bt-prox-btn',
};

const changeDiscoveryMethod = async (method) => {
  await waitFor(element(by.id('online-indicator')))
    .toBeVisible()
    .withTimeout(10000);

  const btnId = discBtnMap[method];
  const button = element(by.id('discovery-method-button'));
  await waitFor(button).toBeVisible().withTimeout(10000);
  await button.tap();

  const targetMethodButton = element(by.id(btnId));
  await waitFor(targetMethodButton).toBeVisible().withTimeout(10000);
  await targetMethodButton.tap();

  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(10000);

  await waitFor(element(by.text(method)))
    .toBeVisible()
    .withTimeout(10000);
};

const goBack = async (label) => {
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

const createInteracPayment = async (reader = 'wisePad3') => {
  await navigateTo('Set Merchant');
  await setSelectedMerchant('CI CA TEST ACCT (acct_5555)');

  if (['verifoneP400', 'wisePosE'].includes(reader)) {
    await changeDiscoveryMethod('Internet');
  } else {
    await changeDiscoveryMethod('Bluetooth Scan');
  }

  await navigateTo('Discover Readers');
  await connectReader(reader);

  await navigateTo('Collect card payment');

  const amountInput = element(by.id('amount-text-field'));
  const cardNumberInput = element(by.id('card-number-text-field'));

  await waitFor(amountInput).toBeVisible().withTimeout(10000);
  await waitFor(cardNumberInput).toBeVisible().withTimeout(10000);

  // set interac test card
  await cardNumberInput.replaceText('4506445006931933');
  await cardNumberInput.tapReturnKey();

  await setSelectedCurrency('CAD');

  await waitFor(element(by.id('enable-interac')))
    .toBeVisible()
    .whileElement(by.id('collect-scroll-view'))
    .scroll(50, 'down');

  const enableInteracSwitch = element(by.id('enable-interac'));
  await waitFor(enableInteracSwitch).toBeVisible().withTimeout(10000);
  await enableInteracSwitch.tap();

  if (
    device.getPlatform() === 'ios' &&
    ['verifoneP400', 'wisePosE'].includes(reader)
  ) {
    await element(by.id('collect-scroll-view')).scroll(1000, 'down');
  }

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
  await checkIfLogExist('Confirmed');
};

const collectInteracRefund = async () => {
  await waitFor(element(by.text('In-Person Refund')))
    .toBeVisible()
    .withTimeout(10000);

  // Interac Payment complete, now let's refund it
  await navigateTo('In-Person Refund');

  const refundAmountInput = element(by.id('amount-text-field'));
  await waitFor(refundAmountInput).toBeVisible();

  await refundAmountInput.replaceText('100');
  await refundAmountInput.tapReturnKey();

  await element(by.id('refund-scroll-view')).scrollTo('bottom');

  const refundButton = element(by.id('collect-refund-button'));

  await waitFor(refundButton).toBeVisible();

  await refundButton.tap();

  const refundEventLogTitle = element(by.text('EVENT LOG'));
  await waitFor(refundEventLogTitle).toBeVisible().withTimeout(16000);

  await checkIfLogExist('Collect');
  await checkIfLogExist('Collected');
  await checkIfLogExist('Processing');
  await checkIfLogExist('Succeeded');
};

// Export functions for external use
module.exports = {
  navigateTo,
  connectReader,
  setSelectedMerchant,
  setSelectedCurrency,
  setSimulatedUpdatePlan,
  checkIfConnected,
  disconnectReader,
  checkIfLogExist,
  changeDiscoveryMethod,
  goBack,
  createInteracPayment,
  collectInteracRefund,
};
