import type { Reader } from '../types';
import type { StripeError } from '../types/StripeError';

/** Removes wire provenance while keeping settings errors as plain objects. @internal */
export function stripReaderSettingsErrorSource(
  settings: Reader.ReaderSettings
): Reader.ReaderSettings {
  if (settings.error) return settings;

  const { accessibility, buzzerVolume } = settings;
  return {
    ...settings,
    ...(accessibility?.error && {
      accessibility: {
        ...accessibility,
        error: stripSource(accessibility.error),
      },
    }),
    ...(buzzerVolume?.error && {
      buzzerVolume: {
        ...buzzerVolume,
        error: stripSource(buzzerVolume.error),
      },
    }),
  };
}

function stripSource(
  error: StripeError & { error_source?: unknown }
): StripeError {
  const publicError = { ...error };
  delete publicError.error_source;
  return publicError;
}
