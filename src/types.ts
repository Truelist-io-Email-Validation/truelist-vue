/** Primary validation state returned by the Truelist API. */
export type ValidationState = "ok" | "email_invalid" | "accept_all" | "unknown";

/** Detailed sub-state providing more context about the validation result. */
export type ValidationSubState =
  | "email_ok"
  | "accept_all"
  | "is_disposable"
  | "is_role"
  | "failed_mx_check"
  | "failed_spam_trap"
  | "failed_no_mailbox"
  | "failed_greylisted"
  | "failed_syntax_check"
  | "unknown";

/** The result object returned after validating an email address. */
export type ValidationResult = {
  /** The email address that was validated. */
  email: string;
  /** The domain part of the email address. */
  domain: string;
  /** The canonical (local) part of the email address. */
  canonical: string;
  /** The MX record for the domain, if found. */
  mxRecord: string | null;
  /** First name associated with the email, if found. */
  firstName: string | null;
  /** Last name associated with the email, if found. */
  lastName: string | null;
  /** The primary validation state. */
  state: ValidationState;
  /** Detailed sub-state for the validation result. */
  subState: ValidationSubState;
  /** The timestamp when the email was verified. */
  verifiedAt: string;
  /** A suggested correction if a typo was detected (e.g. "user@gmail.com"). */
  suggestion: string | null;
};

/** Configuration for the Truelist provider and API client. */
export type TruelistConfig = {
  /** Your Truelist API key. */
  apiKey: string;
  /** Base URL for the Truelist API. Defaults to `https://api.truelist.io`. */
  baseUrl?: string;
};

/** Raw API response shape from the verify_inline endpoint. */
export type ApiEmailEntry = {
  address: string;
  domain: string;
  canonical: string;
  mx_record: string | null;
  first_name: string | null;
  last_name: string | null;
  email_state: ValidationState;
  email_sub_state: ValidationSubState;
  verified_at: string;
  did_you_mean: string | null;
};

/** Raw API response wrapper. */
export type ApiResponse = {
  emails: ApiEmailEntry[];
};
