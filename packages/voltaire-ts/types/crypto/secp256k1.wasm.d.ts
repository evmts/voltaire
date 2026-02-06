/**
 * WASM implementation of secp256k1/ECDSA operations
 *
 * Provides the same interface as the Noble-based implementation,
 * using WebAssembly for cryptographic operations.
 */
import type { HashType } from "../primitives/Hash/index.js";
export declare namespace Secp256k1Wasm {
    type Signature = {
        r: Uint8Array;
        s: Uint8Array;
        v: number;
    };
    type PublicKey = Uint8Array;
    type PrivateKey = Uint8Array;
    const CURVE_ORDER = 115792089237316195423570985008687907852837564279074904382605163141518161494337n;
    const PRIVATE_KEY_SIZE = 32;
    const PUBLIC_KEY_SIZE = 64;
    const SIGNATURE_COMPONENT_SIZE = 32;
    function sign(messageHash: HashType, privateKey: PrivateKey): Signature;
    function verify(signature: Signature, messageHash: HashType, publicKey: PublicKey): boolean;
    function recoverPublicKey(signature: Signature, messageHash: HashType): PublicKey;
    function derivePublicKey(privateKey: PrivateKey): PublicKey;
    function isValidSignature(signature: Signature): boolean;
    function isValidPublicKey(publicKey: PublicKey): boolean;
    function isValidPrivateKey(privateKey: PrivateKey): boolean;
    namespace Signature {
        function toCompact(sig: Secp256k1Wasm.Signature): Uint8Array;
        function toBytes(sig: Secp256k1Wasm.Signature): Uint8Array;
        function fromCompact(compact: Uint8Array, v: number): Secp256k1Wasm.Signature;
        function fromBytes(bytes: Uint8Array): Secp256k1Wasm.Signature;
    }
}
export default Secp256k1Wasm;
//# sourceMappingURL=secp256k1.wasm.d.ts.map