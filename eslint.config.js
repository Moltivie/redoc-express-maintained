const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');

// Flat config (eslint 9+). Replaces .eslintrc.js and .eslintignore.
//
// airbnb-base was dropped rather than ported: it still peer-depends on
// eslint ^7 || ^8, which hard-blocks eslint 10, and the old .eslintrc had
// already switched off most of what it contributed (comma-dangle, quotes,
// arrow-parens, object-curly-newline, implicit-arrow-linebreak, max-len)
// because prettier owns formatting here.
module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**']
  },
  js.configs.recommended,

  // TypeScript rules apply to TypeScript only - the config files in the repo
  // root are CommonJS and would otherwise trip no-require-imports.
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.ts']
  })),

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.jest
      }
    },
    rules: {
      // The public option types intentionally accept arbitrary ReDoc config.
      '@typescript-eslint/no-explicit-any': 'off',

      // Carried over from airbnb-base. Both are switched off deliberately in a
      // few places (src/utils/logger.ts, the javascript: URL injection tests),
      // and those inline disables only stay meaningful if the rules are on.
      'no-console': 'error',
      'no-script-url': 'error'
    }
  },

  {
    // Config files in the repo root are plain CommonJS.
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node
    }
  }
);
