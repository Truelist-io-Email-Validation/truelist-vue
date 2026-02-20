# @truelist/vue

Vue composables and components for real-time email validation with [Truelist.io](https://truelist.io).

Validate emails at the point of entry with a headless composable, a pre-built input component, or a provide/inject provider pattern.

```bash
npm install @truelist/vue
```

## Quick Start

Use the composable directly with an API key:

```vue
<script setup>
import { useEmailValidation } from '@truelist/vue'

const { email, result, isValidating } = useEmailValidation({
  apiKey: 'your-form-api-key',
})
</script>

<template>
  <input v-model="email" type="email" placeholder="you@example.com" />
  <span v-if="isValidating">Checking...</span>
  <span v-else-if="result?.state === 'valid'">Valid!</span>
  <span v-else-if="result?.state === 'invalid'">Invalid email</span>
</template>
```

## Provider Pattern

Wrap your app with `TruelistProvider` to make the API key available to all composables and components:

```vue
<!-- App.vue -->
<script setup>
import { TruelistProvider } from '@truelist/vue'
</script>

<template>
  <TruelistProvider api-key="your-form-api-key">
    <router-view />
  </TruelistProvider>
</template>
```

Then use composables without passing the API key:

```vue
<script setup>
import { useEmailValidation } from '@truelist/vue'

const { email, result, isValidating } = useEmailValidation()
</script>
```

## Composable: `useEmailValidation`

The primary way to add email validation to any UI. Headless by design -- you control the rendering.

```vue
<script setup>
import { useEmailValidation } from '@truelist/vue'

const { email, result, isValidating, error, validate, reset } = useEmailValidation({
  apiKey: 'your-form-api-key',
  debounceMs: 500,
  validateOn: 'blur',
  onResult: (result) => console.log(result),
  onError: (error) => console.error(error),
})
</script>

<template>
  <div>
    <input v-model="email" type="email" @blur="validate" placeholder="you@example.com" />
    <span v-if="isValidating">Checking...</span>
    <span v-else-if="result?.state === 'invalid'">This email is not valid.</span>
    <span v-else-if="result?.state === 'risky'">This email may not receive mail.</span>
    <span v-if="result?.suggestion">Did you mean {{ result.suggestion }}?</span>
    <span v-if="error">{{ error }}</span>
    <button @click="reset">Clear</button>
  </div>
</template>
```

### Return Value

| Property | Type | Description |
|---|---|---|
| `email` | `Ref<string>` | Reactive email value for `v-model` binding |
| `result` | `Ref<ValidationResult \| null>` | The validation result, or null |
| `isValidating` | `Ref<boolean>` | Whether a request is in-flight |
| `error` | `Ref<string \| null>` | Error message, or null |
| `validate` | `() => Promise<void>` | Trigger validation manually |
| `reset` | `() => void` | Clear result, error, and abort pending requests |

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | -- | Your Truelist form API key (or use provider) |
| `baseUrl` | `string` | `https://api.truelist.io` | Custom API base URL |
| `debounceMs` | `number` | `500` | Debounce delay. Set to 0 to disable. |
| `validateOn` | `"blur" \| "change"` | `"blur"` | When to trigger automatic validation |
| `onResult` | `(result: ValidationResult) => void` | -- | Callback when validation succeeds |
| `onError` | `(error: string) => void` | -- | Callback when validation fails |

## Component: `TruelistEmailInput`

A composable, unstyled email input with built-in validation.

```vue
<script setup>
import { ref } from 'vue'
import { TruelistEmailInput } from '@truelist/vue'

const email = ref('')

function handleResult(result) {
  console.log('Validation:', result)
}
</script>

<template>
  <TruelistEmailInput
    v-model="email"
    api-key="your-form-api-key"
    validate-on="blur"
    :debounce-ms="500"
    placeholder="you@example.com"
    @validation-result="handleResult"
  />
</template>
```

### Slots

Customize rendering with named slots:

```vue
<TruelistEmailInput v-model="email" api-key="your-form-api-key">
  <template #validating>
    <span class="spinner">Verifying...</span>
  </template>

  <template #suggestion="{ suggestion }">
    <span class="suggestion">Did you mean {{ suggestion }}?</span>
  </template>

  <template #error="{ error }">
    <span class="error">{{ error }}</span>
  </template>

  <template #result="{ result }">
    <span v-if="result.state === 'valid'" class="success">Looks good!</span>
  </template>
</TruelistEmailInput>
```

### Styling with Data Attributes

The input exposes a `data-validation-state` attribute for CSS styling:

```css
input[data-validation-state="valid"] {
  border-color: green;
}

input[data-validation-state="invalid"] {
  border-color: red;
}

input[data-validation-state="risky"] {
  border-color: orange;
}

input[data-validation-state="validating"] {
  border-color: blue;
}

input[data-validation-state="idle"] {
  border-color: gray;
}
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` / `v-model` | `string` | `""` | The email value |
| `apiKey` | `string` | -- | Your Truelist form API key (or use provider) |
| `baseUrl` | `string` | `https://api.truelist.io` | Custom API base URL |
| `validateOn` | `"blur" \| "change"` | `"blur"` | When to trigger validation |
| `debounceMs` | `number` | `500` | Debounce delay for "change" mode |
| `placeholder` | `string` | -- | Input placeholder text |
| `disabled` | `boolean` | `false` | Disable the input |
| `name` | `string` | -- | Input name attribute |
| `id` | `string` | -- | Input id attribute |

### Events

| Event | Payload | Description |
|---|---|---|
| `update:modelValue` | `string` | Emitted when the email value changes |
| `validation-result` | `ValidationResult` | Emitted when validation completes |

### Exposed Methods

Access component methods via template ref:

```vue
<script setup>
import { ref } from 'vue'
import { TruelistEmailInput } from '@truelist/vue'

const inputRef = ref()

function manualValidate() {
  inputRef.value?.validate()
}
</script>

<template>
  <TruelistEmailInput ref="inputRef" api-key="your-form-api-key" v-model="email" />
  <button @click="manualValidate">Validate</button>
</template>
```

## Types

```ts
import type {
  ValidationState,
  ValidationSubState,
  ValidationResult,
  TruelistConfig,
} from '@truelist/vue'
```

### `ValidationState`

```ts
type ValidationState = "valid" | "invalid" | "risky" | "unknown";
```

### `ValidationSubState`

```ts
type ValidationSubState =
  | "ok"
  | "accept_all"
  | "disposable_address"
  | "role_address"
  | "failed_mx_check"
  | "failed_spam_trap"
  | "failed_no_mailbox"
  | "failed_greylisted"
  | "failed_syntax_check"
  | "unknown";
```

### `ValidationResult`

```ts
type ValidationResult = {
  state: ValidationState;
  subState: ValidationSubState;
  email: string;
  suggestion?: string;
  freeEmail?: boolean;
  role?: boolean;
};
```

### `TruelistConfig`

```ts
type TruelistConfig = {
  apiKey: string;
  baseUrl?: string;
};
```

## Configuration

### Provider Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | *required* | Your Truelist form API key |
| `baseUrl` | `string` | `https://api.truelist.io` | Custom API base URL |

### API Details

- **Endpoint**: `POST https://api.truelist.io/api/v1/form_verify`
- **Auth**: Bearer token (your form API key)
- **Rate limit**: 60 requests per minute for form keys
- **Billing**: Credits are only charged for definitive results (`valid`/`invalid`), not for `unknown`

Get your API key at [truelist.io](https://truelist.io).

## License

MIT
