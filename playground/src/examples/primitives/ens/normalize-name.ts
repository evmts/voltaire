import * as Ens from "../../../primitives/Ens/index.js";

// Normalization converts names to canonical lowercase form
// This ensures consistent hashing and lookups

// Basic normalization
const examples = [
	"VITALIK.eth",
	"Nick.ETH",
	"CamelCase.eth",
	"UPPERCASE.eth",
	"MixedCase.ETH",
];
for (const name of examples) {
	const normalized = Ens.normalize(name);
}
const subdomains = ["Sub.Domain.eth", "DEEP.SUB.DOMAIN.eth", "My.Name.eth"];

for (const name of subdomains) {
	const normalized = Ens.normalize(name);
}
const alreadyNormalized = ["vitalik.eth", "nick.eth", "lowercase.eth"];

for (const name of alreadyNormalized) {
	const normalized = Ens.normalize(name);
	const matches = name === normalized;
}
try {
	Ens.normalize("invalid\x00.eth"); // Contains null byte
} catch (error) {}
try {
	const emoji = Ens.normalize("💩.eth");
} catch (error) {}
