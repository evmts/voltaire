#!/usr/bin/env node
/**
 * Verifies that every publishable workspace package is safe to publish.
 *
 * Usage:
 *   node scripts/verify-packaging.mjs                  # full check (needs built dist/types)
 *   node scripts/verify-packaging.mjs --metadata-only  # no build needed
 *   node scripts/verify-packaging.mjs --load           # also load every export subpath
 *   node scripts/verify-packaging.mjs --root <dir>     # check another workspace root
 *
 * Checks, per package under packages/ that is not private:
 *   1. npm consumer metadata: name, version, description, license, repository
 *      (with the real directory), homepage, bugs, keywords, files, publishConfig.
 *   2. README.md and LICENSE exist inside the package.
 *   3. Every `files` entry matches something on disk.
 *   4. Every `exports`, `typesVersions`, `main`, `module` and `types` target
 *      exists, and every export subpath has a `typesVersions` fallback.
 *   5. The tarball contains every export target, README.md and LICENSE, and
 *      no test, coverage, cache or dependency files. The file list comes from
 *      `npm pack --dry-run`: it matches `pnpm pack` here and takes 10 s where
 *      pnpm 10.26 takes 2 min on a negated `files` pattern.
 *   6. With --load: every JavaScript export subpath loads in plain Node
 *      through the package's own exports map, under `import` and, when
 *      declared, `require`. A hoisted `bun:ffi` import or a broken bundle
 *      fails here. This depends on the installed node_modules, so it is
 *      opt-in; CI and scripts/publish-npm.mjs pass it.
 *   7. Every bare package import in dist JavaScript is declared at runtime.
 *   8. Every `new URL("<file>.wasm", import.meta.url)` in dist JavaScript
 *      resolves to a file inside the tarball.
 *
 * Exits 1 and prints one line per defect when anything is wrong.
 */
import { spawnSync } from "node:child_process";
import {
	existsSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
} from "node:fs";
import { createRequire, isBuiltin } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPOSITORY_URL = "git+https://github.com/evmts/voltaire.git";
const ISSUES_URL = "https://github.com/evmts/voltaire/issues";
// Resolve the parser through the TypeScript workspace that declares it.
const requireFromVoltaire = createRequire(
	new URL("../packages/voltaire-ts/package.json", import.meta.url),
);

/** Paths that must never reach the registry. */
const FORBIDDEN = [
	{
		why: "test file",
		pattern: /\.(test|test-d|spec)\.[^/]+$/,
	},
	{ why: "benchmark file", pattern: /\.bench\.[^/]+$/ },
	{
		why: "test, coverage, cache or dependency directory",
		pattern:
			/(^|\/)(node_modules|coverage|__tests__|__snapshots__|\.cache|\.turbo|\.vitest|\.zig-cache|zig-cache|zig-out|target)\//,
	},
	{ why: "build cache file", pattern: /\.tsbuildinfo$|(^|\/)\.DS_Store$/ },
	{ why: "native build artifact", pattern: /\.(o|a|rlib|tmp)$/ },
	{ why: "environment file", pattern: /(^|\/)\.env(\.[^/]+)?$/ },
	{ why: ".vibe file", pattern: /(^|\/)\.vibe\// },
];

/**
 * @param {string} file
 * @returns {any}
 */
function readJson(file) {
	return JSON.parse(readFileSync(file, "utf8"));
}

/**
 * @param {string} file
 * @returns {boolean}
 */
function isFile(file) {
	return existsSync(file) && statSync(file).isFile();
}

/**
 * Lists every file under `dir` as a path relative to `dir`.
 *
 * @param {string} dir
 * @param {string} [prefix]
 * @returns {string[]}
 */
function listFiles(dir, prefix = "") {
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === "node_modules") continue;
		const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			out.push(...listFiles(path.join(dir, entry.name), rel));
		} else {
			out.push(rel);
		}
	}
	return out;
}

/**
 * Flattens an `exports` map into one row per subpath, condition and target.
 *
 * @param {unknown} exportsField
 * @returns {{ subpath: string, conditions: string[], target: string }[]}
 */
export function flattenExports(exportsField) {
	/** @type {{ subpath: string, conditions: string[], target: string }[]} */
	const rows = [];
	/**
	 * @param {string} subpath
	 * @param {string[]} conditions
	 * @param {unknown} value
	 */
	const walk = (subpath, conditions, value) => {
		if (typeof value === "string") {
			rows.push({ subpath, conditions, target: value });
		} else if (value && typeof value === "object") {
			for (const [condition, next] of Object.entries(value)) {
				walk(subpath, [...conditions, condition], next);
			}
		}
	};
	if (typeof exportsField === "string") {
		walk(".", [], exportsField);
	} else if (exportsField && typeof exportsField === "object") {
		for (const [subpath, value] of Object.entries(exportsField)) {
			walk(subpath, [], value);
		}
	}
	return rows;
}

/**
 * Returns the values `*` takes for the files that match a pattern target.
 *
 * @param {string} target Pattern such as `./dist/evm/*\/index.js`.
 * @param {string[]} files Package-relative file paths.
 * @returns {string[]}
 */
export function expandPattern(target, files) {
	const [head, tail] = target.replace(/^\.\//, "").split("*");
	return files
		.filter(
			(file) =>
				file.startsWith(head) &&
				file.endsWith(tail) &&
				file.length > head.length + tail.length,
		)
		.map((file) => file.slice(head.length, file.length - tail.length));
}

/**
 * @param {any} pkg
 * @param {string} relDir Package directory relative to the workspace root.
 * @param {string} dir Absolute package directory.
 * @param {string} rootDir Absolute workspace root.
 * @returns {string[]}
 */
function checkMetadata(pkg, relDir, dir, rootDir) {
	const errors = [];
	/** @param {string} field */
	const requireString = (field) => {
		if (typeof pkg[field] !== "string" || pkg[field].trim() === "") {
			errors.push(`package.json "${field}" is missing`);
		}
	};
	requireString("name");
	requireString("description");
	if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(pkg.version ?? "")) {
		errors.push(`package.json "version" is not semver: ${pkg.version}`);
	}
	if (pkg.license !== "MIT") {
		errors.push(`package.json "license" must be "MIT", got ${pkg.license}`);
	}
	const repository = pkg.repository ?? {};
	if (repository.type !== "git" || repository.url !== REPOSITORY_URL) {
		errors.push(
			`package.json "repository" must be { type: "git", url: "${REPOSITORY_URL}" }`,
		);
	}
	if (repository.directory !== relDir) {
		errors.push(
			`package.json "repository.directory" must be "${relDir}", got "${repository.directory}"`,
		);
	}
	if (typeof pkg.homepage !== "string" || !/^https:\/\//.test(pkg.homepage)) {
		errors.push('package.json "homepage" must be an https URL');
	} else {
		const tree = pkg.homepage.match(
			/^https:\/\/github\.com\/evmts\/voltaire\/tree\/[^/]+\/([^#?]+)/,
		);
		if (tree && !existsSync(path.join(rootDir, tree[1]))) {
			errors.push(
				`package.json "homepage" points at a missing directory: ${tree[1]}`,
			);
		}
	}
	if (pkg.bugs?.url !== ISSUES_URL) {
		errors.push(`package.json "bugs.url" must be "${ISSUES_URL}"`);
	}
	const keywords = Array.isArray(pkg.keywords) ? pkg.keywords : [];
	if (keywords.length < 3) {
		errors.push('package.json "keywords" needs at least 3 entries');
	}
	if (new Set(keywords).size !== keywords.length) {
		errors.push('package.json "keywords" has duplicates');
	}
	if (!Array.isArray(pkg.files) || pkg.files.length === 0) {
		errors.push(
			'package.json "files" allowlist is missing; everything would publish',
		);
	} else {
		for (const required of ["README.md", "LICENSE"]) {
			if (!pkg.files.includes(required)) {
				errors.push(`package.json "files" must list "${required}"`);
			}
		}
	}
	if (pkg.publishConfig?.access !== "public") {
		errors.push('package.json "publishConfig.access" must be "public"');
	}

	const readme = path.join(dir, "README.md");
	if (!isFile(readme)) {
		errors.push("README.md is missing from the package directory");
	} else if (!readFileSync(readme, "utf8").includes(pkg.name)) {
		errors.push(`README.md never mentions the package name ${pkg.name}`);
	}
	const license = path.join(dir, "LICENSE");
	if (!isFile(license)) {
		errors.push("LICENSE is missing from the package directory");
	} else if (
		readFileSync(license, "utf8") !==
		readFileSync(path.join(rootDir, "LICENSE"), "utf8")
	) {
		errors.push("LICENSE differs from the repository root LICENSE");
	}
	return errors;
}

/**
 * @param {any} pkg
 * @param {string} dir
 * @returns {string[]}
 */
function checkFilesEntries(pkg, dir) {
	const errors = [];
	for (const entry of pkg.files ?? []) {
		if (entry.startsWith("!") || /[*?[{]/.test(entry)) continue;
		if (!existsSync(path.join(dir, entry))) {
			errors.push(`"files" entry "${entry}" matches nothing on disk`);
		}
	}
	return errors;
}

/**
 * @param {any} pkg
 * @param {string} dir
 * @param {string[]} files Package-relative file paths on disk.
 * @returns {{ errors: string[], targets: string[] }} `targets` are the
 *   package-relative files that consumers resolve.
 */
function checkEntryPoints(pkg, dir, files) {
	const errors = [];
	/** @type {Set<string>} */
	const targets = new Set();
	const onDisk = new Set(files);
	/**
	 * @param {string} label
	 * @param {string} target
	 */
	const requireTarget = (label, target) => {
		const rel = target.replace(/^\.\//, "");
		if (!onDisk.has(rel)) {
			errors.push(`${label} -> ${target} does not exist`);
		} else {
			targets.add(rel);
		}
	};

	for (const field of ["main", "module", "types"]) {
		if (typeof pkg[field] === "string") requireTarget(`"${field}"`, pkg[field]);
	}

	const rows = flattenExports(pkg.exports);
	/** @type {Map<string, string | undefined>} */
	const typesBySubpath = new Map();
	for (const { subpath, conditions, target } of rows) {
		const label = `exports["${subpath}"]${conditions.map((c) => `.${c}`).join("")}`;
		if (!target.startsWith("./")) {
			errors.push(`${label} target must start with "./": ${target}`);
			continue;
		}
		if (conditions.at(-1) === "types") typesBySubpath.set(subpath, target);
		if (!subpath.includes("*")) {
			requireTarget(label, target);
			continue;
		}
		// An exact key beats a pattern, so `"./evm/x": null` blocks one match.
		const matches = expandPattern(target, files).filter(
			(match) => !Object.hasOwn(pkg.exports, subpath.replace("*", match)),
		);
		if (matches.length === 0) {
			errors.push(`${label} -> ${target} matches no file`);
		}
		// Every value the runtime conditions accept must resolve under all
		// conditions, or one consumer gets a module another cannot load.
		for (const sibling of rows) {
			if (sibling.subpath !== subpath || sibling.target === target) continue;
			for (const match of matches) {
				const other = sibling.target.replace("*", match);
				if (!onDisk.has(other.replace(/^\.\//, ""))) {
					errors.push(
						`exports["${subpath}"] resolves "${match}" for ${conditions.join(".")} but ${other} does not exist`,
					);
				}
			}
		}
		for (const match of matches) {
			targets.add(target.replace(/^\.\//, "").replace("*", match));
		}
	}

	for (const [subpath, value] of Object.entries(
		pkg.exports && typeof pkg.exports === "object" ? pkg.exports : {},
	)) {
		if (typeof value !== "object" || value === null) continue;
		const keys = Object.keys(value);
		if (keys.includes("types") && keys[0] !== "types") {
			errors.push(`exports["${subpath}"] must list "types" first`);
		}
		if (!keys.includes("types")) {
			errors.push(`exports["${subpath}"] has no "types" condition`);
		}
		if (!keys.includes("import") && !keys.includes("default")) {
			errors.push(`exports["${subpath}"] has no "import" condition`);
		}
	}

	// typesVersions is the only way TypeScript's node10 resolution finds
	// subpath types, so it must mirror the exports map exactly.
	const typesVersions = pkg.typesVersions?.["*"];
	if (typesVersions) {
		for (const [key, list] of Object.entries(typesVersions)) {
			for (const target of /** @type {string[]} */ (list)) {
				if (target.includes("*")) {
					if (expandPattern(target, files).length === 0) {
						errors.push(`typesVersions["${key}"] -> ${target} matches no file`);
					}
				} else {
					requireTarget(`typesVersions["${key}"]`, target);
				}
			}
			if (!typesBySubpath.has(`./${key}`)) {
				errors.push(`typesVersions["${key}"] has no matching export`);
			}
		}
		for (const [subpath, target] of typesBySubpath) {
			if (subpath === ".") continue;
			const key = subpath.replace(/^\.\//, "");
			const listed = typesVersions[key];
			if (!listed) {
				errors.push(`exports["${subpath}"] has no typesVersions fallback`);
			} else if (listed[0] !== target) {
				errors.push(
					`typesVersions["${key}"] is ${listed[0]} but exports["${subpath}"].types is ${target}`,
				);
			}
		}
	}

	return { errors, targets: [...targets] };
}

/**
 * @param {any} pkg
 * @param {string} dir
 * @param {string[]} files
 * @returns {string[]}
 */
function checkRuntimeImports(pkg, dir, files) {
	const bundles = files.filter((file) => /^dist\/.*\.(js|cjs)$/.test(file));
	if (bundles.length === 0) return [];
	const ts = requireFromVoltaire("typescript");
	const declared = new Set(
		Object.keys({
			...pkg.dependencies,
			...pkg.peerDependencies,
			...pkg.optionalDependencies,
		}),
	);
	const errors = [];
	for (const file of bundles) {
		const source = ts.createSourceFile(
			file,
			readFileSync(path.join(dir, file), "utf8"),
			ts.ScriptTarget.Latest,
			false,
			ts.ScriptKind.JS,
		);
		const missing = new Set();
		/** @param {import("typescript").Node} node */
		const visit = (node) => {
			let specifier;
			if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
				specifier = node.moduleSpecifier;
			} else if (ts.isCallExpression(node)) {
				const callee = node.expression;
				// esbuild rewrites require() to __require() in ESM bundles.
				if (
					callee.kind === ts.SyntaxKind.ImportKeyword ||
					(ts.isIdentifier(callee) &&
						(callee.text === "require" || callee.text === "__require")) ||
					(ts.isPropertyAccessExpression(callee) &&
						ts.isIdentifier(callee.expression) &&
						((callee.expression.text === "require" &&
							callee.name.text === "resolve") ||
							(callee.expression.text === "module" &&
								callee.name.text === "require")))
				) {
					specifier = node.arguments[0];
				}
			}
			if (specifier && ts.isStringLiteralLike(specifier)) {
				const id = specifier.text;
				if (
					id &&
					!/^[./#]|^(bun|data|file|https?):/.test(id) &&
					!isBuiltin(id)
				) {
					const parts = id.split("/");
					const name = parts.slice(0, id.startsWith("@") ? 2 : 1).join("/");
					if (!declared.has(name)) missing.add(id);
				}
			}
			ts.forEachChild(node, visit);
		};
		visit(source);
		for (const specifier of missing) {
			errors.push(`${file} imports undeclared runtime dependency "${specifier}"`);
		}
	}
	return errors;
}

/**
 * @param {string} dir
 * @returns {{ errors: string[], packed: string[] }}
 */
function packList(dir) {
	// npm writes the tarball into its cache even on a dry run. A private cache
	// keeps concurrent npm processes from colliding on the shared one.
	const cache = mkdtempSync(path.join(tmpdir(), "verify-packaging-"));
	const result = spawnSync(
		"npm",
		["pack", "--dry-run", "--json", "--ignore-scripts", "--cache", cache],
		{ cwd: dir, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
	);
	rmSync(cache, { recursive: true, force: true });
	const start = result.stdout?.indexOf("[") ?? -1;
	if (result.error || result.status !== 0 || start < 0) {
		return {
			errors: [
				`npm pack --dry-run failed: ${result.error?.message ?? result.stderr}`,
			],
			packed: [],
		};
	}
	const [manifest] = JSON.parse(result.stdout.slice(start));
	return {
		errors: [],
		packed: manifest.files.map((/** @type {{ path: string }} */ f) => f.path),
	};
}

/**
 * @param {string[]} packed
 * @param {string[]} targets
 * @returns {string[]}
 */
export function checkPackedFiles(packed, targets) {
	const errors = [];
	const inTarball = new Set(packed);
	for (const required of ["package.json", "README.md", "LICENSE", ...targets]) {
		if (!inTarball.has(required)) {
			errors.push(`tarball is missing ${required}`);
		}
	}
	for (const { why, pattern } of FORBIDDEN) {
		const hits = packed.filter((file) => pattern.test(file));
		if (hits.length > 0) {
			errors.push(
				`tarball would publish ${hits.length} ${why}(s), e.g. ${hits.slice(0, 3).join(", ")}`,
			);
		}
	}
	return errors;
}

const WASM_URL =
	/new URL\(\s*(["'`])([^"'`]+\.wasm)\1\s*,\s*(?:import\.meta\.url|importMetaUrl)\s*\)/g;

/**
 * Finds the WASM assets a bundle loads with `new URL("x.wasm", import.meta.url)`
 * (or the `importMetaUrl` CJS shim) and resolves them against the bundle.
 *
 * @param {string} file Package-relative bundle path.
 * @param {string} code Bundle source.
 * @returns {{ literal: string, asset: string }[]} `asset` is package-relative;
 *   it starts with `../` when the URL escapes the package.
 */
export function findWasmAssetRefs(file, code) {
	return [...code.matchAll(WASM_URL)].map((match) => ({
		literal: match[2],
		asset: path.posix.normalize(
			path.posix.join(path.posix.dirname(file), match[2]),
		),
	}));
}

/**
 * @param {string} dir
 * @param {string[]} files Package-relative file paths on disk.
 * @param {string[]} packed Package-relative file paths in the tarball.
 * @returns {string[]}
 */
export function checkWasmAssets(dir, files, packed) {
	const inTarball = new Set(packed);
	const errors = [];
	for (const file of files) {
		if (!/^dist\/.*\.(js|cjs|mjs)$/.test(file)) continue;
		const code = readFileSync(path.join(dir, file), "utf8");
		for (const { literal, asset } of findWasmAssetRefs(file, code)) {
			if (!inTarball.has(asset)) {
				errors.push(
					`${file} loads ${literal}, but the tarball has no ${asset}`,
				);
			}
		}
	}
	return errors;
}

/**
 * Lists every export subpath that resolves to JavaScript under `condition`,
 * expanding `*` patterns against the files on disk.
 *
 * @param {any} pkg
 * @param {string[]} files
 * @param {"import" | "require"} condition
 * @returns {string[]}
 */
export function loadableSubpaths(pkg, files, condition) {
	if (!pkg.exports || typeof pkg.exports !== "object") return [];
	const subpaths = [];
	for (const [subpath, value] of Object.entries(pkg.exports)) {
		if (!value || typeof value !== "object") continue;
		const target = value[condition];
		if (typeof target !== "string" || !/\.(c|m)?js$/.test(target)) continue;
		if (!subpath.includes("*")) {
			subpaths.push(subpath);
			continue;
		}
		for (const match of expandPattern(target, files)) {
			const concrete = subpath.replace("*", match);
			if (!Object.hasOwn(pkg.exports, concrete)) subpaths.push(concrete);
		}
	}
	return subpaths;
}

/**
 * Loads every JavaScript export subpath in a fresh Node process, through the
 * package's own name and exports map, so a broken bundle fails here and not
 * in a consumer's install. One process per condition keeps this fast.
 *
 * @param {any} pkg
 * @param {string} dir
 * @param {string[]} files
 * @returns {string[]}
 */
function checkEntriesLoad(pkg, dir, files) {
	const errors = [];
	for (const condition of /** @type {const} */ (["import", "require"])) {
		const specifiers = loadableSubpaths(pkg, files, condition).map(
			(subpath) => `${pkg.name}${subpath.slice(1)}`,
		);
		if (specifiers.length === 0) continue;
		const load =
			condition === "import"
				? "await import(specifier)"
				: "require(specifier)";
		// Self-reference resolves `pkg.name` from cwd through the exports map.
		const program = `(async () => {
	const failures = [];
	for (const specifier of ${JSON.stringify(specifiers)}) {
		try {
			const m = ${load};
			if (Object.keys(m).length === 0) throw new Error("no exports");
		} catch (error) {
			failures.push(specifier + ": " + String(error?.stack ?? error).split("\\n").slice(0, 4).join("\\n      "));
		}
	}
	process.stdout.write(JSON.stringify(failures));
})();`;
		const result = spawnSync(process.execPath, ["-e", program], {
			cwd: dir,
			encoding: "utf8",
			timeout: 300_000,
			maxBuffer: 64 * 1024 * 1024,
		});
		let failures;
		try {
			failures = JSON.parse(result.stdout);
		} catch {
			const reason = (result.stderr || result.error?.message || "")
				.trim()
				.split("\n")
				.slice(0, 6)
				.join("\n    ");
			errors.push(`${condition} load check crashed:\n    ${reason}`);
			continue;
		}
		for (const failure of failures) {
			errors.push(`${condition} fails to load ${failure}`);
		}
	}
	return errors;
}

/**
 * @param {string} rootDir Absolute workspace root.
 * @returns {string[]} Publishable package directories relative to the root.
 */
export function findPublishablePackages(rootDir) {
	const packagesDir = path.join(rootDir, "packages");
	return readdirSync(packagesDir)
		.map((name) => `packages/${name}`)
		.filter((relDir) => {
			const manifest = path.join(rootDir, relDir, "package.json");
			return isFile(manifest) && readJson(manifest).private !== true;
		})
		.sort();
}

/**
 * @param {string} rootDir Absolute workspace root.
 * @param {string} relDir Package directory relative to the root.
 * @param {{ metadataOnly?: boolean, load?: boolean }} [options]
 * @returns {{ name: string, errors: string[], packedCount: number | null }}
 */
export function verifyPackage(rootDir, relDir, options = {}) {
	const dir = path.join(rootDir, relDir);
	const pkg = readJson(path.join(dir, "package.json"));
	const errors = checkMetadata(pkg, relDir, dir, rootDir);
	if (options.metadataOnly) {
		return { name: pkg.name, errors, packedCount: null };
	}
	errors.push(...checkFilesEntries(pkg, dir));
	const files = listFiles(dir);
	const entryPoints = checkEntryPoints(pkg, dir, files);
	errors.push(...entryPoints.errors);
	errors.push(...checkRuntimeImports(pkg, dir, files));
	const pack = packList(dir);
	errors.push(...pack.errors);
	if (pack.errors.length === 0) {
		errors.push(...checkPackedFiles(pack.packed, entryPoints.targets));
		errors.push(...checkWasmAssets(dir, files, pack.packed));
	}
	if (options.load && entryPoints.errors.length === 0) {
		errors.push(...checkEntriesLoad(pkg, dir, files));
	}
	return { name: pkg.name, errors, packedCount: pack.packed.length };
}

/**
 * @param {string[]} argv
 * @returns {number} Process exit code.
 */
export function main(argv) {
	const metadataOnly = argv.includes("--metadata-only");
	const load = argv.includes("--load");
	const rootFlag = argv.indexOf("--root");
	const rootDir =
		rootFlag >= 0
			? path.resolve(argv[rootFlag + 1])
			: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
	const lines = [];
	let failed = 0;
	const packages = findPublishablePackages(rootDir);
	for (const relDir of packages) {
		const { name, errors, packedCount } = verifyPackage(rootDir, relDir, {
			metadataOnly,
			load,
		});
		const size = packedCount === null ? "" : ` (${packedCount} files)`;
		if (errors.length === 0) {
			lines.push(`ok    ${name}${size}`);
			continue;
		}
		failed += errors.length;
		lines.push(`FAIL  ${name}${size}`);
		for (const error of errors) lines.push(`  - ${error}`);
	}
	if (packages.length === 0) {
		failed += 1;
		lines.push(`FAIL  no publishable packages under ${rootDir}/packages`);
	}
	lines.push(
		failed === 0
			? `packaging verified for ${packages.length} packages`
			: `${failed} packaging defect(s)`,
	);
	process.stdout.write(`${lines.join("\n")}\n`);
	return failed === 0 ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	process.exitCode = main(process.argv.slice(2));
}
