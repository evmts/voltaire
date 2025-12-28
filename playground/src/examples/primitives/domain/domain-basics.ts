import { hash as keccak256 } from "voltaire";
import { Domain, Hex } from "voltaire";

// Example: Domain basics for EIP-712 typed data signing

// Minimal domain with just name
const minimal = Domain.from({
	name: "MyDApp",
});

// Complete domain with all fields
const complete = Domain.from({
	name: "Uniswap V2",
	version: "1",
	chainId: 1,
	verifyingContract: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
});

// Domain with salt for disambiguation
const withSalt = Domain.from({
	name: "MyProtocol",
	version: "1",
	chainId: 1,
	salt: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
});

// Compute domain separator (EIP-712 hash)
const separator = Domain.toHash(complete, { keccak256 });

// Get EIP-712 type definition
const typeDefinition = Domain.getEIP712DomainType(complete);

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

// Version upgrade handling
const v1 = Domain.from({ name: "Protocol", version: "1" });
const v2 = Domain.from({ name: "Protocol", version: "2" });
const v1Sep = Domain.toHash(v1, { keccak256 });
const v2Sep = Domain.toHash(v2, { keccak256 });
