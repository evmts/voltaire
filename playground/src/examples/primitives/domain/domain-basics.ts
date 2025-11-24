import * as Domain from "../../../../../src/primitives/Domain/index.js";
import { hash as keccak256 } from "../../../../../src/crypto/Keccak256/index.js";
import * as Hex from "../../../../../src/primitives/Hex/index.js";

// Example: Domain basics for EIP-712 typed data signing

// Minimal domain with just name
const minimal = Domain.from({
	name: "MyDApp",
});
console.log("Minimal domain:", minimal);

// Complete domain with all fields
const complete = Domain.from({
	name: "Uniswap V2",
	version: "1",
	chainId: 1,
	verifyingContract: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
});
console.log("\nComplete domain:", complete);

// Domain with salt for disambiguation
const withSalt = Domain.from({
	name: "MyProtocol",
	version: "1",
	chainId: 1,
	salt: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
});
console.log("\nDomain with salt:", withSalt);

// Compute domain separator (EIP-712 hash)
const separator = Domain.toHash(complete, { keccak256 });
console.log(
	"\nDomain separator:",
	Hex.fromBytes(separator).toLowerCase().slice(0, 20) + "...",
);

// Get EIP-712 type definition
const typeDefinition = Domain.getEIP712DomainType(complete);
console.log("\nEIP-712 domain type:", typeDefinition);

// Domain for mainnet vs testnet
const mainnet = Domain.from({
	name: "MyDApp",
	version: "1",
	chainId: 1,
	verifyingContract: "0x0000000000000000000000000000000000000001",
});

const sepolia = Domain.from({
	name: "MyDApp",
	version: "1",
	chainId: 11155111,
	verifyingContract: "0x0000000000000000000000000000000000000001",
});

const mainnetSep = Domain.toHash(mainnet, { keccak256 });
const sepoliaSep = Domain.toHash(sepolia, { keccak256 });

console.log("\nMainnet separator:", Hex.fromBytes(mainnetSep).slice(0, 20));
console.log("Sepolia separator:", Hex.fromBytes(sepoliaSep).slice(0, 20));
console.log(
	"Different?",
	!Hex.equals(Hex.fromBytes(mainnetSep), Hex.fromBytes(sepoliaSep)),
);

// Version upgrade handling
const v1 = Domain.from({ name: "Protocol", version: "1" });
const v2 = Domain.from({ name: "Protocol", version: "2" });
const v1Sep = Domain.toHash(v1, { keccak256 });
const v2Sep = Domain.toHash(v2, { keccak256 });

console.log("\nV1 separator:", Hex.fromBytes(v1Sep).slice(0, 20));
console.log("V2 separator:", Hex.fromBytes(v2Sep).slice(0, 20));
console.log("Version upgrade creates different separator");
