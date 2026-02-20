// Provider
export { TruelistProvider, TRUELIST_CONFIG_KEY } from "./TruelistProvider";

// Composable
export { useEmailValidation } from "./use-email-validation";
export type {
  UseEmailValidationOptions,
  UseEmailValidationReturn,
  ValidateOn,
} from "./use-email-validation";

// Component
export { TruelistEmailInput } from "./TruelistEmailInput";

// Client
export { verifyEmail, TruelistApiError } from "./client";

// Types
export type {
  ValidationState,
  ValidationSubState,
  ValidationResult,
  TruelistConfig,
} from "./types";
