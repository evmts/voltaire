#!/usr/bin/env bun
/**
 * Fix typedef comment blocks in eth method files
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ETH_DIR = "/Users/williamcory/voltaire/src/jsonrpc/eth";

function fixFile(filePath: string) {
	let content = readFileSync(filePath, "utf-8");

	// Fix the broken typedef comment block
	content = content.replace(
		/ \* @typedef \{import\('\.\.\/\.\.\/types\/index\.js'\)\.BlockSpec\} BlockSpec\n \*\/\n \* @typedef \{import\('\.\.\/\.\.\/types\/JsonRpcRequest\.js'\)\.JsonRpcRequest\} JsonRpcRequest\n \*\//g,
		` * @typedef {import('../../types/index.js').BlockSpec} BlockSpec\n * @typedef {import('../../types/JsonRpcRequest.js').JsonRpcRequest} JsonRpcRequest\n */`,
	);

	writeFileSync(filePath, content);
}

// Process all method directories
const dirs = readdirSync(ETH_DIR, { withFileTypes: true })
	.filter((d) => d.isDirectory())
	.map((d) => d.name);

for (const dir of dirs) {
	const files = readdirSync(join(ETH_DIR, dir));
	const jsFile = files.find((f) => f.endsWith(".js") && f.startsWith("eth_"));
	if (jsFile) {
		const filePath = join(ETH_DIR, dir, jsFile);
		fixFile(filePath);
	}
}
