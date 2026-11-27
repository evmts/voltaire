#!/usr/bin/env node
/**
 * Publishes every public workspace package whose version is not on npm yet.
 *
 * Usage:
 *   node scripts/publish-npm.mjs            # CI only: GitHub Actions on main, CI_VERIFIED_SHA = HEAD
 *   node scripts/publish-npm.mjs --dry-run  # build, verify and print the plan; publish nothing
 *
 * Order of work: build every publishable artifact (fresh WASM, then the
 * TypeScript packages), verify packaging with --load, check the registry,
 * then publish the missing ones with npm provenance and --ignore-scripts, so
 * the exact files that passed verification are the files that ship; a
 * prepack or prepublishOnly hook cannot rebuild them afterwards. A rerun after
 * a partial failure publishes only what is still missing.
 *
 * When GITHUB_OUTPUT is set, writes `published` (true when @tevm/voltaire was
 * published), `name`, `version` and `published_packages` (JSON array).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findPublishablePackages, main as verify } from "./verify-packaging.mjs";

const PRIMARY = "@tevm/voltaire";
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");

/** @param {string} line */
const say = (line) => process.stdout.write(`${line}\n`);

/**
 * @param {string} key
 * @param {string} value
 */
function setOutput(key, value) {
	if (process.env.GITHUB_OUTPUT) {
		appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
	}
}

/**
 * @param {string} name
 * @returns {string[]} Versions on the registry. Empty when the package has
 *   never been published. Throws when the registry cannot answer.
 */
function publishedVersions(name) {
	const result = spawnSync("npm", ["view", name, "versions", "--json"], {
		encoding: "utf8",
	});
	if (result.status === 0) {
		const versions = JSON.parse(result.stdout);
		return Array.isArray(versions) ? versions : [versions];
	}
	if (`${result.stdout}${result.stderr}`.includes("E404")) return [];
	throw new Error(
		`Unable to read published versions of ${name}; refusing to publish.\n${result.stderr}`,
	);
}

if (
	!dryRun &&
	(process.env.GITHUB_ACTIONS !== "true" ||
		process.env.GITHUB_REF !== "refs/heads/main")
) {
	process.stderr.write(
		"Publishing is restricted to the GitHub Actions release job on main. Use --dry-run locally.\n",
	);
	process.exit(1);
}

// The release workflow sets CI_VERIFIED_SHA only after CI passed for that
// commit (workflow_run success, or a checked manual dispatch). Refuse to
// publish any other checkout.
if (!dryRun) {
	const head = execFileSync("git", ["rev-parse", "HEAD"], {
		cwd: rootDir,
		encoding: "utf8",
	}).trim();
	const verified = process.env.CI_VERIFIED_SHA ?? "";
	if (verified !== head) {
		process.stderr.write(
			`CI_VERIFIED_SHA (${verified || "unset"}) does not match HEAD ${head}; refusing to publish a commit without a passing CI run.\n`,
		);
		process.exit(1);
	}
}

// Order matters: @tevm/voltaire copies the fresh WASM into its dist.
for (const [name, script] of [
	["@tevm/zig", "build:wasm"],
	["@tevm/voltaire", "build"],
]) {
	execFileSync("pnpm", ["--filter", name, "run", script], {
		cwd: rootDir,
		stdio: "inherit",
	});
}

if (verify(["--load"]) !== 0) {
	process.stderr.write("Packaging verification failed; nothing was published.\n");
	process.exit(1);
}

const packages = findPublishablePackages(rootDir).map((relDir) => {
	const manifest = JSON.parse(
		readFileSync(path.join(rootDir, relDir, "package.json"), "utf8"),
	);
	const dependencies = Object.keys({
		...manifest.dependencies,
		...manifest.peerDependencies,
		...manifest.optionalDependencies,
	});
	return { name: manifest.name, version: manifest.version, dir: path.join(rootDir, relDir), dependencies };
});
const names = new Set(packages.map((p) => p.name));
// A package publishes after the workspace packages it depends on.
packages.sort(
	(a, b) =>
		a.dependencies.filter((d) => names.has(d)).length -
			b.dependencies.filter((d) => names.has(d)).length ||
		a.name.localeCompare(b.name),
);

const npmAuthToken = (process.env.NODE_AUTH_TOKEN || process.env.NPM_TOKEN || "").trim();
const publishEnv = { ...process.env };
delete publishEnv.NODE_AUTH_TOKEN;
delete publishEnv.NPM_TOKEN;
if (npmAuthToken) {
	publishEnv["npm_config_//registry.npmjs.org/:_authToken"] = npmAuthToken;
} else {
	// Pure npm OIDC Trusted Publishing: ensure no stale or blank _authToken in
	// any user .npmrc overrides GitHub Actions OIDC token exchange.
	publishEnv.NPM_CONFIG_USERCONFIG = process.platform === "win32" ? "NUL" : "/dev/null";
}

const published = [];
for (const { name, version, dir } of packages) {
	if (publishedVersions(name).includes(version)) {
		say(`${name}@${version} is already published; skipping.`);
		continue;
	}
	if (dryRun) {
		say(`${name}@${version} would be published.`);
		continue;
	}
	const packDir = mkdtempSync(path.join(os.tmpdir(), "voltaire-publish-"));
	try {
		// Pack with --ignore-scripts so the exact verified artifacts ship unchanged,
		// then publish via npm CLI (>= 11.5.1) for full OIDC Trusted Publishing support.
		const packJson = execFileSync(
			"npm",
			["pack", "--json", "--ignore-scripts", "--pack-destination", packDir],
			{ cwd: dir, encoding: "utf8" },
		);
		const [{ filename }] = JSON.parse(packJson);
		const tarball = path.join(packDir, filename);
		execFileSync(
			"npm",
			[
				"publish",
				tarball,
				"--registry=https://registry.npmjs.org",
				"--access",
				"public",
				"--provenance",
			],
			{ cwd: rootDir, stdio: "inherit", env: publishEnv },
		);
	} finally {
		rmSync(packDir, { recursive: true, force: true });
	}
	published.push({ name, version });
	// changesets/action uses this line to identify packages to tag.
	say(`🦋  New tag: ${name}@${version}`);
}

const primary = packages.find((p) => p.name === PRIMARY);
if (primary) {
	setOutput("name", primary.name);
	setOutput("version", primary.version);
}
setOutput("published", String(published.some((p) => p.name === PRIMARY)));
setOutput("published_packages", JSON.stringify(published));
