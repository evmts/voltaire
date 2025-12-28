import { Bytecode } from "voltaire";
// Example: Solidity metadata handling

// Solidity compiler appends metadata to contract bytecode
// Format: 0xa2 0x64 'i' 'p' 'f' 's' 0x58 0x22 <34-byte-hash> ...

// Contract without metadata
const noMetadata = Bytecode.fromHex("0x6001600101");

// Contract with Solidity metadata
const withMetadata = Bytecode.fromHex(
	"0x6080604052600080fd" +
		"a264697066735822" + // metadata marker: 0xa2 'ipfs' 0x58 0x22
		"1220" + // hash header
		"00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff" + // 32-byte IPFS hash
		"64736f6c63" + // 'solc'
		"430008" + // version
		"1a0033", // padding/flags
);
const stripped = withMetadata.stripMetadata();

// Compare bytecode with/without metadata
const contract1 = Bytecode.fromHex(
	"0x6001600101a264697066735822122000112233445566778899aabbccddeeff00112233445566778899aabbccddeeff64736f6c634300081a0033",
);
const contract2 = Bytecode.fromHex(
	"0x6001600101a264697066735822122099887766554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa64736f6c634300081a0033",
);

const stripped1 = contract1.stripMetadata();
const stripped2 = contract2.stripMetadata();
const analysis = withMetadata.analyze();
const instructions = stripped.parseInstructions();
for (const inst of instructions) {
}
const hash1 = stripped1.hash();
const hash2 = stripped2.hash();
const hashesMatch = hash1.every((byte, i) => byte === hash2[i]);

// Real Solidity output example
const realSolidity = Bytecode.fromHex(
	"0x608060405234801561000f575f80fd5b506004361061003f575f3560e01c8063a413686214610043578063cfae32171461005fa26469706673582212200011223344556677",
);
