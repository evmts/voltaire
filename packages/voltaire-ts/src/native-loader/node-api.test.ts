import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const nodeApiUrl = pathToFileURL(
	path.join(path.dirname(fileURLToPath(import.meta.url)), "node-api.ts"),
).href;

/** Encodes ES module source as a data: URL. */
function dataUrl(source: string): string {
	return `data:text/javascript,${encodeURIComponent(source)}`;
}

/**
 * Imports node-api.ts in a plain Node.js ES module process and calls
 * loadNodeNative(). Vitest injects a module-scoped `require`, which hides a
 * bare `require()`, so this check needs a real Node.js process.
 */
function loadInPlainNode(libPath: string) {
	const platform = dataUrl(
		`export const getNativeLibPath = () => ${JSON.stringify(libPath)};`,
	);
	const types = dataUrl(`
		export const getNativeErrorMessage = String;
		export class NativeError extends Error {}
		export class NativeLibraryNotFoundError extends Error {}
	`);
	const hooks = dataUrl(`
		export async function resolve(specifier, context, next) {
			if (specifier === "./platform.js") return { url: ${JSON.stringify(platform)}, shortCircuit: true };
			if (specifier === "./types.js") return { url: ${JSON.stringify(types)}, shortCircuit: true };
			return next(specifier, context);
		}
	`);
	const script = `
		import { register } from "node:module";
		register(${JSON.stringify(hooks)});
		const { loadNodeNative } = await import(${JSON.stringify(nodeApiUrl)});
		process.stdout.write(JSON.stringify(loadNodeNative()));
	`;
	return spawnSync(
		process.execPath,
		[
			"--experimental-strip-types",
			"--no-warnings",
			"--input-type=module",
			"-e",
			script,
		],
		{ encoding: "utf8" },
	);
}

describe("loadNodeNative", () => {
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(path.join(tmpdir(), "voltaire-node-api-"));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it("loads the addon from an ES module with no global require", () => {
		const addon = { primitives_address_is_zero: "fixture" };
		const libPath = path.join(dir, "addon.cjs");
		writeFileSync(libPath, `module.exports = ${JSON.stringify(addon)};`);

		const result = loadInPlainNode(libPath);

		expect(result.stderr).toBe("");
		expect(result.status).toBe(0);
		expect(JSON.parse(result.stdout)).toEqual(addon);
	});
});
