import { formatAmountForDisplay } from '../../util/currencyUtils';

describe('formatAmountForDisplay', () => {
  it('divides by 100 for standard currencies', () => {
    expect(formatAmountForDisplay('1000', 'usd')).toBe('10.00');
    expect(formatAmountForDisplay('199', 'eur')).toBe('1.99');
    expect(formatAmountForDisplay('50', 'gbp')).toBe('0.50');
  });

  it('returns integer string for zero-decimal currencies', () => {
    expect(formatAmountForDisplay('500', 'jpy')).toBe('500');
    expect(formatAmountForDisplay('1200', 'krw')).toBe('1200');
    expect(formatAmountForDisplay('300', 'vnd')).toBe('300');
  });

  it('handles zero amount', () => {
    expect(formatAmountForDisplay('0', 'usd')).toBe('0.00');
    expect(formatAmountForDisplay('0', 'jpy')).toBe('0');
  });

  it('is case-insensitive for currency codes', () => {
    expect(formatAmountForDisplay('500', 'JPY')).toBe('500');
    expect(formatAmountForDisplay('500', 'USD')).toBe('5.00');
  });
});
