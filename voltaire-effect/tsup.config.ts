import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/primitives/index.ts',
    'src/crypto/index.ts',
    'src/services/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['@tevm/voltaire', 'effect'],
})
