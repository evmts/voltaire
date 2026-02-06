import { hash as keccak256 } from "@tevm/voltaire";
import { Domain } from "@tevm/voltaire";

// Minimal valid domains (at least one field)
try {
	const nameOnly = Domain({ name: "MyApp" });
} catch (error) {}

try {
	const versionOnly = Domain({ version: "1" });
} catch (error) {}

try {
	const chainOnly = Domain({ chainId: 1 });
} catch (error) {}

try {
	const contractOnly = Domain({
		verifyingContract: "0x1234567890123456789012345678901234567890",
	});
} catch (error) {}

try {
	const saltOnly = Domain({
		salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
	});
} catch (error) {}

try {
	const empty = Domain({});
} catch (error) {
	if (error instanceof Error) {
	}
}

const allFields = Domain({
	name: "Full",
	version: "1",
	chainId: 1,
	verifyingContract: "0x1234567890123456789012345678901234567890",
	salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
});

const nameVersion = Domain({
	name: "Partial",
	version: "1",
});

const nameChain = Domain({
	name: "Partial",
	chainId: 1,
});

const nameContract = Domain({
	name: "Partial",
	verifyingContract: "0x1234567890123456789012345678901234567890",
});

const numericChain = Domain({
	name: "App",
	chainId: 1, // number
});

const stringAddress = Domain({
	name: "App",
	verifyingContract: "0x1234567890123456789012345678901234567890", // string
});

const stringHash = Domain({
	name: "App",
	salt: "0x0000000000000000000000000000000000000000000000000000000000000001", // string
});

const domain1 = Domain({ name: "Test", version: "1" });
const domain2 = Domain({ name: "Test", version: "1" });

const sep1 = Domain.toHash(domain1, { keccak256 });
const sep2 = Domain.toHash(domain2, { keccak256 });
