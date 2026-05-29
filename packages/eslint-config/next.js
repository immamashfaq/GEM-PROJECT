/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    './index.js',
    'next/core-web-vitals',
  ],
  rules: {
    '@next/next/no-html-link-for-pages': 'error',
    'react/jsx-key': 'error',
    'react/no-unescaped-entities': 'off',
  },
  env: {
    browser: true,
    es2022: true,
  },
};
