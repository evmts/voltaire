import { appendFileSync, readFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";

if (
	process.env.GITHUB_ACTIONS !== "true" ||
	process.env.GITHUB_REF !== "refs/heads/main"
) {
	console.error("Publishing is restricted to the GitHub Actions release job on main.");
	process.exit(1);
}

const packageJson = JSON.parse(
	readFileSync(new URL("../packages/voltaire-ts/package.json", import.meta.url)),
);
const { name, version } = packageJson;

function setOutput(key, value) {
	if (process.env.GITHUB_OUTPUT) {
		appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
	}
}

let publishedVersions;
try {
	publishedVersions = JSON.parse(
		execFileSync("npm", ["view", name, "versions", "--json"], {
			encoding: "utf8",
		}),
	);
} catch (error) {
	console.error(`Unable to verify published versions for ${name}; refusing to publish.`);
	throw error;
}

const versions = Array.isArray(publishedVersions)
	? publishedVersions
	: [publishedVersions];

setOutput("name", name);
setOutput("version", version);

if (versions.includes(version)) {
	console.log(`${name}@${version} is already published; nothing to do.`);
	setOutput("published", "false");
	process.exit(0);
}

const result = spawnSync(
	"pnpm",
	[
		"--filter",
		name,
		"publish",
		"--access",
		"public",
		"--provenance",
		"--no-git-checks",
	],
	{ stdio: "inherit" },
);

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

setOutput("published", "true");
console.log(`Published ${name}@${version} with npm provenance.`);
