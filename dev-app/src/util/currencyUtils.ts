// Zero-decimal currencies (amounts are specified in the currency unit, not its subdivision)
const ZERO_DECIMAL_CURRENCIES = [
  'jpy', 'krw', 'bif', 'clp', 'djf', 'gnf', 'isk', 'kmf',
  'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
];

export const formatAmountForDisplay = (amount: string, currency: string): string => {
  const numAmount = Number(amount);
  if (ZERO_DECIMAL_CURRENCIES.includes(currency.toLowerCase())) {
    return numAmount.toString();
  }
  return (numAmount / 100).toFixed(2);
};
