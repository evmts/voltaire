import { Bytes, Bytes32, TransactionHash } from "@tevm/voltaire";
try {
	const valid = TransactionHash(
		"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
	);
} catch (error) {}
try {
	const valid = TransactionHash.fromHex(
		"88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
	);
} catch (error) {}
try {
	TransactionHash.fromHex("0x1234567890abcdef");
} catch (error) {}
try {
	TransactionHash.fromHex(
		"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b00",
	);
} catch (error) {}
try {
	TransactionHash.fromHex(
		"0xgggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg",
	);
} catch (error) {}
try {
	const mixed = TransactionHash.fromHex(
		"0x88DF016429689c079F3B2f6aD39FA052532C56795b733DA78A91EBE6A713944B",
	);
} catch (error) {}
try {
	const valid = TransactionHash.fromBytes(Bytes32.zero().fill(0xab));
} catch (error) {}
try {
	TransactionHash.fromBytes(Bytes.zero(31));
} catch (error) {}
try {
	TransactionHash.fromBytes(Bytes.zero(33));
} catch (error) {}
try {
	TransactionHash(12345 as any);
} catch (error) {}
try {
	TransactionHash({ hash: "0x1234" } as any);
} catch (error) {}
