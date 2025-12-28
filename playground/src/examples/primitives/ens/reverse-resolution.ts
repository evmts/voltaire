import { Ens, Hex } from "voltaire";
const addresses = [
	"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	"0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	"0x5aAed5930B9EbCd462DDbaeFA21DA7F3F30FBD00",
];

for (const addr of addresses) {
	const normalized = addr.toLowerCase();
	const withoutPrefix = normalized.slice(2); // Remove "0x"
	const reverseName = `${withoutPrefix}.addr.reverse`;
}
const exampleAddresses = [
	"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	"0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
];

for (const addr of exampleAddresses) {
	const normalized = addr.toLowerCase();
	const withoutPrefix = normalized.slice(2);
	const reverseName = `${withoutPrefix}.addr.reverse`;
	const normalizedReverse = Ens.normalize(reverseName);
	const hash = Ens.namehash(normalizedReverse);
}
const hierarchyExample = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
const hierarchyNormalized = hierarchyExample.toLowerCase();
const hierarchyWithoutPrefix = hierarchyNormalized.slice(2);

const hierarchy = [
	"reverse",
	"addr.reverse",
	`${hierarchyWithoutPrefix}.addr.reverse`,
];
for (const name of hierarchy) {
	const normalizedName = Ens.normalize(name);
	const hash = Ens.namehash(normalizedName);
	const depth = name.split(".").length - 1;
	const indent = "  ".repeat(depth);
}
const systemDomains = [
	{ name: "reverse", desc: "Root of reverse resolution" },
	{ name: "addr.reverse", desc: "Address reverse resolution namespace" },
];

for (const { name, desc } of systemDomains) {
	const normalized = Ens.normalize(name);
	const hash = Ens.namehash(normalized);
}
const multipleAddresses = [
	"0x0000000000000000000000000000000000000000",
	"0x0000000000000000000000000000000000000001",
	"0xffffffffffffffffffffffffffffffffffffffff",
];

for (const addr of multipleAddresses) {
	const normalized = addr.toLowerCase();
	const withoutPrefix = normalized.slice(2);
	const reverseName = `${withoutPrefix}.addr.reverse`;
	const hash = Ens.namehash(Ens.normalize(reverseName));
}
const testAddr = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

// Uppercase hex
const upperHex = testAddr.toUpperCase();
const upperReverse = `${upperHex.slice(2)}.addr.reverse`;
const upperNormalized = Ens.normalize(upperReverse.toLowerCase()); // Must lowercase address part
const upperHash = Ens.namehash(upperNormalized);

// Lowercase hex
const lowerHex = testAddr.toLowerCase();
const lowerReverse = `${lowerHex.slice(2)}.addr.reverse`;
const lowerNormalized = Ens.normalize(lowerReverse);
const lowerHash = Ens.namehash(lowerNormalized);
