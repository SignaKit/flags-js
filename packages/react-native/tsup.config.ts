import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['react', 'react-native', '@react-native-async-storage/async-storage'],
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
})
