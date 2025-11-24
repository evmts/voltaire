import * as Address from "voltaire/primitives/Address";
import * as Authorization from "voltaire/primitives/Authorization";

// Example: Authorization Validation
// Demonstrates validation rules and error handling

console.log("=== Authorization Validation ===\n");

const delegate = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const zeroAddress = Address.from("0x0000000000000000000000000000000000000000");

// Helper to test validation
function testValidation(name: string, auth: any, shouldPass: boolean): void {
	try {
		Authorization.validate(auth);
		if (shouldPass) {
			console.log(`${name}: PASS (as expected)`);
		} else {
			console.log(`${name}: PASS (unexpected)`);
		}
	} catch (error) {
		if (!shouldPass) {
			console.log(`${name}: FAIL (as expected)`);
			console.log(`  Error: ${(error as Error).message}`);
		} else {
			console.log(`${name}: FAIL (unexpected)`);
			console.log(`  Error: ${(error as Error).message}`);
		}
	}
}

console.log("Valid Authorization:\n");

const valid = {
	chainId: 1n,
	address: delegate,
	nonce: 0n,
	yParity: 0,
	r: new Uint8Array(32).fill(1),
	s: new Uint8Array(32).fill(2),
};

testValidation("Valid authorization", valid, true);
console.log();

console.log("Chain ID Validation:\n");

testValidation("Zero chain ID", { ...valid, chainId: 0n }, false);
testValidation("Valid chain ID (1)", { ...valid, chainId: 1n }, true);
testValidation("Large chain ID", { ...valid, chainId: 999999n }, true);
console.log();

console.log("Address Validation:\n");

testValidation("Zero address", { ...valid, address: zeroAddress }, false);
testValidation("Valid address", { ...valid, address: delegate }, true);
console.log();

console.log("yParity Validation:\n");

testValidation("yParity = 0", { ...valid, yParity: 0 }, true);
testValidation("yParity = 1", { ...valid, yParity: 1 }, true);
testValidation("yParity = 2 (invalid)", { ...valid, yParity: 2 }, false);
testValidation("yParity = -1 (invalid)", { ...valid, yParity: -1 }, false);
console.log();

console.log("Signature r Validation:\n");

testValidation("r = 0 (invalid)", { ...valid, r: new Uint8Array(32) }, false);
testValidation("r = 1", { ...valid, r: new Uint8Array(32).fill(1) }, true);
testValidation(
	"r >= N (invalid)",
	{ ...valid, r: Authorization.SECP256K1_N },
	false,
);
console.log();

console.log("Signature s Validation:\n");

testValidation("s = 0 (invalid)", { ...valid, s: new Uint8Array(32) }, false);
testValidation("s = 1", { ...valid, s: new Uint8Array(32).fill(1) }, true);
testValidation(
	"s = N/2 (max valid)",
	{ ...valid, s: Authorization.SECP256K1_HALF_N },
	true,
);
testValidation(
	"s > N/2 (malleable)",
	{ ...valid, s: Authorization.SECP256K1_HALF_N + 1n },
	false,
);
console.log();

console.log("Type Guards:\n");

console.log("isItem Tests:");
console.log("- Valid auth:", Authorization.isItem(valid));
console.log(
	"- Missing chainId:",
	Authorization.isItem({ ...valid, chainId: undefined }),
);
console.log("- Wrong type:", Authorization.isItem("not an auth"));
console.log("- Null:", Authorization.isItem(null));
console.log();

const unsigned = {
	chainId: 1n,
	address: delegate,
	nonce: 0n,
};

console.log("isUnsigned Tests:");
console.log("- Valid unsigned:", Authorization.isUnsigned(unsigned));
console.log("- Signed auth:", Authorization.isUnsigned(valid));
console.log(
	"- Missing nonce:",
	Authorization.isUnsigned({ chainId: 1n, address: delegate }),
);
console.log();

console.log("Summary:");
console.log("- Chain ID must be non-zero");
console.log("- Address cannot be zero address");
console.log("- yParity must be 0 or 1");
console.log("- r and s must be non-zero");
console.log("- r must be < secp256k1 curve order");
console.log("- s must be <= N/2 (non-malleable)");
