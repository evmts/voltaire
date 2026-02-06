import { defineConfig } from "vite";

export default defineConfig({
	build: {
		lib: {
			entry: "./scripts/bench-keccak256-wasm.ts",
			name: "Keccak256Wasm",
			fileName: "keccak256-wasm",
			formats: ["es"],
		},
		outDir: "./scripts/dist-wasm",
		minify: "terser",
		terserOptions: {
			compress: {
				passes: 3,
				pure_funcs: ["console.log"],
			},
			mangle: true,
		},
		rollupOptions: {
			external: [],
		},
	},
	assetsInclude: ["**/*.wasm"],
});
