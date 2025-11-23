import { modules as voltaireModules } from "./VoltaireModules.js";

export class Executor {
	async execute(code: string): Promise<void> {
		// Extract imports
		const imports = this.extractImports(code);

		// Debug: log what's in the modules
		console.log("Available modules:", Object.keys(voltaireModules));
		for (const imp of imports) {
			const mod = voltaireModules[imp.path];
			console.log(`Module ${imp.path}:`, Object.keys(mod || {}).slice(0, 10));
		}

		// Transform imports to use pre-loaded modules
		const transformedCode = this.transformImports(code, imports);

		// Execute via eval in async context (modules in scope)
		try {
			const fn = new Function(
				"modules",
				`
        return (async () => {
          ${transformedCode}
        })();
      `,
			);
			await fn(voltaireModules);
		} catch (error) {
			if (error instanceof Error) {
				console.error(error.message);
				throw error;
			}
			console.error("Unknown error during execution");
			throw new Error("Unknown error during execution");
		}
	}

	private extractImports(
		code: string,
	): Array<{ name: string; path: string; isNamed: boolean; names?: string[] }> {
		const imports: Array<{
			name: string;
			path: string;
			isNamed: boolean;
			names?: string[];
		}> = [];

		// Match: import * as Name from 'path'
		const namespaceRegex =
			/import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g;
		let match;
		while ((match = namespaceRegex.exec(code)) !== null) {
			imports.push({ name: match[1], path: match[2], isNamed: false });
		}

		// Match: import { a, b, c } from 'path'
		const namedRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]\s*;?/g;
		while ((match = namedRegex.exec(code)) !== null) {
			const names = match[1].split(",").map((n) => n.trim());
			const path = match[2];
			// Use first name as identifier for the module
			imports.push({ name: names[0], path, isNamed: true, names });
		}

		return imports;
	}

	private transformImports(
		code: string,
		imports: Array<{
			name: string;
			path: string;
			isNamed: boolean;
			names?: string[];
		}>,
	): string {
		// Remove all import statements
		let transformed = code.replace(
			/import\s+(\*\s+as\s+\w+|\{[^}]+\})\s+from\s+['"][^'"]+['"]\s*;?\n?/g,
			"",
		);

		// Remove TypeScript type assertions (e as Type)
		transformed = transformed.replace(/\s+as\s+\w+/g, "");

		// Inject module references at the top
		const moduleDecls = imports
			.map((imp) => {
				if (imp.isNamed && imp.names) {
					// Destructure from module: const { Address, toHex } = modules['path'];
					return `const { ${imp.names.join(", ")} } = modules['${imp.path}'];`;
				} else {
					// Namespace import: const Name = modules['path'];
					return `const ${imp.name} = modules['${imp.path}'];`;
				}
			})
			.join("\n");

		return `${moduleDecls}\n${transformed}`;
	}
}
