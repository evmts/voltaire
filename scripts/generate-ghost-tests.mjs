#!/usr/bin/env node
import { spawn } from "node:child_process";
/**
 * Generate ghost docs from all test sources across the repo.
 * - TypeScript/JavaScript: every *.(test|spec).{ts,tsx,js,jsx}
 * - Swift: every file under swift/Tests/** (Swift test files)
 * - Zig: extracts all `test "..." { ... }` blocks from .zig and .zig.md files
 * Outputs MDX files under docs/ghosts/tests/<language>/...
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const OUTPUT_ROOT = path.join(REPO_ROOT, "docs", "ghosts", "tests");

function run(cmd, args, opts = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, {
			stdio: ["ignore", "pipe", "pipe"],
			...opts,
		});
		let out = "";
		let err = "";
		child.stdout.on("data", (d) => {
			out += d.toString();
		});
		child.stderr.on("data", (d) => {
			err += d.toString();
		});
		child.on("close", (code) => {
			if (code === 0) resolve(out);
			else reject(new Error(err || `Command failed: ${cmd} ${args.join(" ")}`));
		});
	});
}

async function safeRmDir(dir) {
	try {
		await fs.rm(dir, { recursive: true, force: true });
	} catch {}
}

async function ensureDir(dir) {
	await fs.mkdir(dir, { recursive: true });
}

function _rel(p) {
	return path.relative(REPO_ROOT, p).split(path.sep).join("/");
}

function mdxEscapeTitle(title) {
	return title.replace(/"/g, '\\"');
}

function codeFenceLangByExt(ext) {
	switch (ext) {
		case ".ts":
		case ".tsx":
			return "typescript";
		case ".js":
		case ".jsx":
			return "javascript";
		case ".swift":
			return "swift";
		default:
			return "zig";
	}
}

function _mdxPathFromRel(relFile, languageRoot) {
	// Keep directory structure under languageRoot, convert filename to .mdx
	const parsed = path.parse(relFile);
	const mdxFile = `${parsed.name.replace(/\.+/g, "-")}.mdx`;
	return path.join(languageRoot, parsed.dir, mdxFile);
}

async function writeMdxFile(targetPath, frontmatter, body) {
	const dir = path.dirname(targetPath);
	await ensureDir(dir);
	const content = `---\n${Object.entries(frontmatter)
		.map(([k, v]) => `${k}: ${v}`)
		.join("\n")}\n---\n\n${body}`;
	await fs.writeFile(targetPath, content, "utf8");
}

async function gatherGitFiles(patternRegex) {
	const out = await run("bash", ["-lc", "git ls-files"]);
	const files = out
		.split("\n")
		.map((s) => s.trim())
		.filter((s) => s.length > 0 && patternRegex.test(s));
	return files;
}

async function handleTSJSTests() {
	const languageRoot = path.join(OUTPUT_ROOT, "typescript");
	const testRegex = /\.(test|spec)\.(t|j)sx?$/;
	const files = await gatherGitFiles(testRegex);
	let count = 0;
	for (const file of files) {
		const abs = path.join(REPO_ROOT, file);
		try {
			await fs.stat(abs);
		} catch {
			// Skip files that no longer exist in working tree
			continue;
		}
		const src = await fs.readFile(abs, "utf8");
		const ext = path.extname(file);
		const lang = codeFenceLangByExt(ext);
		const body = [
			`> Auto-generated from test file: ${file}`,
			"",
			`\`\`\`${lang}`,
			src,
			"```",
			"",
		].join("\n");
		const title = mdxEscapeTitle(`[TS/JS] ${file}`);
		const target = path.join(languageRoot, `${file}.mdx`);
		await writeMdxFile(
			target,
			{ title: `'${title}'`, source: `'${file}'` },
			body,
		);
		count++;
	}
	return count;
}

async function handleSwiftTests() {
	const languageRoot = path.join(OUTPUT_ROOT, "swift");
	const swiftRegex = /^swift\/Tests\/.*\.swift$/;
	const files = await gatherGitFiles(swiftRegex);
	let count = 0;
	for (const file of files) {
		const abs = path.join(REPO_ROOT, file);
		try {
			await fs.stat(abs);
		} catch {
			continue;
		}
		const src = await fs.readFile(abs, "utf8");
		const body = [
			`> Auto-generated from Swift test file: ${file}`,
			"",
			"```swift",
			src,
			"```",
			"",
		].join("\n");
		const title = mdxEscapeTitle(`[Swift] ${file}`);
		const target = path.join(
			languageRoot,
			`${file.replace(/^swift\//, "")}.mdx`,
		);
		await writeMdxFile(
			target,
			{ title: `'${title}'`, source: `'${file}'` },
			body,
		);
		count++;
	}
	return count;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: zig parsing logic
function* extractZigTestBlocks(content) {
	// Finds test "name" { ...balanced braces... }
	const lines = content.split(/\r?\n/);
	const startRegex = /^\s*test\s*"([^"]+)"\s*\{\s*$/;
	for (let i = 0; i < lines.length; i++) {
		const m = lines[i].match(startRegex);
		if (!m) continue;
		const name = m[1];
		let block = `${lines[i]}\n`;
		let brace = 0;
		// Count braces starting on this line from the first '{'
		const restOfLine = lines[i].slice(lines[i].indexOf("{"));
		for (const ch of restOfLine) {
			if (ch === "{") brace++;
			else if (ch === "}") brace--;
		}
		let j = i + 1;
		while (j < lines.length && brace > 0) {
			const line = lines[j];
			for (const ch of line) {
				if (ch === "{") brace++;
				else if (ch === "}") brace--;
			}
			block += `${line}\n`;
			j++;
		}
		// Advance i to end of block
		i = j - 1;
		yield { name, block };
	}
}

async function handleZigTests() {
	const languageRoot = path.join(OUTPUT_ROOT, "zig");
	const zigRegex = /\.(zig|zig\.md)$/;
	const files = await gatherGitFiles(zigRegex);
	// Filter to only files containing 'test "'
	const filtered = [];
	for (const file of files) {
		const abs = path.join(REPO_ROOT, file);
		try {
			await fs.stat(abs);
		} catch {
			continue;
		}
		const src = await fs.readFile(abs, "utf8");
		if (src.includes('test "')) filtered.push({ file, src });
	}
	let docCount = 0;
	for (const { file, src } of filtered) {
		const blocks = Array.from(extractZigTestBlocks(src));
		if (blocks.length === 0) continue;
		const parts = [];
		parts.push(`> Auto-generated from Zig tests in: ${file}`);
		parts.push("");
		for (const { name, block } of blocks) {
			parts.push(`### ${name}`);
			parts.push("");
			parts.push("```zig");
			parts.push(block.trimEnd());
			parts.push("```");
			parts.push("");
		}
		const body = parts.join("\n");
		const title = mdxEscapeTitle(`[Zig] ${file}`);
		const target = path.join(languageRoot, `${file}.mdx`);
		await writeMdxFile(
			target,
			{ title: `'${title}'`, source: `'${file}'` },
			body,
		);
		docCount++;
	}
	return docCount;
}

async function main() {
	const start = Date.now();
	await ensureDir(path.join(REPO_ROOT, "docs", "ghosts"));
	await safeRmDir(OUTPUT_ROOT);
	await ensureDir(OUTPUT_ROOT);

	const [_tsjs, _swift, _zig] = await Promise.all([
		handleTSJSTests(),
		handleSwiftTests(),
		handleZigTests(),
	]);

	const _dur = ((Date.now() - start) / 1000).toFixed(1);
}

main().catch((_err) => {
	process.exit(1);
});
