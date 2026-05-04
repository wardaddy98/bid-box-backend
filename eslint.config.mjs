import js from '@eslint/js';
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
                      {
    ignores: ['dist', 'node_modules'],
  },
  {
    files:            
       ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    languageOptions: { globals: globals.node },
    extends: ['js/recommended'],
    rules: {
    },
  },
  tseslint.configs.recommended,
  eslintConfigPrettier
]);
