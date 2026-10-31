import { defineConfig } from 'eslint/config'
import eslintJs from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import nodePlugin from 'eslint-plugin-n'
import promisePlugin from 'eslint-plugin-promise'

export default defineConfig(
  {
    ignores: [
      '.yarn',
      'build/',
      'coverage',
      'eslint.config.*',
      'jest.config.*',
      'node_modules/',
      'server.js',
      'webpack.config.js',
      'yarn-error.log',
      '*.sql'
    ],
  },

  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,
  nodePlugin.configs['flat/recommended'],

  {
    plugins: {
      n: nodePlugin,
      promise: promisePlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021 // 'es6' is updated to modern name 'es2015'
      },
      sourceType: 'module',
      parserOptions: {
        ecmaVersion: 2021,
        // typescript-eslint manages parser/project config automatically behind the scenes
        project: './tsconfig.json', 
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        },
      ],
      'max-len': ['error', 120, 2],
      'n/no-missing-import': 'off', 
      // Optional: Add rules for eslint-plugin-promise here if you want them
      'promise/always-return': 'error',
    },
  },

  eslintConfigPrettier,
)
