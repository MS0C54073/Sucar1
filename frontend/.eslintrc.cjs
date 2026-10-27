module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.cjs', 'vite.config.ts'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      {
        allowConstantExport: true,
        // Context hooks and helpers that intentionally live beside their component.
        allowExportNames: ['useAuth', 'useTheme', 'useToast', 'useGoogleMaps', 'buildExplorerWashes'],
      },
    ],
    // TODO: ~150 existing `any`s, mostly API response shapes. Re-enable once
    // those are typed from shared-types; until then `tsc` is the type gate.
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
