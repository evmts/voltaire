/**
 * Example demonstrating bracket matching and colorization features
 *
 * Rainbow brackets help visually match nested structures.
 * Try using Cmd+Shift+\ to jump to matching brackets.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

// Deeply nested function calls (demonstrates rainbow bracket levels)
declare function someFunction(x: unknown): unknown;
declare function anotherFunction(x: unknown): unknown;
declare function deeplyNested(...args: unknown[]): unknown;

const result = someFunction(
	anotherFunction(
		deeplyNested({ key: "value", nested: { deep: [1, 2, 3] } }, [
			{ id: 1, data: { type: "test" } },
			{ id: 2, data: { type: "prod" } },
		]),
	),
);

// Complex object with multiple bracket types
const config = {
	server: {
		port: 3000,
		host: "localhost",
		middleware: [
			(req, res, next) => {
				console.log(`Request: ${req.method} ${req.url}`);
				next();
			},
			(req, res, next) => {
				if (req.headers["authorization"]) {
					next();
				} else {
					res.status(401).json({ error: "Unauthorized" });
				}
			},
		],
	},
	database: {
		connection: {
			host: "localhost",
			port: 5432,
			credentials: {
				username: "admin",
				password: "secret",
			},
		},
	},
};

// Nested array operations
const matrix = [
	[1, 2, 3],
	[4, 5, 6],
	[7, 8, 9],
]
	.map((row) => row.map((cell) => cell * 2))
	.filter((row) => row.some((cell) => cell > 10));

// Complex conditionals with multiple bracket levels
function processData(input: unknown) {
	if (typeof input === "object" && input !== null) {
		if (Array.isArray(input)) {
			return input.map((item) => {
				if (typeof item === "object") {
					return Object.entries(item).reduce((acc, [key, value]) => {
						return { ...acc, [key]: String(value) };
					}, {});
				}
				return item;
			});
		} else {
			return Object.entries(input).reduce((acc, [key, value]) => {
				if (typeof value === "object" && value !== null) {
					return { ...acc, [key]: processData(value) };
				}
				return { ...acc, [key]: value };
			}, {});
		}
	}
	return input;
}

// Bracket guide demonstration (vertical lines show nesting)
const guidesExample = {
	level1: {
		level2: {
			level3: {
				level4: {
					level5: {
						deeplyNested: true,
					},
				},
			},
		},
	},
};

/**
 * Tips for bracket features:
 *
 * 1. Rainbow Brackets: Each nesting level gets a different color (Gold → Pink → Cyan)
 * 2. Bracket Guides: Vertical lines show bracket pair relationships
 * 3. Jump to Bracket: Press Cmd+Shift+\ to jump to matching bracket
 * 4. Select to Bracket: Press Cmd+Shift+Alt+\ to select content within brackets
 * 5. Highlight Matching: Click near a bracket to highlight its match
 * 6. Auto-closing: Type an opening bracket to auto-insert closing bracket
 */
