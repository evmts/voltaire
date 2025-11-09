#!/usr/bin/env bun

/**
 * Script to inspect Ox library API structure
 * Generates a comprehensive mapping of available modules and their exports
 */

import * as Ox from "ox";

console.log("=== Ox Library API Inspection ===\n");

// Get all exported modules
const modules = Object.keys(Ox);
console.log(`Total modules exported: ${modules.length}\n`);

// Inspect each module
for (const moduleName of modules.sort()) {
	const module = (Ox as any)[moduleName];

	if (typeof module === "object" && module !== null) {
		const functions = Object.keys(module).sort();
		console.log(`\n## ${moduleName} (${functions.length} exports)`);
		console.log("-".repeat(50));

		for (const fnName of functions) {
			const fn = module[fnName];
			const type = typeof fn;

			if (type === "function") {
				// Try to get function signature
				const fnStr = fn.toString();
				const match = fnStr.match(/^(?:async\s+)?function\s*\w*\s*\((.*?)\)/);
				const params = match ? match[1] : "";
				console.log(`  - ${fnName}(${params})`);
			} else if (type === "object" && fn !== null) {
				const subKeys = Object.keys(fn);
				console.log(`  - ${fnName} {${subKeys.length} properties}`);
			} else {
				console.log(`  - ${fnName}: ${type}`);
			}
		}
	}
}

// Try importing specific modules directly
console.log("\n\n=== Direct Module Imports ===\n");

try {
	const Address = await import("ox/Address");
	console.log("Address module:", Object.keys(Address).sort());
} catch (e) {
	console.log("Address module: Failed to import directly");
}

try {
	const Hex = await import("ox/Hex");
	console.log("Hex module:", Object.keys(Hex).sort());
} catch (e) {
	console.log("Hex module: Failed to import directly");
}

try {
	const Bytes = await import("ox/Bytes");
	console.log("Bytes module:", Object.keys(Bytes).sort());
} catch (e) {
	console.log("Bytes module: Failed to import directly");
}
