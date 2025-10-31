/**
 * Keys for platform-specific metadata in StripeError.metadata
 * These keys may or may not be present depending on the error type and platform.
 *
 * @example
 * ```typescript
 * import { StripeErrorMetadataKeys } from '@stripe/stripe-terminal-react-native';
 *
 * try {
 *   await terminal.confirmPaymentIntent();
 * } catch (error) {
 *   const statusCode = error.metadata[StripeErrorMetadataKeys.IOS_HTTP_STATUS_CODE] as number | undefined;
 *   if (statusCode) {
 *     console.log('HTTP Status:', statusCode);
 *   }
 * }
 * ```
 */
export const StripeErrorMetadataKeys = {
  /**
   * iOS only - Tap to Pay
   * Date until which the device is banned (ISO 8601 string)
   * Available when: Tap to Pay device is temporarily banned
   */
  IOS_DEVICE_BANNED_UNTIL_DATE: 'deviceBannedUntilDate',

  /**
   * iOS only - Tap to Pay
   * Reason why reader preparation failed
   * Available when: Tap to Pay reader fails to prepare
   */
  IOS_PREPARE_FAILED_REASON: 'prepareFailedReason',

  /**
   * iOS only
   * HTTP status code from Stripe API response
   * Available when: Error originates from Stripe API call
   */
  IOS_HTTP_STATUS_CODE: 'httpStatusCode',

  /**
   * iOS only
   * Message displayed on the reader device
   * Available when: Reader shows an error message
   */
  IOS_READER_MESSAGE: 'readerMessage',

  /**
   * iOS only
   * Stripe API request ID for debugging
   * Available when: Error originates from Stripe API call
   */
  IOS_STRIPE_API_REQUEST_ID: 'stripeAPIRequestId',

  /**
   * iOS only
   * Detailed failure reason from Stripe API
   * Available when: Error originates from Stripe API call
   */
  IOS_STRIPE_API_FAILURE_REASON: 'stripeAPIFailureReason',

  /**
   * iOS only
   * Reason for offline payment decline
   * Available when: Offline payment is declined
   */
  IOS_OFFLINE_DECLINE_REASON: 'offlineDeclineReason',
} as const;
