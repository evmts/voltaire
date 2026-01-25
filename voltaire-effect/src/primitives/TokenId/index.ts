/**
 * @module TokenId
 * @description NFT token identifier (ERC-721/ERC-1155 token ID).
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Schema` | bigint | TokenIdType |
 * | `FromHexSchema` | hex string | TokenIdType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as TokenId from 'voltaire-effect/primitives/TokenId'
 * import * as S from 'effect/Schema'
 *
 * const tokenId = S.decodeSync(TokenId.Schema)(1n)
 * const fromHex = S.decodeSync(TokenId.FromHexSchema)('0x01')
 * ```
 *
 * @since 0.1.0
 */
export { FromHexSchema, Schema, type TokenIdType } from "./BigInt.js";
