import { Address, EIP712, Hex } from "voltaire";
// EIP-712: Nested struct types

// Define nested type hierarchy
const types = {
	Person: [
		{ name: "name", type: "string" },
		{ name: "wallet", type: "address" },
	],
	Mail: [
		{ name: "from", type: "Person" },
		{ name: "to", type: "Person" },
		{ name: "subject", type: "string" },
		{ name: "contents", type: "string" },
	],
};

// Message with nested structs
const message = {
	from: {
		name: "Alice",
		wallet: Address.from("0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"),
	},
	to: {
		name: "Bob",
		wallet: Address.from("0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"),
	},
	subject: "Meeting Tomorrow",
	contents: "Let's meet at 3pm!",
};

// Type encoding includes all nested types alphabetically
const mailEncoding = EIP712.encodeType("Mail", types);

// Hash individual structs
const fromHash = EIP712.hashStruct("Person", message.from, types);
const toHash = EIP712.hashStruct("Person", message.to, types);

// Hash complete mail struct
const mailHash = EIP712.hashStruct("Mail", message, types);

// Complete typed data
const typedData = {
	domain: {
		name: "Ether Mail",
		version: "1",
		chainId: 1n,
	},
	types,
	primaryType: "Mail",
	message,
};

const finalHash = EIP712.hashTypedData(typedData);
