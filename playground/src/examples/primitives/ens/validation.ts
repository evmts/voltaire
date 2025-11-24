import * as Ens from "../../../primitives/Ens/index.js";

// Example: ENS name validation and error handling

console.log("\n===== ENS Name Validation =====");

// Valid ENS names
console.log("\n1. Valid ENS Names:");
const validNames = [
	"vitalik.eth",
	"nick.eth",
	"my-name.eth",
	"test123.eth",
	"sub.domain.eth",
	"a.eth",
	"123.eth",
];

for (const name of validNames) {
	try {
		const normalized = Ens.normalize(name);
		const isValid = Ens.is(normalized);
		console.log(
			`  ✓ ${name.padEnd(20)} → normalized: ${normalized.padEnd(20)} valid: ${isValid}`,
		);
	} catch (error) {
		console.log(`  ✗ ${name.padEnd(20)} → Error: ${(error as Error).message}`);
	}
}

// Type checking with Ens.is()
console.log("\n2. Type Checking:");
const testValues: unknown[] = ["vitalik.eth", "", 123, null, undefined, {}, []];

for (const value of testValues) {
	const isEns = Ens.is(value);
	const type = typeof value;
	const repr =
		value === null
			? "null"
			: value === undefined
				? "undefined"
				: type === "string"
					? `"${value}"`
					: type === "object"
						? JSON.stringify(value)
						: String(value);
	console.log(
		`  ${repr.padEnd(20)} (${type.padEnd(9)}) → ${isEns ? "✓ valid" : "✗ invalid"}`,
	);
}

// Empty string handling
console.log("\n3. Empty String Handling:");
const emptyTests = ["", "   ", "\t", "\n"];

for (const test of emptyTests) {
	const isValid = Ens.is(test);
	const repr =
		test === ""
			? "(empty)"
			: `"${test.replace(/\t/g, "\\t").replace(/\n/g, "\\n")}"`;
	console.log(`  ${repr.padEnd(20)} → ${isValid ? "✓ valid" : "✗ invalid"}`);
}

// Invalid characters
console.log("\n4. Invalid Characters:");
const invalidChars = [
	{ name: "null-byte.eth\x00", desc: "null byte" },
	{ name: "control\x01.eth", desc: "control char" },
	{ name: "tab\t.eth", desc: "tab" },
	{ name: "newline\n.eth", desc: "newline" },
];

for (const { name, desc } of invalidChars) {
	try {
		Ens.normalize(name);
		console.log(`  ✗ ${desc.padEnd(20)} → Should have thrown error`);
	} catch (error) {
		console.log(`  ✓ ${desc.padEnd(20)} → Rejected: ${(error as Error).name}`);
	}
}

// Case normalization validation
console.log("\n5. Case Normalization Validation:");
const caseTests = [
	{ input: "VITALIK.eth", expected: "vitalik.eth" },
	{ input: "Nick.ETH", expected: "nick.eth" },
	{ input: "MixedCase.eth", expected: "mixedcase.eth" },
	{ input: "UPPERCASE.ETH", expected: "uppercase.eth" },
];

for (const { input, expected } of caseTests) {
	const normalized = Ens.normalize(input);
	const matches = normalized === expected;
	const status = matches ? "✓" : "✗";
	console.log(
		`  ${status} ${input.padEnd(20)} → ${normalized.padEnd(20)} (expected: ${expected})`,
	);
}

// Domain structure validation
console.log("\n6. Domain Structure:");
const structureTests = [
	{ name: "single", valid: true },
	{ name: "two.labels", valid: true },
	{ name: "three.label.domain", valid: true },
	{ name: ".leading-dot", valid: "may fail" },
	{ name: "trailing-dot.", valid: "may fail" },
	{ name: "double..dot", valid: "may fail" },
];

for (const { name, valid } of structureTests) {
	try {
		const normalized = Ens.normalize(name);
		const status = valid === true ? "✓" : valid === false ? "✗" : "?";
		console.log(`  ${status} ${name.padEnd(25)} → ${normalized}`);
	} catch (error) {
		console.log(`  ✗ ${name.padEnd(25)} → Error: ${(error as Error).name}`);
	}
}

// Emoji validation (may or may not be supported)
console.log("\n7. Emoji and Unicode:");
const unicodeTests = ["💩.eth", "🚀.eth", "café.eth", "münchen.eth"];

for (const name of unicodeTests) {
	try {
		const normalized = Ens.normalize(name);
		console.log(`  ✓ ${name.padEnd(20)} → ${normalized}`);
	} catch (error) {
		console.log(`  ✗ ${name.padEnd(20)} → ${(error as Error).name}`);
	}
}

// Length validation
console.log("\n8. Length Validation:");
const lengthTests = [
	{ name: "a.eth", desc: "very short" },
	{ name: "short.eth", desc: "short" },
	{ name: "normal-length-domain.eth", desc: "normal" },
	{ name: "very-long-domain-name-with-many-characters.eth", desc: "long" },
];

for (const { name, desc } of lengthTests) {
	try {
		const normalized = Ens.normalize(name);
		console.log(
			`  ✓ ${desc.padEnd(12)} (${name.length.toString().padStart(2)} chars) → ${normalized}`,
		);
	} catch (error) {
		console.log(
			`  ✗ ${desc.padEnd(12)} (${name.length.toString().padStart(2)} chars) → ${(error as Error).name}`,
		);
	}
}
