/**
 * Parse enode URL into components
 *
 * @this {import('./PeerIdType.js').PeerIdType}
 * @returns {import('./PeerIdType.js').EnodeComponents} Parsed enode components
 * @throws {InvalidFormatError} If not a valid enode URL
 *
 * @example
 * ```javascript
 * import * as PeerId from './primitives/PeerId/index.js';
 * const peerId = PeerId.from("enode://pubkey@192.168.1.1:30303?discport=30301");
 * const parsed = PeerId._parse.call(peerId);
 * console.log(parsed.ip);    // "192.168.1.1"
 * console.log(parsed.port);  // 30303
 * console.log(parsed.discoveryPort); // 30301
 * ```
 */
export function parse(this: import("./PeerIdType.js").PeerIdType): import("./PeerIdType.js").EnodeComponents;
//# sourceMappingURL=parse.d.ts.map