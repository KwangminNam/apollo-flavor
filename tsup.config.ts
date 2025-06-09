import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  external: ['react', 'react-dom', '@apollo/client', 'graphql'],
  treeshake: true,
  target: 'es2020',
  outDir: 'dist',
  esbuildOptions: (options) => {
    options.banner = {
      js: '"use client";',
    }
  },
}) 