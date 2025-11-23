// EIP-712: Nested struct types
import * as EIP712 from "../../../crypto/EIP712/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

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
console.log("Mail type encoding:", mailEncoding);

// Hash individual structs
const fromHash = EIP712.hashStruct("Person", message.from, types);
const toHash = EIP712.hashStruct("Person", message.to, types);
console.log(
	"From struct hash:",
	Hex.fromBytes(fromHash).toString().slice(0, 20) + "...",
);
console.log(
	"To struct hash:",
	Hex.fromBytes(toHash).toString().slice(0, 20) + "...",
);

// Hash complete mail struct
const mailHash = EIP712.hashStruct("Mail", message, types);
console.log(
	"Mail struct hash:",
	Hex.fromBytes(mailHash).toString().slice(0, 20) + "...",
);

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
console.log("Final typed data hash:", Hex.fromBytes(finalHash).toString());
