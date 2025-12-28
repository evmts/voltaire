import { Ens, hash as keccak256, Hex, Labelhash, Namehash } from "@tevm/voltaire";
// Factory API (explicit dependency injection)

const namehash = Namehash({ keccak256 });
const labelhash = Labelhash({ keccak256 });

const name = Ens("vitalik.eth");

// Wrapper API (auto-converts)
const hash1 = Ens.namehash("vitalik.eth");

// Factory API (no conversion, uses branded type)
const hash2 = namehash(name);

const input = "VITALIK.eth";

// Public wrapper (auto-converts)
const publicResult = Ens.normalize(input);

// Internal method (requires branded type)
const branded = Ens(input);
const internalResult = Ens._normalize(branded);

const regularString: string = "vitalik.eth";
const ensName = Ens(regularString);
const backToString = Ens.toString(ensName);
const testValues = ["vitalik.eth", "", "   ", null, undefined, 123];
for (const value of testValues) {
	const isValid = Ens.is(value);
	const repr =
		value === null
			? "null"
			: value === undefined
				? "undefined"
				: typeof value === "string"
					? `"${value}"`
					: String(value);
}
const domains = ["vitalik.eth", "nick.eth", "brantly.eth", "dao.eth"];
const results = domains.map((domain) => {
	const normalized = Ens.normalize(domain);
	const hash = Ens.namehash(normalized);
	return { domain, normalized, hash };
});

for (const { domain, normalized, hash } of results) {
}

const similar = [
	"vitalik.eth",
	"vitalik1.eth",
	"vitalikbuterin.eth",
	"buterin.eth",
];
for (const domain of similar) {
	const hash = Ens.namehash(domain);
}

const parent = "example.eth";
const children = ["sub1.example.eth", "sub2.example.eth", "different.eth"];

const parentHash = Ens.namehash(parent);
for (const child of children) {
	const childHash = Ens.namehash(child);
	const isChild = child.endsWith(`.${parent}`);
}

const testName = "vitalik.eth";
const iterations = 1000;

const normalizeStart = performance.now();
for (let i = 0; i < iterations; i++) {
	Ens.normalize(testName);
}
const normalizeTime = performance.now() - normalizeStart;

const hashStart = performance.now();
const normalized = Ens.normalize(testName);
for (let i = 0; i < iterations; i++) {
	Ens.namehash(normalized);
}
const hashTime = performance.now() - hashStart;

const inputs = ["valid.eth", "invalid\x00.eth", "UPPERCASE.eth"];

for (const input of inputs) {
	try {
		const normalized = Ens.normalize(input);
		const hash = Ens.namehash(normalized);
	} catch (error) {
		const errorName = (error as Error).name;
	}
}
