import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['react', 'react-dom', '@signakit/flags-browser'],
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
})
