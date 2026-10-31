import js from '@eslint/js';
import path from "path";
import { fileURLToPath } from "url";
import globals from "globals";
import { defineConfig, globalIgnores } from "@eslint/config-helpers";
import { FlatCompat } from "@eslint/eslintrc";
import js from '@eslint/js';
import { fixupConfigRules } from "@eslint/compat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

  const compatWithRecommended = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
  });
export default defineConfig([
  globalIgnores(["build","node_modules",".yarn/install-state.gz","yarn-error.log","*.sql"]),
  {
    extends: fixupConfigRules(compatWithRecommended.extends(
      js.configs.recommended,
      "plugin:@typescript-eslint/recommended",
      "prettier"
    )),
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es6
      },
      sourceType: "module",
      parserOptions: {
        ecmaVersion: 2018,
        project: "./tsconfig.json"
      }
    },
    rules: {
      "max-len": ["error", 120, 2],
      "react/prop-types": 0,
      "react/destructuring-assignment": 0,
      "react/no-access-state-in-setstate": 0,
      "react/jsx-one-expression-per-line": 0,
      "no-constant-binary-expression": 'off',
      "no-empty-static-block": 'off',
      "no-new-native-nonconstructor": 'off',
      "no-unused-private-class-members": 'off'
    },
  }
]);
