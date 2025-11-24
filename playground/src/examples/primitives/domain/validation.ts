import * as Domain from "../../../../../src/primitives/Domain/index.js";
import { hash as keccak256 } from "../../../../../src/crypto/Keccak256/index.js";

// Example: Domain validation and error handling

console.log("Valid domains:\n");

// Minimal valid domains (at least one field)
try {
	const nameOnly = Domain.from({ name: "MyApp" });
	console.log("Name only: OK", nameOnly);
} catch (error) {
	console.log("Name only: FAIL", error);
}

try {
	const versionOnly = Domain.from({ version: "1" });
	console.log("Version only: OK", versionOnly);
} catch (error) {
	console.log("Version only: FAIL", error);
}

try {
	const chainOnly = Domain.from({ chainId: 1 });
	console.log("Chain only: OK", chainOnly);
} catch (error) {
	console.log("Chain only: FAIL", error);
}

try {
	const contractOnly = Domain.from({
		verifyingContract: "0x1234567890123456789012345678901234567890",
	});
	console.log("Contract only: OK", contractOnly);
} catch (error) {
	console.log("Contract only: FAIL", error);
}

try {
	const saltOnly = Domain.from({
		salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
	});
	console.log("Salt only: OK", saltOnly);
} catch (error) {
	console.log("Salt only: FAIL", error);
}

// Invalid domains
console.log("\nInvalid domains:\n");

try {
	const empty = Domain.from({});
	console.log("Empty domain: OK", empty);
} catch (error) {
	if (error instanceof Error) {
		console.log("Empty domain: FAIL -", error.message);
	}
}

// Field combinations
console.log("\nField combinations:\n");

const allFields = Domain.from({
	name: "Full",
	version: "1",
	chainId: 1,
	verifyingContract: "0x1234567890123456789012345678901234567890",
	salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
});
console.log(
	"All fields:",
	Domain.getEIP712DomainType(allFields).length,
	"fields",
);

const nameVersion = Domain.from({
	name: "Partial",
	version: "1",
});
console.log(
	"Name + version:",
	Domain.getEIP712DomainType(nameVersion).length,
	"fields",
);

const nameChain = Domain.from({
	name: "Partial",
	chainId: 1,
});
console.log(
	"Name + chain:",
	Domain.getEIP712DomainType(nameChain).length,
	"fields",
);

const nameContract = Domain.from({
	name: "Partial",
	verifyingContract: "0x1234567890123456789012345678901234567890",
});
console.log(
	"Name + contract:",
	Domain.getEIP712DomainType(nameContract).length,
	"fields",
);

// Type coercion
console.log("\nType coercion:\n");

const numericChain = Domain.from({
	name: "App",
	chainId: 1, // number
});
console.log("Numeric chainId:", typeof numericChain.chainId);

const stringAddress = Domain.from({
	name: "App",
	verifyingContract: "0x1234567890123456789012345678901234567890", // string
});
console.log(
	"String address:",
	stringAddress.verifyingContract instanceof Uint8Array,
);

const stringHash = Domain.from({
	name: "App",
	salt: "0x0000000000000000000000000000000000000000000000000000000000000001", // string
});
console.log("String hash:", stringHash.salt instanceof Uint8Array);

// Domain separator determinism
console.log("\nDeterminism:\n");

const domain1 = Domain.from({ name: "Test", version: "1" });
const domain2 = Domain.from({ name: "Test", version: "1" });

const sep1 = Domain.toHash(domain1, { keccak256 });
const sep2 = Domain.toHash(domain2, { keccak256 });

console.log(
	"Same input = same separator:",
	sep1.every((b, i) => b === sep2[i]),
);
