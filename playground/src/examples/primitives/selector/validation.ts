import * as Selector from "../../../primitives/Selector/index.js";

// Example: Validating selectors and handling errors

console.log("=== Selector Validation ===\n");

console.log("--- Valid Selectors ---\n");

try {
	const sel1 = Selector.fromHex("0xa9059cbb");
	console.log(`Valid hex (with 0x):     ${Selector.toHex(sel1)} ✓`);
} catch (e) {
	console.log(`Unexpected error: ${e.message}`);
}

try {
	const sel2 = Selector.from("0xa9059cbb");
	console.log(`Valid hex string:        ${Selector.toHex(sel2)} ✓`);
} catch (e) {
	console.log(`Unexpected error: ${e.message}`);
}

try {
	const sel3 = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
	console.log(`Valid bytes (4 bytes):   ${Selector.toHex(sel3)} ✓`);
} catch (e) {
	console.log(`Unexpected error: ${e.message}`);
}

try {
	const sel4 = Selector.fromSignature("transfer(address,uint256)");
	console.log(`Valid signature:         ${Selector.toHex(sel4)} ✓\n`);
} catch (e) {
	console.log(`Unexpected error: ${e.message}\n`);
}

console.log("--- Invalid Length (Hex) ---\n");

const invalidHexLengths = [
	"0x",
	"0xa9",
	"0xa905",
	"0xa9059c",
	"0xa9059cbbaa",
	"0xa9059cbb00000000",
];

for (const hex of invalidHexLengths) {
	try {
		Selector.fromHex(hex);
		console.log(`${hex.padEnd(20)} -> Should have failed!`);
	} catch (e) {
		console.log(`${hex.padEnd(20)} -> ${e.message}`);
	}
}

console.log("\n--- Invalid Length (Bytes) ---\n");

const invalidByteLengths = [0, 1, 2, 3, 5, 8, 16, 32];

for (const len of invalidByteLengths) {
	try {
		const bytes = new Uint8Array(len);
		Selector.from(bytes);
		console.log(`${len} bytes -> Should have failed!`);
	} catch (e) {
		console.log(`${len} bytes -> Must be exactly 4 bytes`);
	}
}

console.log("\n--- Correct Length ---\n");

try {
	const bytes4 = new Uint8Array(4);
	const sel = Selector.from(bytes4);
	console.log(`4 bytes -> ${Selector.toHex(sel)} ✓`);
} catch (e) {
	console.log(`Unexpected error: ${e.message}`);
}

console.log("\n--- Invalid Types ---\n");

const invalidTypes = [null, undefined, 42, true, {}, []];

for (const val of invalidTypes) {
	try {
		// @ts-expect-error - Testing invalid input
		Selector.from(val);
		console.log(`${typeof val} -> Should have failed!`);
	} catch (e) {
		console.log(`${typeof val} -> Invalid input type`);
	}
}

console.log("\n=== Validating Calldata ===\n");

function validateCalldata(calldata: string): {
	valid: boolean;
	selector?: string;
	error?: string;
} {
	try {
		if (!calldata.startsWith("0x")) {
			return { valid: false, error: "Missing 0x prefix" };
		}

		if (calldata.length < 10) {
			return { valid: false, error: "Calldata too short for selector" };
		}

		const selector = Selector.from(calldata.slice(0, 10));
		return { valid: true, selector: Selector.toHex(selector) };
	} catch (e) {
		return { valid: false, error: e.message };
	}
}

const testCalldata = [
	"0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
	"0x095ea7b3",
	"a9059cbb", // Missing 0x
	"0xabcd", // Too short
	"0x", // Empty
	"", // Empty
];

for (const data of testCalldata) {
	const result = validateCalldata(data);
	const display = data.length > 30 ? data.slice(0, 30) + "..." : data;
	if (result.valid) {
		console.log(`${display.padEnd(35)} ✓ ${result.selector}`);
	} else {
		console.log(`${display.padEnd(35)} ✗ ${result.error}`);
	}
}

console.log("\n=== Selector Whitelist Pattern ===\n");

const allowedSelectors = new Set([
	Selector.toHex(Selector.fromSignature("transfer(address,uint256)")),
	Selector.toHex(Selector.fromSignature("approve(address,uint256)")),
	Selector.toHex(Selector.fromSignature("balanceOf(address)")),
]);

function isAllowedFunction(calldata: string): boolean {
	try {
		if (calldata.length < 10) return false;
		const sel = Selector.toHex(Selector.from(calldata.slice(0, 10)));
		return allowedSelectors.has(sel);
	} catch {
		return false;
	}
}

console.log("Whitelisted functions: transfer, approve, balanceOf\n");

const testFunctions = [
	{ data: "0xa9059cbb" + "0".repeat(128), name: "transfer" },
	{ data: "0x095ea7b3" + "0".repeat(128), name: "approve" },
	{ data: "0x70a08231" + "0".repeat(64), name: "balanceOf" },
	{ data: "0x23b872dd" + "0".repeat(192), name: "transferFrom" },
	{ data: "0x12345678" + "0".repeat(128), name: "unknown" },
];

for (const fn of testFunctions) {
	const allowed = isAllowedFunction(fn.data);
	const status = allowed ? "✓" : "✗";
	console.log(
		`${fn.name.padEnd(15)} ${status} ${allowed ? "Allowed" : "Blocked"}`,
	);
}

console.log("\n=== Defensive Validation Helper ===\n");

function safeExtractSelector(
	input: unknown,
): { success: true; selector: string } | { success: false; error: string } {
	try {
		// Type guard
		if (typeof input !== "string" && !(input instanceof Uint8Array)) {
			return { success: false, error: "Input must be string or Uint8Array" };
		}

		let selectorData: string;

		if (typeof input === "string") {
			// Extract from calldata
			if (!input.startsWith("0x")) {
				return { success: false, error: "String must start with 0x" };
			}
			if (input.length < 10) {
				return { success: false, error: "String too short for selector" };
			}
			selectorData = input.slice(0, 10);
		} else {
			// Validate byte array
			if (input.length < 4) {
				return { success: false, error: "Byte array too short" };
			}
			const bytes = input.slice(0, 4);
			const sel = Selector.from(bytes);
			return { success: true, selector: Selector.toHex(sel) };
		}

		const selector = Selector.from(selectorData);
		return { success: true, selector: Selector.toHex(selector) };
	} catch (e) {
		return { success: false, error: e.message };
	}
}

console.log("Testing defensive extraction:\n");

const testInputs: unknown[] = [
	"0xa9059cbb000000",
	new Uint8Array([0xa9, 0x05, 0x9c, 0xbb, 0x00]),
	"invalid",
	null,
	"0x12",
];

for (const input of testInputs) {
	const result = safeExtractSelector(input);
	const display =
		typeof input === "string"
			? input.slice(0, 20)
			: input instanceof Uint8Array
				? `Uint8Array(${input.length})`
				: String(input);

	if (result.success) {
		console.log(`${display.padEnd(25)} ✓ ${result.selector}`);
	} else {
		console.log(`${display.padEnd(25)} ✗ ${result.error}`);
	}
}
