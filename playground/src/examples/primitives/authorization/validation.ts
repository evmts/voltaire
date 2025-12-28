import { Address, Authorization, Bytes, Bytes32 } from "@tevm/voltaire";

const delegate = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const zeroAddress = Address("0x0000000000000000000000000000000000000000");

// Helper to test validation
function testValidation(name: string, auth: any, shouldPass: boolean): void {
	try {
		Authorization.validate(auth);
		if (shouldPass) {
		} else {
		}
	} catch (error) {
		if (!shouldPass) {
		} else {
		}
	}
}

const valid = {
	chainId: 1n,
	address: delegate,
	nonce: 0n,
	yParity: 0,
	r: Bytes32.zero().fill(1),
	s: Bytes32.zero().fill(2),
};

testValidation("Valid authorization", valid, true);

testValidation("Zero chain ID", { ...valid, chainId: 0n }, false);
testValidation("Valid chain ID (1)", { ...valid, chainId: 1n }, true);
testValidation("Large chain ID", { ...valid, chainId: 999999n }, true);

testValidation("Zero address", { ...valid, address: zeroAddress }, false);
testValidation("Valid address", { ...valid, address: delegate }, true);

testValidation("yParity = 0", { ...valid, yParity: 0 }, true);
testValidation("yParity = 1", { ...valid, yParity: 1 }, true);
testValidation("yParity = 2 (invalid)", { ...valid, yParity: 2 }, false);
testValidation("yParity = -1 (invalid)", { ...valid, yParity: -1 }, false);

testValidation("r = 0 (invalid)", { ...valid, r: Bytes32.zero() }, false);
testValidation("r = 1", { ...valid, r: Bytes32.zero().fill(1) }, true);
testValidation(
	"r >= N (invalid)",
	{ ...valid, r: Authorization.SECP256K1_N },
	false,
);

testValidation("s = 0 (invalid)", { ...valid, s: Bytes32.zero() }, false);
testValidation("s = 1", { ...valid, s: Bytes32.zero().fill(1) }, true);
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

const unsigned = {
	chainId: 1n,
	address: delegate,
	nonce: 0n,
};
