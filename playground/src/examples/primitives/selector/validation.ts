import { Bytes, Selector } from "@tevm/voltaire";
try {
	const sel1 = Selector.fromHex("0xa9059cbb");
} catch (e) {}

try {
	const sel2 = Selector("0xa9059cbb");
} catch (e) {}

try {
	const sel3 = Selector(Bytes([0xa9, 0x05, 0x9c, 0xbb]));
} catch (e) {}

try {
	const sel4 = Selector.fromSignature("transfer(address,uint256)");
} catch (e) {}

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
	} catch (e) {}
}

const invalidByteLengths = [0, 1, 2, 3, 5, 8, 16, 32];

for (const len of invalidByteLengths) {
	try {
		const bytes = Bytes.zero(len);
		Selector(bytes);
	} catch (e) {}
}

try {
	const bytes4 = Bytes.zero(4);
	const sel = Selector(bytes4);
} catch (e) {}

const invalidTypes = [null, undefined, 42, true, {}, []];

for (const val of invalidTypes) {
	try {
		// @ts-expect-error - Testing invalid input
		Selector(val);
	} catch (e) {}
}

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

		const selector = Selector(calldata.slice(0, 10));
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
	const display = data.length > 30 ? `${data.slice(0, 30)}...` : data;
	if (result.valid) {
	} else {
	}
}

const allowedSelectors = new Set([
	Selector.toHex(Selector.fromSignature("transfer(address,uint256)")),
	Selector.toHex(Selector.fromSignature("approve(address,uint256)")),
	Selector.toHex(Selector.fromSignature("balanceOf(address)")),
]);

function isAllowedFunction(calldata: string): boolean {
	try {
		if (calldata.length < 10) return false;
		const sel = Selector.toHex(Selector(calldata.slice(0, 10)));
		return allowedSelectors.has(sel);
	} catch {
		return false;
	}
}

const testFunctions = [
	{ data: `0xa9059cbb${"0".repeat(128)}`, name: "transfer" },
	{ data: `0x095ea7b3${"0".repeat(128)}`, name: "approve" },
	{ data: `0x70a08231${"0".repeat(64)}`, name: "balanceOf" },
	{ data: `0x23b872dd${"0".repeat(192)}`, name: "transferFrom" },
	{ data: `0x12345678${"0".repeat(128)}`, name: "unknown" },
];

for (const fn of testFunctions) {
	const allowed = isAllowedFunction(fn.data);
	const status = allowed ? "✓" : "✗";
}

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
			const sel = Selector(bytes);
			return { success: true, selector: Selector.toHex(sel) };
		}

		const selector = Selector(selectorData);
		return { success: true, selector: Selector.toHex(selector) };
	} catch (e) {
		return { success: false, error: e.message };
	}
}

const testInputs: unknown[] = [
	"0xa9059cbb000000",
	Bytes([0xa9, 0x05, 0x9c, 0xbb, 0x00]),
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
	} else {
	}
}
