const js = require('@eslint/js')
const tseslint = require('@typescript-eslint/eslint-plugin')
const parser = require('@typescript-eslint/parser')
const next = require('@next/eslint-plugin-next')

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'warn'
    }
  },
  {
    plugins: {
      '@next/next': next
    },
    rules: {
      ...next.configs.recommended.rules
    }
  }
]