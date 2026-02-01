import { InvalidLogFilterError } from "./errors.js";
/**
 * Create LogFilter from parameters
 *
 * @param {Partial<import('./LogFilterType.js').LogFilterType>} params - Filter parameters
 * @returns {import('./LogFilterType.js').LogFilterType}
 * @throws {InvalidLogFilterError}
 * @example
 * ```javascript
 * import * as LogFilter from './primitives/LogFilter/index.js';
 * import * as Address from './primitives/Address/index.js';
 * import * as BlockNumber from './primitives/BlockNumber/index.js';
 *
 * // Filter by address and block range
 * const filter = LogFilter.from({
 *   fromBlock: BlockNumber.from(1000000),
 *   toBlock: "latest",
 *   address: Address.from("0x...")
 * });
 *
 * // Filter by specific block hash
 * const filter2 = LogFilter.from({
 *   blockhash: Hash.from("0x..."),
 *   address: Address.from("0x...")
 * });
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: validation logic requires multiple checks
export function from(params) {
    if (typeof params !== "object" || params === null) {
        throw new InvalidLogFilterError("LogFilter params must be an object", {
            value: params,
            expected: "object",
        });
    }
    // Validate blockhash is mutually exclusive with fromBlock/toBlock
    if (params.blockhash) {
        if (params.fromBlock !== undefined || params.toBlock !== undefined) {
            throw new InvalidLogFilterError("blockhash cannot be used with fromBlock or toBlock", {
                value: params,
                expected: "either blockhash OR (fromBlock/toBlock), not both",
            });
        }
        // Validate blockhash is a 32-byte Uint8Array
        if (!(params.blockhash instanceof Uint8Array) ||
            params.blockhash.length !== 32) {
            throw new InvalidLogFilterError("blockhash must be a 32-byte Hash", {
                value: params.blockhash,
                expected: "32-byte Uint8Array",
            });
        }
    }
    // Validate fromBlock if present
    if (params.fromBlock !== undefined) {
        const validTags = ["earliest", "latest", "pending"];
        if (typeof params.fromBlock !== "bigint" &&
            !validTags.includes(params.fromBlock)) {
            throw new InvalidLogFilterError("fromBlock must be BlockNumber (bigint) or block tag", {
                value: params.fromBlock,
                expected: "bigint or 'earliest' | 'latest' | 'pending'",
            });
        }
    }
    // Validate toBlock if present
    if (params.toBlock !== undefined) {
        const validTags = ["earliest", "latest", "pending"];
        if (typeof params.toBlock !== "bigint" &&
            !validTags.includes(params.toBlock)) {
            throw new InvalidLogFilterError("toBlock must be BlockNumber (bigint) or block tag", {
                value: params.toBlock,
                expected: "bigint or 'earliest' | 'latest' | 'pending'",
            });
        }
    }
    // Validate address if present
    if (params.address !== undefined) {
        if (Array.isArray(params.address)) {
            for (const addr of params.address) {
                if (!(addr instanceof Uint8Array) || addr.length !== 20) {
                    throw new InvalidLogFilterError("address array must contain valid Address values", {
                        value: addr,
                        expected: "Address (20-byte Uint8Array)",
                    });
                }
            }
        }
        else if (!(params.address instanceof Uint8Array) ||
            params.address.length !== 20) {
            throw new InvalidLogFilterError("address must be valid Address", {
                value: params.address,
                expected: "Address (20-byte Uint8Array) or Address[]",
            });
        }
    }
    // Validate topics if present
    if (params.topics !== undefined) {
        if (!Array.isArray(params.topics)) {
            throw new InvalidLogFilterError("topics must be an array", {
                value: params.topics,
                expected: "TopicFilter (array)",
            });
        }
        // TopicFilter validation is handled by TopicFilter.from if needed
    }
    return /** @type {import('./LogFilterType.js').LogFilterType} */ (params);
}
