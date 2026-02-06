export type { PrivateKeyType, PrivateKeyType as BrandedPrivateKey, } from "./PrivateKeyType.js";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { Sign } from "./sign.js";
import { toAddress as _toAddress } from "./toAddress.js";
import { toHex as _toHex } from "./toHex.js";
import { toPublicKey as _toPublicKey } from "./toPublicKey.js";
export { from, fromBytes };
export { Sign };
declare const _sign: (privateKey: import("./PrivateKeyType.js").PrivateKeyType, hash: import("../Hash/HashType.js").HashType) => import("../../crypto/Secp256k1/SignatureType.js").Secp256k1SignatureType;
export declare function toHex(privateKey: string): string;
export declare function toPublicKey(privateKey: string): import("../PublicKey/PublicKeyType.js").PublicKeyType;
export declare function toAddress(privateKey: string): import("../Address/AddressType.js").AddressType;
export declare function sign(privateKey: string, hash: import("../Hash/HashType.js").HashType): import("../../crypto/Secp256k1/SignatureType.js").Secp256k1SignatureType;
export { _toHex, _toPublicKey, _toAddress, _sign };
export declare const PrivateKey: {
    from: typeof from;
    fromBytes: typeof fromBytes;
    toHex: typeof toHex;
    toPublicKey: typeof toPublicKey;
    toAddress: typeof toAddress;
    sign: typeof sign;
};
export default PrivateKey;
//# sourceMappingURL=index.d.ts.map