import type { IPaymentMethodType } from '../types';

export const DEFAULT_ENABLED_PAYMENT_METHOD_TYPES = ['card_present'];

export const PAYMENT_METHOD_TYPES = [
  'ach_debit',
  'acss_debit',
  'affirm',
  'afterpay_clearpay',
  'alipay',
  'alma',
  'amazon_pay',
  'au_becs_debit',
  'bacs_debit',
  'bancontact',
  'billie',
  'blik',
  'boleto',
  'boleto_pilot',
  'card',
  'card_present',
  'cashapp',
  'crypto',
  'customer_balance',
  'demo_pay',
  'duitnow',
  'dummy_auth_push',
  'dummy_passthrough_card',
  'eps',
  'fpx',
  'giropay',
  'grabpay',
  'gopay',
  'id_bank_transfer',
  'id_credit_transfer',
  'ideal',
  'interac_present',
  'kakao_pay',
  'klarna',
  'knet',
  'konbini',
  'kr_market',
  'link',
  'mobilepay',
  'multibanco',
  'naver_pay',
  'netbanking',
  'ng_market',
  'nz_bank_account',
  'oxxo',
  'p24',
  'pay_by_bank',
  'paynow',
  'paypal',
  'payto',
  'pix',
  'promptpay',
  'qris',
  'rechnung',
  'revolut_pay',
  'sepa_debit',
  'sofort',
  'south_korea_market',
  'sunbit',
  'swish',
  'twint',
  'upi',
  'us_bank_account',
  'vipps',
  'wechat_pay',
  'zip',
];

export const getEnabledPaymentMethodTypes = (
  paymentMethodTypes: IPaymentMethodType[]
): string[] =>
  paymentMethodTypes.reduce((selected, t) => {
    if (t.enabled) {
      selected.push(t.type);
    }
    return selected;
  }, [] as string[]);
