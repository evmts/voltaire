import * as Ens from "../../../primitives/Ens/index.js";
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
	} catch (error) {}
}
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
}
const emptyTests = ["", "   ", "\t", "\n"];

for (const test of emptyTests) {
	const isValid = Ens.is(test);
	const repr =
		test === ""
			? "(empty)"
			: `"${test.replace(/\t/g, "\\t").replace(/\n/g, "\\n")}"`;
}
const invalidChars = [
	{ name: "null-byte.eth\x00", desc: "null byte" },
	{ name: "control\x01.eth", desc: "control char" },
	{ name: "tab\t.eth", desc: "tab" },
	{ name: "newline\n.eth", desc: "newline" },
];

for (const { name, desc } of invalidChars) {
	try {
		Ens.normalize(name);
	} catch (error) {}
}
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
}
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
	} catch (error) {}
}
const unicodeTests = ["💩.eth", "🚀.eth", "café.eth", "münchen.eth"];

for (const name of unicodeTests) {
	try {
		const normalized = Ens.normalize(name);
	} catch (error) {}
}
const lengthTests = [
	{ name: "a.eth", desc: "very short" },
	{ name: "short.eth", desc: "short" },
	{ name: "normal-length-domain.eth", desc: "normal" },
	{ name: "very-long-domain-name-with-many-characters.eth", desc: "long" },
];

for (const { name, desc } of lengthTests) {
	try {
		const normalized = Ens.normalize(name);
	} catch (error) {}
}
