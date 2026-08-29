import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // pb_data is PocketBase's own generated/runtime directory (gitignored,
  // regenerated on `pocketbase serve`) — its types.d.ts is machine-generated
  // and shouldn't be linted or hand-edited.
  globalIgnores(['dist', 'pb_data']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // shadcn/ui primitives: generated/regenerated via `npx shadcn add`, and
    // upstream co-exports each component with its cva variants function —
    // splitting that up would only make future syncs harder to diff.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
