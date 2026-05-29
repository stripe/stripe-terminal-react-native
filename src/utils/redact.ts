const REDACTED_PLACEHOLDER = '<REDACTED>';

/**
 * Field names that must be redacted in logs, derived from fields annotated
 * with `(com.stripe.proto.extension.redacted) = true` in mainland_requests.proto
 * and jack_rabbit_service.proto.
 *
 * Proto field names are mapped to their camelCase equivalents used in the RN SDK.
 */
const REDACTED_FIELD_NAMES: ReadonlySet<string> = new Set([
  'clientSecret',
  'metadata',
  'receiptEmail',
  'emvAuthData',
  'cardholderName',
  'applicationCryptogram',
  'statementDescriptor',
  'statementDescriptorSuffix',
  'surchargeNotice',
]);

/**
 * Parent-scoped redaction: when the parent key matches an entry here,
 * any child field in the associated set is redacted.
 *
 * This avoids false positives for common field names (e.g. "expMonth")
 * that should only be redacted inside specific parent objects.
 */
const CARD_EXP_FIELDS: ReadonlySet<string> = new Set([
  'expMonth',
  'expYear',
]);

const ADDRESS_FIELDS: ReadonlySet<string> = new Set([
  'city',
  'country',
  'postalCode',
  'line1',
  'line2',
  'state',
]);

const PARENT_SCOPED_REDACTIONS: ReadonlyMap<string, ReadonlySet<string>> =
  new Map([
    [
      'collectInputResults',
      new Set([
        'selection',
        'selectionId',
        'signatureSvg',
        'phone',
        'email',
        'text',
        'numericString',
      ]),
    ],
    ['cardPresentDetails', CARD_EXP_FIELDS],
    ['interacPresentDetails', CARD_EXP_FIELDS],
    ['cardDetails', CARD_EXP_FIELDS],
    ['consent', new Set(['notice'])],
    ['address', ADDRESS_FIELDS],
  ]);

function shouldRedact(key: string, parentKey?: string): boolean {
  if (REDACTED_FIELD_NAMES.has(key)) {
    return true;
  }
  if (parentKey) {
    const scopedFields = PARENT_SCOPED_REDACTIONS.get(parentKey);
    if (scopedFields?.has(key)) {
      return true;
    }
  }
  return false;
}

export function stringifyRedacted(input: unknown): string {
  return JSON.stringify(redactForLogging(input));
}

/**
 * Deep-clones an object and replaces the values of sensitive fields with
 * a redaction placeholder. Handles nested objects, arrays, and raw string
 * arguments that match the client secret pattern.
 */
export function redactForLogging(
  input: unknown,
  parentKey?: string
): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactForLogging(item, parentKey));
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (shouldRedact(key, parentKey) && value !== undefined && value !== null) {
      redacted[key] = REDACTED_PLACEHOLDER;
    } else {
      redacted[key] = redactForLogging(value, key);
    }
  }
  return redacted;
}
