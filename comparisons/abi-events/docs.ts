/**
 * ABI Events & Errors Benchmarks
 *
 * This benchmark suite compares the performance of encoding and decoding
 * Ethereum event logs and custom errors across different libraries:
 * - guil (@tevm/primitives) - Currently uses viem as fallback
 * - ethers - Full support via Interface class
 * - viem - Full support via dedicated encode/decode functions
 *
 * Benchmarked Operations:
 *
 * 1. encodeEventTopics
 *    - Encodes event parameters into a topics array for log filtering
 *    - Used for creating event filters in eth_getLogs queries
 *    - Handles indexed parameters (topics) separately from non-indexed (data)
 *
 * 2. decodeEventLog
 *    - Decodes event log data and topics back to typed values
 *    - Reconstructs the original event parameters from raw log data
 *    - Critical for parsing blockchain events and transaction receipts
 *
 * 3. encodeErrorResult
 *    - Encodes custom error with parameters into revert data
 *    - Used for contract error handling and revert reasons
 *    - Follows EIP-838 custom errors specification
 *
 * 4. decodeErrorResult
 *    - Decodes custom error from revert data back to typed values
 *    - Extracts error name and parameters from failed transactions
 *    - Essential for debugging contract calls and understanding reverts
 *
 * Test Data:
 *
 * Transfer Event:
 * - Event: Transfer(address indexed from, address indexed to, uint256 value)
 * - Signature: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
 * - Test value: 100 wei transfer between two addresses
 *
 * InsufficientBalance Error:
 * - Error: InsufficientBalance(uint256 available, uint256 required)
 * - Signature: 0xcf479181
 * - Test values: available=50, required=100
 *
 * Implementation Notes:
 *
 * Guil Limitations:
 * - Event and error encoding/decoding utilities not yet implemented
 * - All benchmarks use viem as fallback
 * - Future versions may include native implementations
 *
 * Ethers Approach:
 * - Uses Interface class as central ABI management
 * - Supports human-readable ABI format (e.g., 'event Transfer(...)')
 * - Methods: encodeFilterTopics, parseLog, encodeErrorResult, parseError
 *
 * Viem Approach:
 * - Individual functions for each operation
 * - Requires typed ABI objects with 'as const' assertions
 * - Methods: encodeEventTopics, decodeEventLog, encodeErrorResult, decodeErrorResult
 *
 * Performance Considerations:
 * - Event encoding: Hashing and ABI encoding overhead
 * - Event decoding: ABI parsing and type reconstruction
 * - Error encoding: 4-byte selector + ABI encoding
 * - Error decoding: Selector matching + parameter parsing
 *
 * Usage:
 * ```bash
 * # Run all ABI events & errors benchmarks
 * bun run vitest bench comparisons/abi-events/ --run
 *
 * # Run specific benchmark
 * bun run vitest bench comparisons/abi-events/decodeEventLog.bench.ts --run
 * ```
 */

export {};
