import { Ens, Hex } from "@tevm/voltaire";
const basicLabels = ["eth", "com", "xyz", "org", "io"];

for (const label of basicLabels) {
	const hash = Ens.labelhash(label);
}
const commonLabels = ["vitalik", "nick", "brantly", "dao", "app", "www"];

for (const label of commonLabels) {
	const hash = Ens.labelhash(label);
}
const subLabels = ["sub", "test", "staging", "prod", "api", "app"];

for (const label of subLabels) {
	const hash = Ens.labelhash(label);
}
const specialLabels = ["123", "456eth", "my-name", "test_domain", "0x123"];

for (const label of specialLabels) {
	const hash = Ens.labelhash(label);
}
const caseExamples = [
	["vitalik", "VITALIK", "Vitalik"],
	["eth", "ETH", "Eth"],
	["test", "TEST", "Test"],
];

for (const [lower, upper, mixed] of caseExamples) {
	const lowerHash = Ens.labelhash(lower);
	const upperHash = Ens.labelhash(upper);
	const mixedHash = Ens.labelhash(mixed);
}

const label = "vitalik";
const labelHash = Ens.labelhash(label);
const nameHash = Ens.namehash(`${label}.eth`);
