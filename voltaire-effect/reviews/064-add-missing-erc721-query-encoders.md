# Add Missing ERC721 Query Function Encoders

## Problem

ERC721 module is missing encoders for required query functions.

**Location**: `src/standards/ERC721.ts`

Missing:
- `encodeBalanceOf(owner)`
- `encodeGetApproved(tokenId)`
- `encodeIsApprovedForAll(owner, operator)`
- `encodeSafeTransferFromWithData(from, to, tokenId, data)`

## Why This Matters

- These are required ERC-721 functions
- Users must manually encode common queries
- Incomplete standard implementation

## Solution

Add missing encoders:

```typescript
/**
 * Encodes a call to `balanceOf(address owner)`.
 * @param owner - Address to query balance of
 * @returns Encoded calldata
 */
export const encodeBalanceOf = (owner: Address): Hex =>
  Abi.encodeFunction(ERC721_ABI, "balanceOf", [owner]);

/**
 * Encodes a call to `getApproved(uint256 tokenId)`.
 * @param tokenId - Token ID to query approval for
 * @returns Encoded calldata
 */
export const encodeGetApproved = (tokenId: bigint): Hex =>
  Abi.encodeFunction(ERC721_ABI, "getApproved", [tokenId]);

/**
 * Encodes a call to `isApprovedForAll(address owner, address operator)`.
 * @param owner - Token owner address
 * @param operator - Operator address to check
 * @returns Encoded calldata
 */
export const encodeIsApprovedForAll = (owner: Address, operator: Address): Hex =>
  Abi.encodeFunction(ERC721_ABI, "isApprovedForAll", [owner, operator]);

/**
 * Encodes a call to `safeTransferFrom(address from, address to, uint256 tokenId, bytes data)`.
 * @param from - Current owner
 * @param to - Recipient
 * @param tokenId - Token ID
 * @param data - Additional data for onERC721Received
 * @returns Encoded calldata
 */
export const encodeSafeTransferFromWithData = (
  from: Address,
  to: Address,
  tokenId: bigint,
  data: Hex,
): Hex =>
  Abi.encodeFunction(ERC721_ABI, "safeTransferFrom", [from, to, tokenId, data]);
```

## Acceptance Criteria

- [ ] Add `encodeBalanceOf`
- [ ] Add `encodeGetApproved`
- [ ] Add `encodeIsApprovedForAll`
- [ ] Add `encodeSafeTransferFromWithData` (4-arg overload)
- [ ] Add corresponding result decoders
- [ ] Add tests
- [ ] Export from index

## Priority

**Low** - API completeness
