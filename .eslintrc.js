module.exports = {
  extends: ["@ofa2/eslint-config"],
  parserOptions: {
    project: ["./tsconfig.json"],
  },
  globals: {},
  rules: {
    "no-console": ["off"],
    "prettier/prettier": [
      "error",
      {
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: true,
        trailingComma: "es5",
        bracketSpacing: true,
        jsxBracketSameLine: false,
        arrowParens: "always",
        requirePragma: false,
        insertPragma: false,
        endOfLine: "auto",
      },
    ],

    "no-shadow": ["off"],
    "@typescript-eslint/no-shadow": ["error"],
  },
};
