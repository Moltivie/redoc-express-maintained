module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  env: {
    browser: true,
    es6: true,
    jest: true
  },
  extends: ['airbnb-base', 'plugin:@typescript-eslint/recommended'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  rules: {
    'comma-dangle': 'off',
    quotes: 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'arrow-parens': 'off',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'import/no-import-module-exports': 'off',
    'object-curly-newline': 'off',
    'implicit-arrow-linebreak': 'off',
    'max-len': 'off'
  }
};
