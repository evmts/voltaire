import { hash as keccak256 } from "../../../../../src/crypto/Keccak256/index.js";
import * as Domain from "../../../../../src/primitives/Domain/index.js";

// Minimal valid domains (at least one field)
try {
	const nameOnly = Domain.from({ name: "MyApp" });
} catch (error) {}

try {
	const versionOnly = Domain.from({ version: "1" });
} catch (error) {}

try {
	const chainOnly = Domain.from({ chainId: 1 });
} catch (error) {}

try {
	const contractOnly = Domain.from({
		verifyingContract: "0x1234567890123456789012345678901234567890",
	});
} catch (error) {}

try {
	const saltOnly = Domain.from({
		salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
	});
} catch (error) {}

try {
	const empty = Domain.from({});
} catch (error) {
	if (error instanceof Error) {
	}
}

const allFields = Domain.from({
	name: "Full",
	version: "1",
	chainId: 1,
	verifyingContract: "0x1234567890123456789012345678901234567890",
	salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
});

const nameVersion = Domain.from({
	name: "Partial",
	version: "1",
});

const nameChain = Domain.from({
	name: "Partial",
	chainId: 1,
});

const nameContract = Domain.from({
	name: "Partial",
	verifyingContract: "0x1234567890123456789012345678901234567890",
});

const numericChain = Domain.from({
	name: "App",
	chainId: 1, // number
});

const stringAddress = Domain.from({
	name: "App",
	verifyingContract: "0x1234567890123456789012345678901234567890", // string
});

const stringHash = Domain.from({
	name: "App",
	salt: "0x0000000000000000000000000000000000000000000000000000000000000001", // string
});

const domain1 = Domain.from({ name: "Test", version: "1" });
const domain2 = Domain.from({ name: "Test", version: "1" });

const sep1 = Domain.toHash(domain1, { keccak256 });
const sep2 = Domain.toHash(domain2, { keccak256 });
