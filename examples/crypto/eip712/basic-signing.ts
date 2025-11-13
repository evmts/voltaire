/**
 * Basic EIP-712 Typed Data Signing
 *
 * Demonstrates:
 * - Defining typed data structures
 * - Domain separator
 * - Signing typed data
 * - Signature verification
 * - Address recovery
 */

import * as EIP712 from "../../../src/crypto/Eip712/index.js";
import * as Address from "../../../src/primitives/Address/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

// Generate private key for examples
const privateKeyBytes = new Uint8Array(32);
crypto.getRandomValues(privateKeyBytes);
const privateKey = Hex.fromBytes(privateKeyBytes);

const simpleTypedData = {
	domain: {
		name: "My DApp",
		version: "1",
		chainId: 1n,
	},
	types: {
		Message: [{ name: "content", type: "string" }],
	},
	primaryType: "Message",
	message: {
		content: "Hello, EIP-712!",
	},
};

const simpleHash = EIP712.hashTypedData(simpleTypedData);

const simpleSignature = EIP712.signTypedData(simpleTypedData, privateKey);

const recoveredAddress = EIP712.recoverAddress(
	simpleSignature,
	simpleTypedData,
);

const isValid = EIP712.verifyTypedData(
	simpleSignature,
	simpleTypedData,
	recoveredAddress,
);

// Wrong address fails
const wrongAddress = Address.fromHex(
	"0x0000000000000000000000000000000000000000",
);
const wrongVerify = EIP712.verifyTypedData(
	simpleSignature,
	simpleTypedData,
	wrongAddress,
);

const complexTypedData = {
	domain: {
		name: "Ether Mail",
		version: "1",
		chainId: 1n,
		verifyingContract: Address.fromHex(
			"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
		),
	},
	types: {
		Person: [
			{ name: "name", type: "string" },
			{ name: "wallet", type: "address" },
		],
		Mail: [
			{ name: "from", type: "Person" },
			{ name: "to", type: "Person" },
			{ name: "contents", type: "string" },
		],
	},
	primaryType: "Mail",
	message: {
		from: {
			name: "Alice",
			wallet: Address.fromHex("0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"),
		},
		to: {
			name: "Bob",
			wallet: Address.fromHex("0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"),
		},
		contents: "Hello, Bob!",
	},
};

const complexHash = EIP712.hashTypedData(complexTypedData);
const complexSignature = EIP712.signTypedData(complexTypedData, privateKey);

const message = { content: "Same message" };

const domain1 = {
	domain: {
		name: "App 1",
		version: "1",
		chainId: 1n,
	},
	types: { Message: [{ name: "content", type: "string" }] },
	primaryType: "Message",
	message,
};

const domain2 = {
	domain: {
		name: "App 2",
		version: "1",
		chainId: 1n,
	},
	types: { Message: [{ name: "content", type: "string" }] },
	primaryType: "Message",
	message,
};

const hash1 = EIP712.hashTypedData(domain1);
const hash2 = EIP712.hashTypedData(domain2);

const types = {
	Person: [
		{ name: "name", type: "string" },
		{ name: "age", type: "uint256" },
		{ name: "wallet", type: "address" },
	],
};

const typeEncoding = EIP712.encodeType("Person", types);

const typeHash = EIP712.hashType("Person", types);

const arrayTypedData = {
	domain: {
		name: "Array Example",
		version: "1",
		chainId: 1n,
	},
	types: {
		Numbers: [{ name: "values", type: "uint256[]" }],
	},
	primaryType: "Numbers",
	message: {
		values: [1n, 2n, 3n, 4n, 5n],
	},
};

const arrayHash = EIP712.hashTypedData(arrayTypedData);

const allTypesData = {
	domain: {
		name: "All Types",
		version: "1",
		chainId: 1n,
	},
	types: {
		AllTypes: [
			{ name: "uintValue", type: "uint256" },
			{ name: "intValue", type: "int256" },
			{ name: "addressValue", type: "address" },
			{ name: "boolValue", type: "bool" },
			{ name: "bytesValue", type: "bytes" },
			{ name: "bytes32Value", type: "bytes32" },
			{ name: "stringValue", type: "string" },
		],
	},
	primaryType: "AllTypes",
	message: {
		uintValue: 42n,
		intValue: -100n,
		addressValue: Address.fromHex("0x1234567890123456789012345678901234567890"),
		boolValue: true,
		bytesValue: new Uint8Array([0x01, 0x02, 0x03]),
		bytes32Value: new Uint8Array(32).fill(0xab),
		stringValue: "Hello",
	},
};

const allTypesHash = EIP712.hashTypedData(allTypesData);

const sig1 = EIP712.signTypedData(simpleTypedData, privateKey);
const sig2 = EIP712.signTypedData(simpleTypedData, privateKey);
const sig3 = EIP712.signTypedData(simpleTypedData, privateKey);

const allMatch =
	Hex.fromBytes(sig1.r) === Hex.fromBytes(sig2.r) &&
	Hex.fromBytes(sig2.r) === Hex.fromBytes(sig3.r);
