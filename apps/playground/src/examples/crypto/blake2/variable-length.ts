import { Blake2, Hex } from "@tevm/voltaire";
const message = "Voltaire";

// 20 bytes (address-sized, 160 bits)
const hash20 = Blake2.hash(message, 20);

// 32 bytes (SHA-256 equivalent, 256 bits)
const hash32 = Blake2.hash(message, 32);

// 48 bytes (384 bits)
const hash48 = Blake2.hash(message, 48);

// 64 bytes (default, 512 bits - maximum security)
const hash64 = Blake2.hash(message, 64);
