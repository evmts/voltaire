/**
 * Creates an EIP-2612 permit signature
 *
 * @param {import('./PermitType.js').PermitType} permit - Permit message
 * @param {import('./PermitType.js').PermitDomainType} domain - EIP-712 domain
 * @param {Uint8Array} privateKey - Private key (32 bytes)
 * @returns {Uint8Array} Compact signature (64 bytes + recovery id)
 *
 * @example
 * ```typescript
 * import * as Permit from './primitives/Permit/index.js';
 * import * as Address from './primitives/Address/index.js';
 * import * as Uint256 from './primitives/Uint256/index.js';
 *
 * const permit = {
 *   owner: Address.fromHex('0x...'),
 *   spender: Address.fromHex('0x...'),
 *   value: Uint256.fromBigInt(1000000n),
 *   nonce: Uint256.fromBigInt(0n),
 *   deadline: Uint256.fromBigInt(1234567890n),
 * };
 *
 * const domain = {
 *   name: 'USD Coin',
 *   version: '2',
 *   chainId: 1,
 *   verifyingContract: Address.fromHex('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
 * };
 *
 * const signature = Permit.createPermitSignature(permit, domain, privateKey);
 * ```
 */
export function createPermitSignature(permit: import("./PermitType.js").PermitType, domain: import("./PermitType.js").PermitDomainType, privateKey: Uint8Array): Uint8Array;
//# sourceMappingURL=createPermitSignature.d.ts.map