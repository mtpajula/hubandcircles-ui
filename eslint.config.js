import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'src/types/', 'public/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Formatting is owned by Prettier, hence essential rather than recommended.
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
    // Type checking (vue-tsc) knows the browser globals; ESLint does not need to check them.
    rules: { 'no-undef': 'off' },
  },
  {
    files: ['scripts/**/*.mjs', 'vite.config.ts'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly' } },
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
)
