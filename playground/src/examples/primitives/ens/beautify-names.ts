import { Ens } from "voltaire";
const basicExamples = [
	"VITALIK.eth",
	"Nick.ETH",
	"TestName.eth",
	"UPPERCASE.eth",
	"MixedCase.ETH",
];
for (const name of basicExamples) {
	const beautified = Ens.beautify(name);
}
const compareExamples = ["TEST.eth", "CamelCase.eth", "lowercase.eth"];

for (const name of compareExamples) {
	const normalized = Ens.normalize(name);
	const beautified = Ens.beautify(name);
	const same = normalized === beautified;
}
const emojiExamples = ["💩.eth", "🚀.eth", "❤️.eth", "🌟.eth", "🔥.eth"];
for (const name of emojiExamples) {
	try {
		const beautified = Ens.beautify(name);
	} catch (error) {}
}
const mixedExamples = ["rocket🚀.eth", "love❤️.eth", "fire🔥test.eth"];

for (const name of mixedExamples) {
	try {
		const beautified = Ens.beautify(name);
	} catch (error) {}
}
const unicodeExamples = [
	{ name: "café.eth", desc: "accented characters" },
	{ name: "münchen.eth", desc: "German umlaut" },
	{ name: "日本.eth", desc: "Japanese characters" },
	{ name: "москва.eth", desc: "Cyrillic characters" },
];

for (const { name, desc } of unicodeExamples) {
	try {
		const beautified = Ens.beautify(name);
	} catch (error) {}
}

const displayExamples = ["MyCompany.eth", "TestDomain.eth"];

for (const name of displayExamples) {
	const normalized = Ens.normalize(name);
	const beautified = Ens.beautify(name);
}
const subdomainExamples = [
	"App.Company.eth",
	"Test.Domain.ETH",
	"SUB.DOMAIN.eth",
];

for (const name of subdomainExamples) {
	const beautified = Ens.beautify(name);
}
const invalidExamples = [
	{ name: "invalid\x00.eth", desc: "null byte" },
	{ name: "control\x01.eth", desc: "control character" },
];

for (const { name, desc } of invalidExamples) {
	try {
		Ens.beautify(name);
	} catch (error) {}
}

const practical = "VitalIK.ETH";
