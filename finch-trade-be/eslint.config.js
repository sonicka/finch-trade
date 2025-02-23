import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { languageOptions: { globals: pluginJs.environments.node.globals } },
  pluginJs.configs.recommended,
];
