# Add Missing ERC721 Query Function Encoders

<issue>
<metadata>priority: P3, files: [voltaire-effect/src/standards/ERC721.ts], reviews: [083-erc-standards-review.md]</metadata>

<problem>
ERC721 module is missing encoders for required query functions per ERC-721 spec:
- `balanceOf(address owner)` - Query number of NFTs owned by an address
- `getApproved(uint256 tokenId)` - Query approved address for a token
- `isApprovedForAll(address owner, address operator)` - Query operator approval
- `safeTransferFrom(address, address, uint256, bytes)` - 4-argument overload with data

These are required ERC-721 functions that users must manually encode, making the standard implementation incomplete.
</problem>

<solution>
Add Effect-wrapped encoders for all missing ERC721 query functions and the 4-argument safeTransferFrom overload, following the existing pattern that wraps `@tevm/voltaire` implementations. Add corresponding result decoders.
</solution>

<implementation>
<steps>
1. Add `encodeBalanceOf`, `encodeGetApproved`, `encodeIsApprovedForAll`, `encodeSafeTransferFromWithData` to ERC721.ts
2. Add result decoders: `decodeBalanceOfResult`, `decodeGetApprovedResult`, `decodeIsApprovedForAllResult`
3. Export from index.ts
4. Add tests for each encoder/decoder pair

```typescript
// voltaire-effect/src/standards/ERC721.ts

export const encodeBalanceOf = (
  owner: AddressType,
): Effect.Effect<string, StandardsError> =>
  Effect.try({
    try: () => ERC721Impl.encodeBalanceOf(owner),
    catch: (e) =>
      new StandardsError({
        operation: "ERC721.encodeBalanceOf",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

export const encodeGetApproved = (
  tokenId: Uint256Type,
): Effect.Effect<string, StandardsError> =>
  Effect.try({
    try: () => ERC721Impl.encodeGetApproved(tokenId),
    catch: (e) =>
      new StandardsError({
        operation: "ERC721.encodeGetApproved",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

export const encodeIsApprovedForAll = (
  owner: AddressType,
  operator: AddressType,
): Effect.Effect<string, StandardsError> =>
  Effect.try({
    try: () => ERC721Impl.encodeIsApprovedForAll(owner, operator),
    catch: (e) =>
      new StandardsError({
        operation: "ERC721.encodeIsApprovedForAll",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

export const encodeSafeTransferFromWithData = (
  from: AddressType,
  to: AddressType,
  tokenId: Uint256Type,
  data: Uint8Array,
): Effect.Effect<string, StandardsError> =>
  Effect.try({
    try: () => ERC721Impl.encodeSafeTransferFromWithData(from, to, tokenId, data),
    catch: (e) =>
      new StandardsError({
        operation: "ERC721.encodeSafeTransferFromWithData",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

export const decodeBalanceOfResult = (
  data: string,
): Effect.Effect<Uint256Type, StandardsError> =>
  Effect.try({
    try: () => ERC721Impl.decodeBalanceOfResult(data),
    catch: (e) =>
      new StandardsError({
        operation: "ERC721.decodeBalanceOfResult",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

export const decodeGetApprovedResult = (
  data: string,
): Effect.Effect<string, StandardsError> =>
  Effect.try({
    try: () => ERC721Impl.decodeGetApprovedResult(data),
    catch: (e) =>
      new StandardsError({
        operation: "ERC721.decodeGetApprovedResult",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

export const decodeIsApprovedForAllResult = (
  data: string,
): Effect.Effect<boolean, StandardsError> =>
  Effect.try({
    try: () => ERC721Impl.decodeIsApprovedForAllResult(data),
    catch: (e) =>
      new StandardsError({
        operation: "ERC721.decodeIsApprovedForAllResult",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });
```
</steps>
<new_exports>encodeBalanceOf, encodeGetApproved, encodeIsApprovedForAll, encodeSafeTransferFromWithData, decodeBalanceOfResult, decodeGetApprovedResult, decodeIsApprovedForAllResult</new_exports>
</implementation>

<tests>
<test_cases>
```typescript
// voltaire-effect/src/standards/ERC721.test.ts

import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import * as ERC721 from "./ERC721.js";
import * as Address from "../primitives/Address/index.js";
import * as Uint from "../primitives/Uint/index.js";

const TEST_OWNER = Address.from("0x1234567890123456789012345678901234567890");
const TEST_OPERATOR = Address.from("0xabcdef0123456789abcdef0123456789abcdef01");
const TEST_TOKEN_ID = Uint.from(1n, 256);

describe("ERC721 query encoders", () => {
  describe("encodeBalanceOf", () => {
    it("encodes balanceOf(address) call", async () => {
      const result = await Effect.runPromise(ERC721.encodeBalanceOf(TEST_OWNER));
      expect(result).toMatch(/^0x70a08231/); // balanceOf selector
      expect(result.length).toBe(74); // 4 bytes selector + 32 bytes address
    });
  });

  describe("encodeGetApproved", () => {
    it("encodes getApproved(uint256) call", async () => {
      const result = await Effect.runPromise(ERC721.encodeGetApproved(TEST_TOKEN_ID));
      expect(result).toMatch(/^0x081812fc/); // getApproved selector
    });

    it("encodes tokenId=0", async () => {
      const zeroToken = Uint.from(0n, 256);
      const result = await Effect.runPromise(ERC721.encodeGetApproved(zeroToken));
      expect(result).toMatch(/^0x081812fc/);
    });
  });

  describe("encodeIsApprovedForAll", () => {
    it("encodes isApprovedForAll(address,address) call", async () => {
      const result = await Effect.runPromise(
        ERC721.encodeIsApprovedForAll(TEST_OWNER, TEST_OPERATOR)
      );
      expect(result).toMatch(/^0xe985e9c5/); // isApprovedForAll selector
      expect(result.length).toBe(138); // 4 bytes selector + 64 bytes (2 addresses)
    });
  });

  describe("encodeSafeTransferFromWithData", () => {
    it("encodes 4-arg safeTransferFrom with empty data", async () => {
      const result = await Effect.runPromise(
        ERC721.encodeSafeTransferFromWithData(
          TEST_OWNER,
          TEST_OPERATOR,
          TEST_TOKEN_ID,
          new Uint8Array(0)
        )
      );
      expect(result).toMatch(/^0xb88d4fde/); // 4-arg safeTransferFrom selector
    });

    it("encodes 4-arg safeTransferFrom with callback data", async () => {
      const callbackData = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      const result = await Effect.runPromise(
        ERC721.encodeSafeTransferFromWithData(
          TEST_OWNER,
          TEST_OPERATOR,
          TEST_TOKEN_ID,
          callbackData
        )
      );
      expect(result).toMatch(/^0xb88d4fde/);
      expect(result.toLowerCase()).toContain("deadbeef");
    });
  });

  describe("decodeBalanceOfResult", () => {
    it("decodes uint256 balance", async () => {
      const encoded = "0x0000000000000000000000000000000000000000000000000000000000000005";
      const result = await Effect.runPromise(ERC721.decodeBalanceOfResult(encoded));
      expect(result).toBe(5n);
    });

    it("decodes zero balance", async () => {
      const encoded = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const result = await Effect.runPromise(ERC721.decodeBalanceOfResult(encoded));
      expect(result).toBe(0n);
    });
  });

  describe("decodeGetApprovedResult", () => {
    it("decodes approved address", async () => {
      const encoded = "0x000000000000000000000000abcdef0123456789abcdef0123456789abcdef01";
      const result = await Effect.runPromise(ERC721.decodeGetApprovedResult(encoded));
      expect(result.toLowerCase()).toBe("0xabcdef0123456789abcdef0123456789abcdef01");
    });

    it("decodes zero address (no approval)", async () => {
      const encoded = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const result = await Effect.runPromise(ERC721.decodeGetApprovedResult(encoded));
      expect(result).toBe("0x0000000000000000000000000000000000000000");
    });
  });

  describe("decodeIsApprovedForAllResult", () => {
    it("decodes true", async () => {
      const encoded = "0x0000000000000000000000000000000000000000000000000000000000000001";
      const result = await Effect.runPromise(ERC721.decodeIsApprovedForAllResult(encoded));
      expect(result).toBe(true);
    });

    it("decodes false", async () => {
      const encoded = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const result = await Effect.runPromise(ERC721.decodeIsApprovedForAllResult(encoded));
      expect(result).toBe(false);
    });
  });
});
```
</test_cases>
</tests>

<docs>
```typescript
/**
 * Encodes a call to `balanceOf(address owner)`.
 * @param owner - Address to query balance of
 * @returns Effect yielding encoded calldata
 */
export const encodeBalanceOf: (owner: AddressType) => Effect.Effect<string, StandardsError>;

/**
 * Encodes a call to `getApproved(uint256 tokenId)`.
 * @param tokenId - Token ID to query approval for
 * @returns Effect yielding encoded calldata
 */
export const encodeGetApproved: (tokenId: Uint256Type) => Effect.Effect<string, StandardsError>;

/**
 * Encodes a call to `isApprovedForAll(address owner, address operator)`.
 * @param owner - Token owner address
 * @param operator - Operator address to check
 * @returns Effect yielding encoded calldata
 */
export const encodeIsApprovedForAll: (owner: AddressType, operator: AddressType) => Effect.Effect<string, StandardsError>;

/**
 * Encodes a call to `safeTransferFrom(address from, address to, uint256 tokenId, bytes data)`.
 * The 4-argument overload includes callback data for onERC721Received.
 * @param from - Current owner
 * @param to - Recipient
 * @param tokenId - Token ID
 * @param data - Additional data for onERC721Received callback
 * @returns Effect yielding encoded calldata
 */
export const encodeSafeTransferFromWithData: (from: AddressType, to: AddressType, tokenId: Uint256Type, data: Uint8Array) => Effect.Effect<string, StandardsError>;

/**
 * Decodes the result of a `balanceOf(address)` call.
 * @param data - ABI-encoded return data
 * @returns Effect yielding the balance as bigint
 */
export const decodeBalanceOfResult: (data: string) => Effect.Effect<Uint256Type, StandardsError>;

/**
 * Decodes the result of a `getApproved(uint256)` call.
 * @param data - ABI-encoded return data
 * @returns Effect yielding the approved address (zero address if none)
 */
export const decodeGetApprovedResult: (data: string) => Effect.Effect<string, StandardsError>;

/**
 * Decodes the result of a `isApprovedForAll(address,address)` call.
 * @param data - ABI-encoded return data
 * @returns Effect yielding boolean approval status
 */
export const decodeIsApprovedForAllResult: (data: string) => Effect.Effect<boolean, StandardsError>;
```
</docs>

<api>
<new_functions>
- `encodeBalanceOf(owner: AddressType): Effect<string, StandardsError>`
- `encodeGetApproved(tokenId: Uint256Type): Effect<string, StandardsError>`
- `encodeIsApprovedForAll(owner: AddressType, operator: AddressType): Effect<string, StandardsError>`
- `encodeSafeTransferFromWithData(from: AddressType, to: AddressType, tokenId: Uint256Type, data: Uint8Array): Effect<string, StandardsError>`
- `decodeBalanceOfResult(data: string): Effect<Uint256Type, StandardsError>`
- `decodeGetApprovedResult(data: string): Effect<string, StandardsError>`
- `decodeIsApprovedForAllResult(data: string): Effect<boolean, StandardsError>`
</new_functions>
</api>

<references>
- [ERC-721 Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)
- [viem NFT actions](https://github.com/wevm/viem)
- [OpenZeppelin ERC721](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol)
</references>
</issue>
