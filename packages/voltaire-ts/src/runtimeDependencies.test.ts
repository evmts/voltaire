/**
 * Every runtime dependency is installed for every consumer, so each one must
 * be imported by shipped source. Test-only and unused packages belong in
 * devDependencies or nowhere. See https://github.com/evmts/voltaire/issues/391.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const srcDir = path.join(packageDir, "src");

const SOURCE_FILE = /\.(?:[cm]?js|[cm]?ts)$/;
const NOT_SHIPPED = /\.(?:test|test-d|spec|bench)\.[cm]?[jt]s$/;
const IMPORT_SPECIFIER =
	/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)["']([^"'./][^"']*)["']/g;

function packageName(specifier: string): string {
	const parts = specifier.split("/");
	return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

function shippedImports(): Set<string> {
	const imported = new Set<string>();
	const files = readdirSync(srcDir, { recursive: true, encoding: "utf8" });
	for (const file of files) {
		if (!SOURCE_FILE.test(file) || NOT_SHIPPED.test(file)) continue;
		const code = readFileSync(path.join(srcDir, file), "utf8");
		for (const match of code.matchAll(IMPORT_SPECIFIER)) {
			imported.add(packageName(match[1]));
		}
	}
	return imported;
}

const manifest = JSON.parse(
	readFileSync(path.join(packageDir, "package.json"), "utf8"),
) as { dependencies?: Record<string, string> };

describe("package.json runtime dependencies", () => {
	const imported = shippedImports();

	it("lists only packages that shipped source imports", () => {
		const unused = Object.keys(manifest.dependencies ?? {}).filter(
			(name) => !imported.has(name),
		);
		expect(unused).toEqual([]);
	});

	it("excludes editor and UI packages", () => {
		const uiPackages = Object.keys(manifest.dependencies ?? {}).filter((name) =>
			/^(?:react|react-dom|modern-monaco|@codesandbox\/|@codemirror\/)/.test(
				name,
			),
		);
		expect(uiPackages).toEqual([]);
	});
});
