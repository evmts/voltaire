export * from "./constants.js";
/**
 * Keccak256Hash - Type-safe Keccak256 hash namespace
 *
 * Pure TypeScript Keccak256 implementation using @noble/hashes.
 * All methods return branded Keccak256Hash type.
 *
 * @example
 * ```typescript
 * import { Keccak256Hash } from './Keccak256.js';
 *
 * // Preferred: Type-safe constructors
 * const hash1 = Keccak256Hash.from("0x1234");        // Hex string
 * const hash2 = Keccak256Hash.fromString("hello");   // UTF-8 string
 * const hash3 = Keccak256Hash.from(uint8array);      // Bytes
 *
 * // Also available: legacy method names
 * const hash4 = Keccak256Hash.hash(data);
 * const hash5 = Keccak256Hash.hashString('hello');
 * const hash6 = Keccak256Hash.hashHex('0x1234');
 *
 * // Ethereum-specific methods
 * const topic = Keccak256Hash.fromTopic('Transfer(address,address,uint256)');
 * const selector = Keccak256Hash.selector('transfer(address,uint256)');
 * ```
 */
export const Keccak256Hash: typeof from & {
    from: typeof from;
    fromString: typeof hashString;
    fromHex: typeof hashHex;
    fromTopic: typeof topic;
    hash: typeof hash;
    hashString: typeof hashString;
    hashHex: typeof hashHex;
    hashMultiple: typeof hashMultiple;
    selector: typeof selector;
    topic: typeof topic;
    contractAddress: typeof contractAddress;
    create2Address: typeof create2Address;
    DIGEST_SIZE: number;
    RATE: number;
    STATE_SIZE: number;
};
/**
 * @deprecated Use Keccak256Hash instead
 * Keccak256 alias maintained for backward compatibility
 */
export const Keccak256: typeof from & {
    from: typeof from;
    fromString: typeof hashString;
    fromHex: typeof hashHex;
    fromTopic: typeof topic;
    hash: typeof hash;
    hashString: typeof hashString;
    hashHex: typeof hashHex;
    hashMultiple: typeof hashMultiple;
    selector: typeof selector;
    topic: typeof topic;
    contractAddress: typeof contractAddress;
    create2Address: typeof create2Address;
    DIGEST_SIZE: number;
    RATE: number;
    STATE_SIZE: number;
};
import { from } from "./from.js";
import { hash } from "./hash.js";
import { hashString } from "./hashString.js";
import { hashHex } from "./hashHex.js";
import { hashMultiple } from "./hashMultiple.js";
import { selector } from "./selector.js";
import { topic } from "./topic.js";
import { contractAddress } from "./contractAddress.js";
import { create2Address } from "./create2Address.js";
export { from, hash, hashString, hashHex, hashMultiple, selector, topic, contractAddress, create2Address };
//# sourceMappingURL=Keccak256.d.ts.map