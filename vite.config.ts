import { defineConfig, type Plugin } from "vite-plus";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

// https://vite.dev/config/
export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    plugins: ["react", "typescript", "oxc"],
    rules: {
      "react/rules-of-hooks": "error",
      "react/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  base: "/bopomofo-trainer/",
  plugins: [
    ...(react() as Plugin[]),
    babel({ presets: [reactCompilerPreset()] }) as unknown as Plugin,
  ],
});
