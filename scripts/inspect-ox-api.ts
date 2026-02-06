#!/usr/bin/env bun

/**
 * Script to inspect Ox library API structure
 * Generates a comprehensive mapping of available modules and their exports
 */

import * as Ox from "ox";

// Get all exported modules
const modules = Object.keys(Ox);

// Inspect each module
for (const moduleName of modules.sort()) {
	const module = (Ox as any)[moduleName];

	if (typeof module === "object" && module !== null) {
		const functions = Object.keys(module).sort();

		for (const fnName of functions) {
			const fn = module[fnName];
			const type = typeof fn;

			if (type === "function") {
				// Try to get function signature
				const fnStr = fn.toString();
				const match = fnStr.match(/^(?:async\s+)?function\s*\w*\s*\((.*?)\)/);
				const params = match ? match[1] : "";
			} else if (type === "object" && fn !== null) {
				const subKeys = Object.keys(fn);
			} else {
			}
		}
	}
}

try {
	const Address = await import("ox/Address");
} catch (e) {}

try {
	const Hex = await import("ox/Hex");
} catch (e) {}

try {
	const Bytes = await import("ox/Bytes");
} catch (e) {}
