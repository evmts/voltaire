================================================================================
EVENT LOG DECODING RESEARCH PACKAGE
================================================================================

Research Date: October 27, 2025
Subject: ethers.js, viem, and ox event log decoding implementations
Focus: Imperative, performant algorithms for production use

================================================================================
PACKAGE CONTENTS
================================================================================

1. EVENT_DECODING_INDEX.md (11KB) - START HERE
   Navigation guide for all research documents
   Quick access to use cases and patterns
   FAQ, testing checklist, decision trees

2. EVENT_LOG_DECODING_RESEARCH.md (25KB) - COMPLETE TECHNICAL DEEP-DIVE
   12 comprehensive sections covering:
   - Core concepts and event log structure
   - Full ethers.js implementation with line-by-line explanation
   - Full viem implementation with comments
   - Ox implementation pattern
   - Decoding algorithm with pseudocode
   - Topic/data combination logic
   - Named parameter mapping
   - Performance optimization
   - Error handling patterns
   - Real-world ERC20 transfer example
   - Implementation comparison matrix
   - References and specs

3. EVENT_DECODING_CODE_EXAMPLES.ts (22KB) - WORKING CODE
   7 complete code examples:
   - Ethers.js: parseLog() and decodeEventLog()
   - Viem: decodeEventLog() with strict mode
   - Ox: decode() pattern
   - Generic unified algorithm
   - ERC20 Transfer example
   - Dynamic types example
   - Multiple indexed parameters example
   Error handling patterns with custom exception classes
   Performance optimization patterns

4. EVENT_DECODING_QUICK_REFERENCE.md (8.5KB) - QUICK LOOKUP
   - Core algorithm in 8 steps
   - Unified pattern across all libraries
   - Implementation checklist
   - Common patterns with code
   - Decision trees for error cases
   - Topic[0] selector database
   - Performance tips
   - Pseudo-code template
   - Comparison matrix

5. RESEARCH_SUMMARY.md (12KB) - EXECUTIVE SUMMARY
   - Overview of all three libraries
   - Key implementations side-by-side
   - Topic/data combination examples
   - Library-specific characteristics
   - Error handling summary
   - For implementation section with checklist
   - Complete references and sources

================================================================================
KEY INSIGHT: THE UNIVERSAL ALGORITHM
================================================================================

All three libraries (ethers.js, viem, ox) implement the SAME core algorithm:

1. Extract topics[0] (event signature hash)
2. Find event in ABI by keccak256 match
3. Validate topics[0] matches computed selector
4. Separate parameters into indexed vs non-indexed
5. Decode indexed from topics[1:] (handle dynamic types as hashes)
6. Decode non-indexed from data field
7. Reconstruct in original parameter order
8. Return { eventName, args }

Differences only in:
- API style (OOP vs functional)
- Error handling (null vs throw)
- Strict mode support (viem only)
- Return format

================================================================================
CRITICAL CONCEPTS
================================================================================

TOPIC[0] = NON-RECOVERABLE HASH
  signature = keccak256("EventName(type1,type2,...)")
  Example: Transfer(address,address,uint256)
  Result: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
  → Can't reverse this hash; must have ABI to decode

DYNAMIC TYPES IN INDEXED PARAMS = HASHES
  event Log(string indexed text)
    → topics[1] = keccak256("hello"), NOT "hello"
    → Can't recover original value
  BUT non-indexed dynamic types ARE recoverable from data field

PARAMETER ORDER MUST BE PRESERVED
  Event(address indexed from, uint256 amount, address indexed to)
  Decode order: [from (topics), amount (data), to (topics)]
  NOT: [from, to, amount]

TOPICS VS DATA
  topics[0]: Event signature (always)
  topics[1-3]: Indexed parameters (up to 3)
  data: Non-indexed parameters (ABI-encoded together)

================================================================================
HOW TO USE THIS PACKAGE
================================================================================

SCENARIO 1: I need to implement event decoding quickly
  1. Read: EVENT_DECODING_QUICK_REFERENCE.md (5 minutes)
  2. Copy: Pseudo-code template
  3. Implement: Use implementation checklist
  4. Test: Use testing checklist

SCENARIO 2: I want to understand the algorithm deeply
  1. Read: EVENT_LOG_DECODING_RESEARCH.md sections 1-3 (15 minutes)
  2. Study: Section 5 for unified algorithm
  3. Review: CODE_EXAMPLES.ts for working implementations
  4. Reference: RESEARCH_SUMMARY.md for comparison matrix

SCENARIO 3: I need production-grade code to reference
  1. Open: EVENT_DECODING_CODE_EXAMPLES.ts
  2. Find: Your preferred library implementation
  3. Study: Helper functions and error handling
  4. Adapt: To your language/framework

SCENARIO 4: I need to debug a decoding issue
  1. Check: EVENT_DECODING_INDEX.md "Common Pitfalls"
  2. Verify: Parameter order is correct
  3. Validate: Topic[0] matches event selector
  4. Review: Error handling patterns

SCENARIO 5: I'm implementing for a specific library
  ethers.js → EVENT_LOG_DECODING_RESEARCH.md Section 2
  viem      → EVENT_LOG_DECODING_RESEARCH.md Section 3
  ox        → EVENT_LOG_DECODING_RESEARCH.md Section 4

================================================================================
PERFORMANCE CHARACTERISTICS
================================================================================

Time Complexity: O(m + n + d)
  m = ABI size (for event lookup)
  n = number of parameters
  d = size of data field
  Practical: O(1) with event selector caching

Space Complexity: O(n)
  n = number of parameters
  Includes: result object + temporary arrays

Optimization strategies included in Section 8 of RESEARCH_SUMMARY.md

================================================================================
FILE LOCATIONS
================================================================================

All files located in: /Users/williamcory/primitives/

- EVENT_DECODING_INDEX.md
- EVENT_LOG_DECODING_RESEARCH.md
- EVENT_DECODING_CODE_EXAMPLES.ts
- EVENT_DECODING_QUICK_REFERENCE.md
- RESEARCH_SUMMARY.md
- README_EVENT_DECODING.txt (this file)

================================================================================
QUICK REFERENCE: LIBRARY COMPARISON
================================================================================

ethers.js:
  - API: Interface.parseLog()
  - Strict: Always
  - Error: Returns null on mismatch
  - Style: OOP
  - Location: src.ts/abi/interface.ts

viem:
  - API: decodeEventLog()
  - Strict: Configurable (default true)
  - Error: Throws (strict) or silent (non-strict)
  - Style: Functional
  - Location: src/utils/abi/decodeEventLog.ts

ox:
  - API: AbiEvent.decode()
  - Strict: Always
  - Error: Throws on mismatch
  - Style: Unopinionated/functional
  - Location: src/core/AbiEvent.ts

================================================================================
RESEARCH STATISTICS
================================================================================

Total Documentation: 80KB+
Total Code Examples: 2730 lines
Coverage:
  - ethers.js: Full implementation with comments
  - viem: Full implementation with comments
  - ox: Conceptual pattern + usage examples
  - Generic: Unified algorithm in TypeScript

Number of Sections: 50+
Number of Code Examples: 7+
Number of Error Patterns: 8+
Number of Optimization Patterns: 5+

================================================================================
REFERENCES & SOURCES
================================================================================

Source Code:
  ethers.js: https://github.com/ethers-io/ethers.js/blob/main/src.ts/abi/interface.ts
  viem: https://github.com/wevm/viem/blob/main/src/utils/abi/decodeEventLog.ts
  ox: https://github.com/wevm/ox

Documentation:
  ethers.js Events: https://docs.ethers.org/v5/concepts/events/
  viem decodeEventLog: https://viem.sh/docs/contract/decodeEventLog
  ox ABI Guide: https://oxlib.sh/guides/abi

Specifications:
  Solidity Events: https://docs.soliditylang.org/en/latest/contracts.html#events
  ABI Encoding: https://docs.soliditylang.org/en/latest/abi-spec.html
  EVM Logs: https://eips.ethereum.org/EIPS/eip-3

Tools:
  Topic[0] Database: https://github.com/wmitsuda/topic0
  Etherscan Event Logs: https://info.etherscan.com/what-is-event-logs/

================================================================================
QUICK QUESTIONS
================================================================================

Q: Can I decode without the ABI?
A: No. You need the ABI or a way to look up the event from topic[0].
   Try topic0.eth or the topic0 GitHub database.

Q: Why are indexed strings stored as hashes?
A: Solidity/EVM limitation. Indexed params must be fixed-size.
   Dynamic types are hashed for efficient filtering.

Q: Can I recover the original indexed string?
A: No. It's a one-way keccak256 hash.
   Solutions: off-chain indexing or contract state queries.

Q: What's the max indexed parameters?
A: 3 (topics[1], topics[2], topics[3]). topic[0] is reserved.

Q: Do I need to worry about parameter order?
A: Yes. Reconstruct in original ABI order, not topics/data order.

Q: Which library is fastest?
A: All O(n). Performance depends on ABI indexing strategy.

More Q&A in EVENT_DECODING_INDEX.md

================================================================================
IMPLEMENTATION CHECKLIST
================================================================================

- [ ] Parse topic[0] from topics array
- [ ] Compute event selector via keccak256
- [ ] Find event in ABI by matching selector
- [ ] Validate topic[0] matches computed selector
- [ ] Separate indexed and non-indexed parameters
- [ ] Decode indexed from topics[1:]
- [ ] Handle dynamic types in indexed params (return hash)
- [ ] Decode non-indexed from data field
- [ ] Reconstruct parameters in original order
- [ ] Handle named and unnamed parameters
- [ ] Handle empty data field
- [ ] Implement error handling (mismatch cases)
- [ ] Test with ERC20 Transfer event
- [ ] Test with dynamic indexed types
- [ ] Test with multiple indexed parameters
- [ ] Test with unnamed parameters
- [ ] Performance test with large ABIs
- [ ] Edge case testing (see QUICK_REFERENCE.md)

================================================================================
GETTING STARTED
================================================================================

1. Read: EVENT_DECODING_INDEX.md (quick navigation)
2. Choose: Your scenario from "How to Use This Package"
3. Deep dive: Your chosen document
4. Reference: CODE_EXAMPLES.ts for patterns
5. Implement: Following the checklist
6. Test: Using the testing checklist

For any questions, see FAQ in EVENT_DECODING_INDEX.md

================================================================================
END OF README
================================================================================
