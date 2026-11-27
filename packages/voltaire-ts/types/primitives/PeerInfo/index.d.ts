export type { PeerInfoType } from "./PeerInfoType.js";
import { from } from "./from.js";
import { hasCapability as _hasCapability } from "./hasCapability.js";
import { isInbound as _isInbound } from "./isInbound.js";
export { from };
export declare function hasCapability(peerInfo: Parameters<typeof from>[0], capability: string): boolean;
export declare function isInbound(peerInfo: Parameters<typeof from>[0]): boolean;
export { _hasCapability, _isInbound };
export declare const PeerInfo: {
    from: typeof from;
    hasCapability: typeof hasCapability;
    isInbound: typeof isInbound;
};
//# sourceMappingURL=index.d.ts.map