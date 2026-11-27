/**
 * Verifies an EIP-2612 permit signature
 *
 * @param {import('./PermitType.js').PermitType} permit - Permit message
 * @param {import('../../crypto/EIP712/EIP712Type.js').Signature} signature - EIP-712 signature
 * @param {import('./PermitType.js').PermitDomainType} domain - EIP-712 domain
 * @returns {boolean} True if signature is valid
 *
 * @example
 * ```typescript
 * import * as Permit from './primitives/Permit/index.js';
 *
 * const isValid = Permit.verifyPermit(permit, signature, domain);
 * ```
 */
export function verifyPermit(permit: import("./PermitType.js").PermitType, signature: import("../../crypto/EIP712/EIP712Type.js").Signature, domain: import("./PermitType.js").PermitDomainType): boolean;
//# sourceMappingURL=verifyPermit.d.ts.map