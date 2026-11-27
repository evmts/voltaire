#!/usr/bin/env node
/**
 * Packages cross-platform native shared libraries into:
 *   1. Publishable npm optional platform packages:
 *      @tevm/voltaire-{darwin-arm64,darwin-x64,linux-x64,linux-arm64,win32-x64}
 *   2. Standalone C99 ABI release tarballs:
 *      voltaire-c-abi-<version>-<platform>.tar.gz
 *      (containing lib/, include/primitives.h, lib/pkgconfig/voltaire.pc, README.md, LICENSE)
 *   3. SHA256SUMS.txt checksum manifest for release tarballs.
 *
 * Usage:
 *   node scripts/package-native-platforms.mjs [options]
 *
 * Options:
 *   --input-dir <dir>     Directory with <platform>/ subdirs (default: native)
 *   --out-dir <dir>       Output directory (default: dist-native)
 *   --version <semver>    Override package version (default: packages/voltaire-ts/package.json)
 *   --platforms <csv>     Comma-separated platform list (default: all 5 platforms)
 *   --allow-partial       Skip platforms missing from --input-dir instead of failing
 *   --dry-run             Validate configuration and print planned outputs without writing
 *   --verify              Verify generated manifests, files, tarballs, and SHA256SUMS
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);

/**
 * Supported native distribution targets.
 * @type {Record<string, { os: string; cpu: string; ext: "dylib" | "so" | "dll"; prefix: "lib" | ""; libsPrivate: string }>}
 */
export const PLATFORM_SPECS = {
	"darwin-arm64": {
		os: "darwin",
		cpu: "arm64",
		ext: "dylib",
		prefix: "lib",
		libsPrivate: "-lpthread -lm",
	},
	"darwin-x64": {
		os: "darwin",
		cpu: "x64",
		ext: "dylib",
		prefix: "lib",
		libsPrivate: "-lpthread -lm",
	},
	"linux-x64": {
		os: "linux",
		cpu: "x64",
		ext: "so",
		prefix: "lib",
		libsPrivate: "-lpthread -ldl -lm",
	},
	"linux-arm64": {
		os: "linux",
		cpu: "arm64",
		ext: "so",
		prefix: "lib",
		libsPrivate: "-lpthread -ldl -lm",
	},
	"win32-x64": {
		os: "win32",
		cpu: "x64",
		ext: "dll",
		prefix: "",
		libsPrivate: "-lws2_32 -lbcrypt",
	},
};

/**
 * Parse CLI arguments into an options object.
 * @param {string[]} argv
 */
export function parseArgs(argv) {
	const opts = {
		inputDir: path.join(rootDir, "native"),
		outDir: path.join(rootDir, "dist-native"),
		version: "",
		platforms: Object.keys(PLATFORM_SPECS),
		allowPartial: false,
		dryRun: false,
		verify: false,
	};

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--input-dir" && argv[i + 1]) {
			opts.inputDir = path.resolve(argv[++i]);
		} else if (arg === "--out-dir" && argv[i + 1]) {
			opts.outDir = path.resolve(argv[++i]);
		} else if (arg === "--version" && argv[i + 1]) {
			opts.version = argv[++i];
		} else if (arg === "--platforms" && argv[i + 1]) {
			opts.platforms = argv[++i]
				.split(",")
				.map((p) => p.trim())
				.filter(Boolean);
		} else if (arg === "--allow-partial") {
			opts.allowPartial = true;
		} else if (arg === "--dry-run") {
			opts.dryRun = true;
		} else if (arg === "--verify") {
			opts.verify = true;
		} else if (arg === "--help" || arg === "-h") {
			process.stdout.write(
				"Usage: node scripts/package-native-platforms.mjs [--input-dir dir] [--out-dir dir] [--version ver] [--platforms csv] [--allow-partial] [--dry-run] [--verify]\n",
			);
			process.exit(0);
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}

	for (const platform of opts.platforms) {
		if (!PLATFORM_SPECS[platform]) {
			throw new Error(
				`Unsupported platform "${platform}". Supported: ${Object.keys(PLATFORM_SPECS).join(", ")}`,
			);
		}
	}

	return opts;
}

/**
 * Read package metadata from packages/voltaire-ts/package.json.
 */
export function readBasePackageMetadata() {
	const pkgPath = path.join(rootDir, "packages/voltaire-ts/package.json");
	const manifest = JSON.parse(readFileSync(pkgPath, "utf8"));
	return {
		version: manifest.version,
		license: manifest.license || "MIT",
		repository: {
			type: manifest.repository?.type || "git",
			url:
				manifest.repository?.url || "git+https://github.com/evmts/voltaire.git",
		},
		homepage: manifest.homepage || "https://voltaire.tevm.sh/",
		bugs: manifest.bugs || { url: "https://github.com/evmts/voltaire/issues" },
		publishConfig: manifest.publishConfig || {
			access: "public",
			provenance: true,
		},
	};
}

/**
 * Generate a relocatable pkg-config file (`voltaire.pc`).
 * @param {string} version
 * @param {string} platform
 */
export function generatePkgConfig(version, platform) {
	const spec = PLATFORM_SPECS[platform];
	return [
		"prefix=${pcfiledir}/../..",
		"exec_prefix=${prefix}",
		"libdir=${exec_prefix}/lib",
		"includedir=${prefix}/include",
		"",
		"Name: voltaire",
		"Description: Voltaire Ethereum primitives and cryptography C99 ABI library",
		"URL: https://voltaire.tevm.sh/",
		`Version: ${version}`,
		"Libs: -L${libdir} -lprimitives_c",
		`Libs.private: ${spec.libsPrivate}`,
		"Cflags: -I${includedir}",
		"",
	].join("\n");
}

function collectPlatformFiles(platformDir) {
	const files = [];
	for (const dir of [platformDir, path.join(platformDir, "lib")]) {
		if (!existsSync(dir)) continue;
		for (const entry of readdirSync(dir)) {
			const full = path.join(dir, entry);
			if (statSync(full).isFile()) {
				files.push({ name: entry, full });
			}
		}
	}
	return files;
}

function findHeaderPath(platformDir) {
	const candidates = [
		path.join(platformDir, "include", "primitives.h"),
		path.join(platformDir, "primitives.h"),
		path.join(rootDir, "zig-out", "include", "primitives.h"),
		path.join(rootDir, "packages", "voltaire-zig", "src", "primitives.h"),
	];
	return candidates.find((p) => existsSync(p)) ?? null;
}

/**
 * Locate shared library and optional Node-API / header files inside a platform artifact directory.
 * @param {string} platformDir
 * @param {string} platform
 */
function discoverPlatformBinaries(platformDir, platform) {
	const spec = PLATFORM_SPECS[platform];
	const extSuffix = `.${spec.ext}`;
	const found = {
		sharedLib: null,
		cApiLib: null,
		nodeAddon: null,
		header: null,
	};
	if (!existsSync(platformDir)) return found;

	const allFiles = collectPlatformFiles(platformDir);
	const preferShared = [
		`${spec.prefix}voltaire_native${extSuffix}`,
		`${spec.prefix}primitives_ts_native${extSuffix}`,
		`${spec.prefix}primitives_c${extSuffix}`,
		`libvoltaire_native${extSuffix}`,
		`libprimitives_ts_native${extSuffix}`,
		`libprimitives_c${extSuffix}`,
	];

	for (const candidate of preferShared) {
		const hit = allFiles.find((f) => f.name === candidate);
		if (hit && !found.sharedLib) found.sharedLib = hit.full;
	}
	if (!found.sharedLib) {
		const anyShared = allFiles.find((f) => f.name.endsWith(extSuffix));
		if (anyShared) found.sharedLib = anyShared.full;
	}

	const cApiHit = allFiles.find(
		(f) =>
			f.name === `${spec.prefix}primitives_c${extSuffix}` ||
			f.name === `libprimitives_c${extSuffix}`,
	);
	found.cApiLib = cApiHit ? cApiHit.full : found.sharedLib;
	found.nodeAddon = allFiles.find((f) => f.name.endsWith(".node"))?.full ?? null;
	found.header = findHeaderPath(platformDir);
	return found;
}

/**
 * Build the npm platform package manifest JSON.
 * @param {string} platform
 * @param {ReturnType<typeof readBasePackageMetadata>} meta
 * @param {string[]} files
 * @param {string} primaryLib
 * @param {string | null} nodeAddonFilename
 */
export function buildPlatformPackageJson(
	platform,
	meta,
	files,
	primaryLib,
	nodeAddonFilename,
) {
	const spec = PLATFORM_SPECS[platform];
	const exportsMap = {
		"./package.json": "./package.json",
		[`./${primaryLib}`]: `./${primaryLib}`,
	};
	for (const file of files) {
		if (file.endsWith(`.${spec.ext}`) || file.endsWith(".node")) {
			exportsMap[`./${file}`] = `./${file}`;
		}
	}

	return {
		name: `@tevm/voltaire-${platform}`,
		version: meta.version,
		description: `Prebuilt native Zig FFI binary for @tevm/voltaire on ${platform}`,
		os: [spec.os],
		cpu: [spec.cpu],
		main: nodeAddonFilename ?? primaryLib,
		files,
		exports: exportsMap,
		license: meta.license,
		repository: meta.repository,
		homepage: meta.homepage,
		bugs: meta.bugs,
		publishConfig: meta.publishConfig,
		sideEffects: false,
	};
}

function buildNpmPlatformReadme(platform, version, primaryLib) {
	return [
		`# @tevm/voltaire-${platform}`,
		"",
		`Prebuilt native Zig FFI shared library for \`@tevm/voltaire\` on **${platform}** (v${version}).`,
		"",
		"This package is installed automatically as an optional dependency of `@tevm/voltaire`.",
		"",
		"## Usage",
		"",
		"```ts",
		'import { Keccak256, Secp256k1, SHA256 } from "@tevm/voltaire/native";',
		"```",
		"",
		`Bundled binary: \`${primaryLib}\``,
		"",
	].join("\n");
}

function buildCAbiReadme(platform, version, cApiLibName) {
	return [
		`# Voltaire C99 ABI (${platform}, v${version})`,
		"",
		"Prebuilt C99 shared library, header, and pkg-config metadata for Voltaire.",
		"",
		"## Contents",
		"",
		`- \`lib/${cApiLibName}\` — Self-contained shared library (Zig core + blst + c-kzg-4844 + libwally-core)`,
		"- `include/primitives.h` — Auto-generated C99 ABI header",
		"- `lib/pkgconfig/voltaire.pc` — Relocatable `pkg-config` manifest",
		"",
		"## Quick Start (`pkg-config`)",
		"",
		"```bash",
		`export PKG_CONFIG_PATH="$PWD/lib/pkgconfig:$PKG_CONFIG_PATH"`,
		"cc example.c $(pkg-config --cflags --libs voltaire) -Wl,-rpath,$PWD/lib -o example",
		"./example",
		"```",
		"",
	].join("\n");
}

function sha256File(filePath) {
	const hash = createHash("sha256");
	hash.update(readFileSync(filePath));
	return hash.digest("hex");
}

function writeNpmPlatformPackage({
	platform,
	meta,
	binaries,
	npmDir,
	npmPkgJson,
	voltaireNativeName,
	tsNativeName,
	nodeAddonName,
}) {
	mkdirSync(npmDir, { recursive: true });
	copyFileSync(binaries.sharedLib, path.join(npmDir, voltaireNativeName));
	copyFileSync(binaries.sharedLib, path.join(npmDir, tsNativeName));
	if (binaries.nodeAddon && nodeAddonName) {
		copyFileSync(binaries.nodeAddon, path.join(npmDir, nodeAddonName));
	}
	writeFileSync(
		path.join(npmDir, "package.json"),
		`${JSON.stringify(npmPkgJson, null, 2)}\n`,
		"utf8",
	);
	writeFileSync(
		path.join(npmDir, "README.md"),
		buildNpmPlatformReadme(platform, meta.version, voltaireNativeName),
		"utf8",
	);
	const rootLicense = path.join(rootDir, "LICENSE");
	if (existsSync(rootLicense)) {
		copyFileSync(rootLicense, path.join(npmDir, "LICENSE"));
	} else {
		writeFileSync(path.join(npmDir, "LICENSE"), "MIT License\n", "utf8");
	}
}

function writeCAbiTarball({
	platform,
	meta,
	binaries,
	npmDir,
	cAbiDir,
	tarballPath,
	cApiLibName,
}) {
	const stageBase = mkdtempSync(
		path.join(tmpdir(), `voltaire-c-abi-${platform}-`),
	);
	try {
		const archiveRootName = `voltaire-c-abi-${meta.version}-${platform}`;
		const archiveRoot = path.join(stageBase, archiveRootName);
		const libDir = path.join(archiveRoot, "lib");
		const pkgConfigDir = path.join(libDir, "pkgconfig");
		const includeDir = path.join(archiveRoot, "include");
		mkdirSync(pkgConfigDir, { recursive: true });
		mkdirSync(includeDir, { recursive: true });

		copyFileSync(
			binaries.cApiLib ?? binaries.sharedLib,
			path.join(libDir, cApiLibName),
		);
		copyFileSync(binaries.header, path.join(includeDir, "primitives.h"));
		writeFileSync(
			path.join(pkgConfigDir, "voltaire.pc"),
			generatePkgConfig(meta.version, platform),
			"utf8",
		);
		writeFileSync(
			path.join(archiveRoot, "README.md"),
			buildCAbiReadme(platform, meta.version, cApiLibName),
			"utf8",
		);
		copyFileSync(path.join(npmDir, "LICENSE"), path.join(archiveRoot, "LICENSE"));

		mkdirSync(cAbiDir, { recursive: true });
		execFileSync("tar", ["-czf", tarballPath, "-C", stageBase, archiveRootName]);
	} finally {
		rmSync(stageBase, { recursive: true, force: true });
	}
}

function planPlatformPackaging(platform, opts, meta) {
	const spec = PLATFORM_SPECS[platform];
	const platformInputDir = path.join(opts.inputDir, platform);
	const binaries = discoverPlatformBinaries(platformInputDir, platform);
	const tsNativeName = `${spec.prefix}primitives_ts_native.${spec.ext}`;
	const voltaireNativeName = `${spec.prefix}voltaire_native.${spec.ext}`;
	const cApiLibName = `${spec.prefix}primitives_c.${spec.ext}`;
	const nodeAddonName = binaries.nodeAddon
		? `voltaire_native.${platform}.node`
		: null;
	const npmFiles = [voltaireNativeName, tsNativeName, "README.md", "LICENSE"];
	if (nodeAddonName) npmFiles.unshift(nodeAddonName);
	const npmPkgJson = buildPlatformPackageJson(
		platform,
		meta,
		npmFiles,
		voltaireNativeName,
		nodeAddonName,
	);
	const tarballName = `voltaire-c-abi-${meta.version}-${platform}.tar.gz`;
	const npmDir = path.join(opts.outDir, "npm", `voltaire-${platform}`);
	const cAbiDir = path.join(opts.outDir, "c-abi");
	return {
		platformInputDir,
		binaries,
		tsNativeName,
		voltaireNativeName,
		cApiLibName,
		nodeAddonName,
		npmPkgJson,
		tarballName,
		npmDir,
		cAbiDir,
		tarballPath: path.join(cAbiDir, tarballName),
	};
}

/**
 * Stage a single platform's npm package and C99 ABI tarball.
 */
function packagePlatform(platform, opts, meta) {
	const plan = planPlatformPackaging(platform, opts, meta);
	if (opts.dryRun) {
		return {
			platform,
			status: plan.binaries.sharedLib ? "ready" : "planned",
			npmPackage: plan.npmPkgJson.name,
			npmDir: plan.npmDir,
			tarballPath: plan.tarballPath,
			manifest: plan.npmPkgJson,
			hasBinary: Boolean(plan.binaries.sharedLib),
		};
	}

	if (!plan.binaries.sharedLib) {
		throw new Error(
			`Missing shared library for platform "${platform}" in ${plan.platformInputDir}`,
		);
	}
	if (!plan.binaries.header) {
		throw new Error(
			`Missing primitives.h header for platform "${platform}" (checked ${plan.platformInputDir} and packages/voltaire-zig/src/primitives.h)`,
		);
	}

	writeNpmPlatformPackage({ platform, meta, ...plan });
	writeCAbiTarball({ platform, meta, ...plan });

	return {
		platform,
		status: "packaged",
		npmPackage: plan.npmPkgJson.name,
		npmDir: plan.npmDir,
		tarballPath: plan.tarballPath,
		tarballName: plan.tarballName,
		sha256: sha256File(plan.tarballPath),
		manifest: plan.npmPkgJson,
		hasBinary: true,
	};
}

/**
 * Verify every generated npm package manifest, binary, and C99 ABI tarball.
 */
function verifyOutputs(results, meta) {
	for (const item of results) {
		const spec = PLATFORM_SPECS[item.platform];
		const manifestPath = path.join(item.npmDir, "package.json");
		const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

		if (manifest.name !== `@tevm/voltaire-${item.platform}`) {
			throw new Error(`Unexpected package name: ${manifest.name}`);
		}
		if (manifest.version !== meta.version) {
			throw new Error(
				`Version mismatch in ${manifest.name}: expected ${meta.version}, got ${manifest.version}`,
			);
		}
		if (
			JSON.stringify(manifest.os) !== JSON.stringify([spec.os]) ||
			JSON.stringify(manifest.cpu) !== JSON.stringify([spec.cpu])
		) {
			throw new Error(`os/cpu mismatch in ${manifest.name}`);
		}
		if (manifest.publishConfig?.access !== "public") {
			throw new Error(`Missing publishConfig.access=public in ${manifest.name}`);
		}
		for (const file of manifest.files) {
			const filePath = path.join(item.npmDir, file);
			if (!existsSync(filePath) || statSync(filePath).size === 0) {
				throw new Error(`Missing or empty packaged file: ${filePath}`);
			}
		}

		// Verify tarball contents
		const listing = execFileSync("tar", ["-tzf", item.tarballPath], {
			encoding: "utf8",
		})
			.split("\n")
			.filter(Boolean);
		const prefix = `voltaire-c-abi-${meta.version}-${item.platform}/`;
		const requiredEntries = [
			`${prefix}lib/${spec.prefix}primitives_c.${spec.ext}`,
			`${prefix}include/primitives.h`,
			`${prefix}lib/pkgconfig/voltaire.pc`,
			`${prefix}README.md`,
		];
		for (const req of requiredEntries) {
			if (!listing.includes(req)) {
				throw new Error(
					`Tarball ${item.tarballPath} is missing required entry: ${req}`,
				);
			}
		}
	}
}

function main() {
	const opts = parseArgs(process.argv.slice(2));
	const baseMeta = readBasePackageMetadata();
	const meta = {
		...baseMeta,
		version: opts.version || baseMeta.version,
	};

	const activePlatforms = opts.allowPartial
		? opts.platforms.filter((p) => existsSync(path.join(opts.inputDir, p)))
		: opts.platforms;

	if (!opts.dryRun && activePlatforms.length === 0) {
		throw new Error(
			`No platform directories found under ${opts.inputDir}. Expected one or more of: ${opts.platforms.join(", ")}`,
		);
	}

	const results = activePlatforms.map((platform) =>
		packagePlatform(platform, opts, meta),
	);

	if (opts.dryRun) {
		process.stdout.write(
			`${JSON.stringify(
				{
					mode: "dry-run",
					version: meta.version,
					inputDir: opts.inputDir,
					outDir: opts.outDir,
					platforms: results.map((r) => ({
						platform: r.platform,
						status: r.status,
						npmPackage: r.npmPackage,
						os: r.manifest.os,
						cpu: r.manifest.cpu,
						files: r.manifest.files,
						tarball: path.basename(r.tarballPath),
					})),
				},
				null,
				2,
			)}\n`,
		);
		return;
	}

	// Write SHA256SUMS.txt for all C99 ABI release tarballs
	const checksumLines = results.map((r) => `${r.sha256}  ${r.tarballName}`);
	const checksumPath = path.join(opts.outDir, "c-abi", "SHA256SUMS.txt");
	writeFileSync(checksumPath, `${checksumLines.join("\n")}\n`, "utf8");

	if (opts.verify) {
		verifyOutputs(results, meta);
	}

	process.stdout.write(
		`Packaged ${results.length} platform(s) (v${meta.version}) into ${opts.outDir}${opts.verify ? " [verified]" : ""}\n`,
	);
	for (const r of results) {
		process.stdout.write(
			`  - ${r.npmPackage}@${meta.version} -> ${r.npmDir}\n  - ${r.tarballName} (${r.sha256.slice(0, 12)}...)\n`,
		);
	}
}

const isEntrypoint =
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
	main();
}
