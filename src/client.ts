import type { ApiResponse, TruelistConfig, ValidationResult } from "./types";

const DEFAULT_BASE_URL = "https://api.truelist.io";

export class TruelistApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "TruelistApiError";
  }
}

/**
 * Validates an email address using the Truelist API.
 *
 * Works in browsers and edge runtimes (uses `fetch`, no Node.js-specific APIs).
 *
 * @param email - The email address to validate.
 * @param config - API key and optional base URL.
 * @param signal - Optional AbortSignal to cancel the request.
 * @returns The validation result.
 * @throws {TruelistApiError} When the API returns a non-OK response.
 */
export async function verifyEmail(
  email: string,
  config: TruelistConfig,
  signal?: AbortSignal
): Promise<ValidationResult> {
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  const url = `${baseUrl}/api/v1/verify_inline?email=${encodeURIComponent(email)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    signal,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new TruelistApiError(
        "Rate limit exceeded. Please try again later.",
        429
      );
    }

    if (response.status === 401) {
      throw new TruelistApiError(
        "Invalid API key. Check your Truelist API key.",
        401
      );
    }

    throw new TruelistApiError(
      `Truelist API error: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  const data: ApiResponse = await response.json();
  const entry = data.emails[0];

  if (!entry) {
    throw new TruelistApiError("No email result returned from Truelist API.");
  }

  return {
    email: entry.address,
    domain: entry.domain,
    canonical: entry.canonical,
    mxRecord: entry.mx_record,
    firstName: entry.first_name,
    lastName: entry.last_name,
    state: entry.email_state,
    subState: entry.email_sub_state,
    verifiedAt: entry.verified_at,
    suggestion: entry.did_you_mean,
  };
}
