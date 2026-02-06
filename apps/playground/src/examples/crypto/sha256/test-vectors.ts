import { Bytes, Hex, SHA256 } from "@tevm/voltaire";
// Empty input
const empty = SHA256.hash(Bytes.zero(0));
const emptyExpected =
	"0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

// "abc"
const abc = Bytes([0x61, 0x62, 0x63]);
const abcHash = SHA256.hash(abc);
const abcExpected =
	"0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

// "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"
const long = new TextEncoder().encode(
	"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
);
const longHash = SHA256.hash(long);
const longExpected =
	"0x248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1";

// One million 'a' characters (commented - would be slow in browser)
// const million = Bytes(Array(1000000).fill(0x61));
// const millionHash = SHA256.hash(million);
// const millionExpected = '0xcdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0';
// console.log('\nOne million "a":', Hex.fromBytes(millionHash));

// Single byte 0x00
const zero = Bytes([0x00]);
const zeroHash = SHA256.hash(zero);

// Two bytes 0x00 0x01
const twoBytes = Bytes([0x00, 0x01]);
const twoBytesHash = SHA256.hash(twoBytes);

// All zeros (32 bytes)
const zeros = Bytes.zero(32);
const zerosHash = SHA256.hash(zeros);

// Maximum value bytes (32 bytes of 0xff)
const maxBytes = Bytes(Array(32).fill(0xff));
const maxHash = SHA256.hash(maxBytes);
