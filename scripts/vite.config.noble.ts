import { defineConfig } from "vite";

export default defineConfig({
	build: {
		lib: {
			entry: "./scripts/bench-keccak256-noble.ts",
			name: "Keccak256Noble",
			fileName: "keccak256-noble",
			formats: ["es"],
		},
		outDir: "./scripts/dist-noble",
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
});
