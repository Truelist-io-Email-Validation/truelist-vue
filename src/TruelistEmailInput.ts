import { defineComponent, computed, watch, h } from "vue";
import type { PropType, SlotsType } from "vue";
import { useEmailValidation } from "./use-email-validation";
import type { ValidateOn } from "./use-email-validation";
import type { ValidationResult } from "./types";

/**
 * A composable, unstyled email input with built-in Truelist validation.
 *
 * Exposes validation state through `data-validation-state` for easy CSS styling.
 * Renders an `<input type="email">` with optional suggestion and error messages.
 *
 * Can be used with a `TruelistProvider` or by passing `api-key` directly.
 *
 * @example
 * ```vue
 * <TruelistEmailInput
 *   v-model="email"
 *   api-key="your-api-key"
 *   validate-on="blur"
 *   :debounce-ms="500"
 *   @validation-result="handleResult"
 * />
 * ```
 */
export const TruelistEmailInput = defineComponent({
  name: "TruelistEmailInput",
  inheritAttrs: false,
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    apiKey: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    baseUrl: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    validateOn: {
      type: String as PropType<ValidateOn>,
      default: "blur",
    },
    debounceMs: {
      type: Number,
      default: 500,
    },
    placeholder: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    id: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
  },
  emits: {
    "update:modelValue": (_value: string) => true,
    "validation-result": (_result: ValidationResult) => true,
  },
  slots: Object as SlotsType<{
    validating?: Record<string, never>;
    suggestion?: { suggestion: string };
    error?: { error: string };
    result?: { result: ValidationResult };
  }>,
  setup(props, { emit, slots, attrs }) {
    const {
      email,
      result,
      isValidating,
      error,
      validate,
      reset,
    } = useEmailValidation({
      apiKey: props.apiKey,
      baseUrl: props.baseUrl,
      debounceMs: props.debounceMs,
      validateOn: props.validateOn,
      onResult: (validationResult) => {
        emit("validation-result", validationResult);
      },
    });

    // Sync external modelValue -> internal email
    watch(
      () => props.modelValue,
      (newValue) => {
        if (newValue !== email.value) {
          email.value = newValue;
        }
      },
      { immediate: true }
    );

    // Sync internal email -> external modelValue
    watch(email, (newValue) => {
      if (newValue !== props.modelValue) {
        emit("update:modelValue", newValue);
      }
    });

    // Reset when typing in blur mode
    watch(email, (newValue) => {
      if (props.validateOn === "blur" && (result.value || error.value)) {
        if (!newValue || newValue !== result.value?.email) {
          reset();
        }
      }
    });

    const dataState = computed(() => {
      if (isValidating.value) return "validating";
      if (result.value?.state) return result.value.state;
      return "idle";
    });

    function handleInput(event: Event) {
      const target = event.target as HTMLInputElement;
      email.value = target.value;
    }

    function handleBlur() {
      if (props.validateOn === "blur" && email.value) {
        void validate();
      }
    }

    return () => {
      const children = [
        h("input", {
          ...attrs,
          id: props.id,
          value: email.value,
          type: "email",
          name: props.name,
          placeholder: props.placeholder,
          disabled: props.disabled,
          "data-validation-state": dataState.value,
          "aria-invalid":
            result.value?.state === "email_invalid" ? true : undefined,
          onInput: handleInput,
          onBlur: handleBlur,
        }),
      ];

      if (isValidating.value && slots.validating) {
        children.push(...slots.validating({}));
      }

      if (result.value?.suggestion) {
        if (slots.suggestion) {
          children.push(
            ...slots.suggestion({ suggestion: result.value.suggestion })
          );
        } else {
          children.push(
            h(
              "span",
              { "data-truelist-suggestion": "" },
              `Did you mean ${result.value.suggestion}?`
            )
          );
        }
      }

      if (error.value) {
        if (slots.error) {
          children.push(...slots.error({ error: error.value }));
        } else {
          children.push(
            h("span", { "data-truelist-error": "" }, error.value)
          );
        }
      }

      if (result.value && slots.result) {
        children.push(...slots.result({ result: result.value }));
      }

      return h("div", { "data-truelist-wrapper": "" }, children);
    };
  },
});
