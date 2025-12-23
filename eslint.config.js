const nextCoreWebVitals = require("eslint-config-next/core-web-vitals");

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  {
    ignores: [".next/**", "node_modules/**"],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      "react-hooks/exhaustive-deps":
        process.env.NODE_ENV === "production" ? "off" : "warn",
      // React Compiler-related rules can be noisy in non-compiler projects.
      "react-hooks/incompatible-library": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
    },
  },
];
