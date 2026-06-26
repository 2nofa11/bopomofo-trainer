import { defineConfig } from 'vite-plus'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  fmt: {},
  lint: {
    "plugins": [
      "react",
      "typescript",
      "oxc"
    ],
    "rules": {
      "react/rules-of-hooks": "error",
      "react/only-export-components": [
        "warn",
        {
          "allowConstantExport": true
        }
      ]
    },
    "options": {
      "typeAware": true,
      "typeCheck": false
    }
  },
  base: '/bopomofo-trainer/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
