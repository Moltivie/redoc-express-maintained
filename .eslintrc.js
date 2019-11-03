module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
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
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  rules: {
    'comma-dangle': 'off',
    quotes: 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'arrow-parens': 'off',
    'import/no-unresolved': 'off'
  }
};
