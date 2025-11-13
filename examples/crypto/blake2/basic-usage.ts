import { Blake2 } from "../../../src/crypto/Blake2/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

const data = Hex("0x0102030405");
const hash64 = Blake2.hashHex(data);
const hash32 = Blake2.hashHex(data, 32);
const message = "hello";
const messageHash = Blake2.hashString(message);
const input = "test";
const hash1 = Blake2.hashString(input, 1); // Minimal
const hash20 = Blake2.hashString(input, 20); // Address-sized
const hash48 = Blake2.hashString(input, 48); // Custom
const emptyHash = Blake2.hashString("");

// Verify against RFC 7693 test vector
const expectedEmpty =
	"0x786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce";
const testInput = "Blake2 is fast";
const testHash1 = Blake2.hashString(testInput, 32);
const testHash2 = Blake2.hashString(testInput, 32);
const testHash3 = Blake2.hashString(testInput, 32);
const original = "The quick brown fox";
const modified = "The quick brown foy"; // Changed last letter

const originalHash = Blake2.hashString(original, 32);
const modifiedHash = Blake2.hashString(modified, 32);

// Count differing bits
let differentBits = 0;
for (let i = 0; i < 32; i++) {
	const xor = originalHash[i] ^ modifiedHash[i];
	differentBits += xor.toString(2).split("1").length - 1;
}
const sampleData = Hex("0x" + "ab".repeat(100));

const checksum = Blake2.hashHex(sampleData, 16); // Fast 16-byte checksum
const addressHash = Blake2.hashHex(sampleData, 20); // Address-sized (like RIPEMD160)
const standardHash = Blake2.hashHex(sampleData, 32); // Standard 32-byte (like SHA-256)
const maxHash = Blake2.hashHex(sampleData, 64); // Maximum security
