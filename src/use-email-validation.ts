import { ref, watch, onUnmounted, inject } from "vue";
import type { Ref } from "vue";
import { verifyEmail, TruelistApiError } from "./client";
import { TRUELIST_CONFIG_KEY } from "./TruelistProvider";
import type { TruelistConfig, ValidationResult } from "./types";

export type ValidateOn = "blur" | "change";

export type UseEmailValidationOptions = {
  /** Your Truelist API key. Can be omitted if using TruelistProvider. */
  apiKey?: string;
  /** Base URL for the Truelist API. Defaults to `https://api.truelist.io`. */
  baseUrl?: string;
  /** Debounce delay in milliseconds. Set to 0 to disable. Default: 500. */
  debounceMs?: number;
  /** When to trigger automatic validation. Default: "blur". */
  validateOn?: ValidateOn;
  /** Callback fired when validation completes successfully. */
  onResult?: (result: ValidationResult) => void;
  /** Callback fired when validation fails. */
  onError?: (error: string) => void;
};

export type UseEmailValidationReturn = {
  /** Reactive email value for v-model binding. */
  email: Ref<string>;
  /** The most recent validation result, or null if not yet validated. */
  result: Ref<ValidationResult | null>;
  /** Whether a validation request is currently in-flight. */
  isValidating: Ref<boolean>;
  /** Error message from the last validation attempt, or null. */
  error: Ref<string | null>;
  /** Trigger email validation manually. */
  validate: () => Promise<void>;
  /** Reset result and error state. */
  reset: () => void;
};

/**
 * Headless composable for validating email addresses via the Truelist API.
 *
 * Works with any UI. Handles debouncing, request cancellation,
 * and loading/error states automatically.
 *
 * Can be used with a `TruelistProvider` or by passing `apiKey` directly.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useEmailValidation } from '@truelist/vue'
 *
 * const { email, result, isValidating } = useEmailValidation({
 *   apiKey: 'your-api-key',
 * })
 * </script>
 *
 * <template>
 *   <input v-model="email" type="email" />
 *   <span v-if="isValidating">Checking...</span>
 *   <span v-else-if="result?.state === 'ok'">Valid!</span>
 * </template>
 * ```
 */
export function useEmailValidation(
  options: UseEmailValidationOptions = {}
): UseEmailValidationReturn {
  const {
    apiKey: optionApiKey,
    baseUrl: optionBaseUrl,
    debounceMs = 500,
    validateOn = "blur",
    onResult,
    onError,
  } = options;

  const injectedConfig = inject(TRUELIST_CONFIG_KEY, null);

  const config: TruelistConfig = {
    apiKey: optionApiKey ?? injectedConfig?.apiKey ?? "",
    baseUrl: optionBaseUrl ?? injectedConfig?.baseUrl,
  };

  if (!config.apiKey) {
    throw new Error(
      "useEmailValidation requires an API key. Pass `apiKey` in options " +
        "or wrap your component tree with <TruelistProvider api-key=\"...\">."
    );
  }

  const email = ref("");
  const result = ref<ValidationResult | null>(null);
  const isValidating = ref(false);
  const error = ref<string | null>(null);

  let abortController: AbortController | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function clearDebounce() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  function abortInFlight() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  }

  async function runValidation(emailValue: string): Promise<void> {
    abortInFlight();

    const controller = new AbortController();
    abortController = controller;

    isValidating.value = true;
    error.value = null;

    try {
      const validationResult = await verifyEmail(
        emailValue,
        config,
        controller.signal
      );

      if (controller.signal.aborted) return;

      result.value = validationResult;
      isValidating.value = false;
      onResult?.(validationResult);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      const message =
        err instanceof TruelistApiError
          ? err.message
          : "Email validation failed. Please try again.";

      error.value = message;
      isValidating.value = false;
      onError?.(message);
    }
  }

  async function validate(): Promise<void> {
    clearDebounce();

    const emailValue = email.value;

    if (!emailValue || !emailValue.includes("@")) {
      result.value = null;
      error.value = null;
      isValidating.value = false;
      return;
    }

    await runValidation(emailValue);
  }

  function reset(): void {
    clearDebounce();
    abortInFlight();
    result.value = null;
    error.value = null;
    isValidating.value = false;
  }

  if (validateOn === "change") {
    watch(email, (newValue) => {
      clearDebounce();

      if (!newValue || !newValue.includes("@")) {
        result.value = null;
        error.value = null;
        isValidating.value = false;
        return;
      }

      if (debounceMs > 0) {
        debounceTimer = setTimeout(() => {
          void runValidation(newValue);
        }, debounceMs);
      } else {
        void runValidation(newValue);
      }
    });
  }

  onUnmounted(() => {
    clearDebounce();
    abortInFlight();
  });

  return {
    email,
    result,
    isValidating,
    error,
    validate,
    reset,
  };
}
