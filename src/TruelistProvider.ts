import { defineComponent, provide, h } from "vue";
import type { InjectionKey, PropType } from "vue";
import type { TruelistConfig } from "./types";

/** Injection key for the Truelist configuration. */
export const TRUELIST_CONFIG_KEY: InjectionKey<TruelistConfig> =
  Symbol("truelist-config");

/**
 * Provides Truelist configuration to all child composables and components.
 *
 * Wrap your app (or the relevant subtree) with this provider
 * to avoid passing the API key to every composable call.
 *
 * @example
 * ```vue
 * <template>
 *   <TruelistProvider api-key="your-api-key">
 *     <router-view />
 *   </TruelistProvider>
 * </template>
 * ```
 */
export const TruelistProvider = defineComponent({
  name: "TruelistProvider",
  props: {
    apiKey: {
      type: String as PropType<string>,
      required: true,
    },
    baseUrl: {
      type: String as PropType<string>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    provide(TRUELIST_CONFIG_KEY, {
      apiKey: props.apiKey,
      baseUrl: props.baseUrl,
    });

    return () => (slots.default ? slots.default() : h("div"));
  },
});

