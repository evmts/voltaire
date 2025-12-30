import { Bytes, Hex, Keccak256 } from "@tevm/voltaire";

// Keccak256 - Ethereum's primary hash function

// Hash strings (UTF-8 encoded)
const message = "Hello, Ethereum!";
const hash = Keccak256.hashString(message);
const hashHex = Hex.fromBytes(hash);
console.log("String hash:", hashHex);

// Hash raw bytes
const bytes = Bytes([0x01, 0x02, 0x03, 0x04]);
const bytesHash = Keccak256.hash(bytes);
console.log("Bytes hash:", Hex.fromBytes(bytesHash));

// Hash hex-encoded data
const hexData = "0xdeadbeef";
const hexHash = Keccak256.hashHex(hexData);
console.log("Hex hash:", Hex.fromBytes(hexHash));

// Function selector (first 4 bytes of hash)
const functionSig = "transfer(address,uint256)";
const selectorHash = Keccak256.hashString(functionSig);
const selector = Hex.fromBytes(selectorHash).slice(0, 10);
console.log("Function selector:", selector);
// Result: 0xa9059cbb

// Event topic
const eventSig = "Transfer(address,address,uint256)";
const topicHash = Keccak256.hashString(eventSig);
const topic = Hex.fromBytes(topicHash);
console.log("Event topic:", topic);

// CREATE2 contract address derivation
const deployer = Bytes(Array(20).fill(0x11));
const salt = Bytes(Array(32).fill(0x22));
const initCodeHash = Keccak256.hash(Bytes([0x60, 0x80]));
const create2Input = Bytes.concat(Bytes([0xff]), deployer, salt, initCodeHash);
const create2Hash = Keccak256.hash(create2Input);
const contractAddr = Hex.fromBytes(create2Hash.slice(12));
console.log("CREATE2 address:", contractAddr);

// Merkle tree leaf hash
const value = "leaf1";
const leafHash = Keccak256.hashString(value);
console.log("Leaf hash:", Hex.fromBytes(leafHash));
