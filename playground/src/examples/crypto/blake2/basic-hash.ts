import { Blake2, Hex } from "voltaire";
// Hash string data with Blake2b (default 64-byte output)
const message = "Hello, Ethereum!";
const hash = Blake2.hashString(message);

// Hash empty string
const emptyHash = Blake2.hashString("");

// Hash with default constructor
const constructorHash = Blake2.hash("Hello, Ethereum!");
