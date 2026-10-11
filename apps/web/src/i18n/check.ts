export type MessageCheck = {
  /** Keys present in the reference file but missing here. These fail the check. */
  missing: string[];
  /** Keys not present in the reference file. These are only warnings. */
  extra: string[];
  /** Keys whose value is not a non-empty string. These fail the check. */
  invalid: string[];
};

export function compareKeys(reference: object, messages: object): MessageCheck {
  const referenceKeys = Object.keys(reference);
  const keys = Object.keys(messages);
  return {
    missing: referenceKeys.filter((key) => !keys.includes(key)),
    extra: keys.filter((key) => !referenceKeys.includes(key)),
    invalid: Object.entries(messages)
      .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
      .map(([key]) => key),
  };
}
