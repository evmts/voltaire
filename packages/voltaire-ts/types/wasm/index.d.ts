/**
 * WASM entrypoint for Voltaire (`@tevm/voltaire/wasm`)
 *
 * Provides the exact same API as the main JS entrypoint (`src/index.ts`), with
 * primary crypto methods backed by Zig WebAssembly (`primitives.wasm`).
 *
 * - **Node.js / Bun**: auto-initializes synchronously on first WASM call (zero `await` boilerplate).
 * - **Browsers**: call `await initWasm()` before invoking WASM methods (calling before init
 *   throws `WasmNotInitializedError`).
 *
 * @example
 * ```typescript
 * import { initWasm, Keccak256, Secp256k1 } from '@tevm/voltaire/wasm';
 *
 * // Required in browsers; optional in Node/Bun (auto-inits synchronously)
 * await initWasm();
 *
 * const hash = Keccak256.hash(data);
 * const sig = Secp256k1.sign(hash, privateKey);
 * ```
 */
import type { Blake2Hash as Blake2HashType } from "../crypto/Blake2/Blake2HashType.js";
import { Blake2Wasm } from "../crypto/Blake2/Blake2.wasm.js";
import { Bn254Wasm } from "../crypto/bn254.wasm.js";
import type { PublicKey as Ed25519PublicKey } from "../crypto/Ed25519/PublicKey.js";
import type { SecretKey as Ed25519SecretKey } from "../crypto/Ed25519/SecretKey.js";
import type { Seed as Ed25519Seed } from "../crypto/Ed25519/Seed.js";
import type { Signature as Ed25519Signature } from "../crypto/Ed25519/Signature.js";
import { Ed25519Wasm } from "../crypto/ed25519.wasm.js";
import type { Message as Eip712Message, Signature as Eip712Signature, TypeDefinitions as Eip712TypeDefinitions, TypedData as Eip712TypedData } from "../crypto/EIP712/EIP712Type.js";
import { Eip712Wasm } from "../crypto/eip712.wasm.js";
import { eip191HashMessage, Hash as KeccakHash, keccak256 as wasmKeccak256 } from "../crypto/keccak.wasm.js";
import type { Keccak256Hash as Keccak256HashType } from "../crypto/Keccak256/Keccak256HashType.js";
import { Keccak256Wasm } from "../crypto/keccak256.wasm.js";
import { KZG as KZGJS } from "../crypto/KZG/index.js";
import type { P256PrivateKeyType } from "../crypto/P256/P256PrivateKeyType.js";
import type { P256PublicKeyType } from "../crypto/P256/P256PublicKeyType.js";
import type { P256SignatureType } from "../crypto/P256/P256SignatureType.js";
import { P256Wasm } from "../crypto/p256.wasm.js";
import type { Ripemd160Hash as Ripemd160HashType } from "../crypto/Ripemd160/Ripemd160HashType.js";
import { Ripemd160Wasm } from "../crypto/ripemd160.wasm.js";
import type { Secp256k1PublicKeyType } from "../crypto/Secp256k1/Secp256k1PublicKeyType.js";
import type { Secp256k1SignatureType } from "../crypto/Secp256k1/SignatureType.js";
import { Secp256k1Wasm } from "../crypto/secp256k1.wasm.js";
import type { SHA256Hash as SHA256HashType } from "../crypto/SHA256/SHA256HashType.js";
import { Sha256Wasm } from "../crypto/sha256.wasm.js";
import { type ParsedSignature, secp256k1PubkeyFromPrivate, secp256k1RecoverAddress, secp256k1RecoverPubkey, secp256k1ValidateSignature, signatureIsCanonical, signatureNormalize, signatureParse, signatureSerialize } from "../crypto/signature.wasm.js";
import { compressPublicKey, generatePrivateKey } from "../crypto/wallet.wasm.js";
import type { PublicKey as X25519PublicKey } from "../crypto/X25519/PublicKey.js";
import type { SecretKey as X25519SecretKey } from "../crypto/X25519/SecretKey.js";
import type { SharedSecret as X25519SharedSecret } from "../crypto/X25519/SharedSecret.js";
import { X25519Wasm } from "../crypto/x25519.wasm.js";
import { Abi as AbiJS } from "../primitives/Abi/Abi.js";
import { gasCostWasm as accessListGasCost, gasSavingsWasm as accessListGasSavings, includesAddressWasm as accessListIncludesAddress, includesStorageKeyWasm as accessListIncludesStorageKey } from "../primitives/AccessList/AccessList.wasm.js";
import { Address as AddressJS } from "../primitives/Address/index.js";
import { calculateExcessGasWasm as blobCalculateExcessGas, calculateGasPriceWasm as blobCalculateGasPrice, calculateGasWasm as blobCalculateGas, estimateBlobCountWasm as blobEstimateCount, fromDataWasm as blobFromData, isValidWasm as blobIsValid, toDataWasm as blobToData } from "../primitives/Blob/Blob.wasm.js";
import { Blob as BlobJS } from "../primitives/Blob/index.js";
import { BloomFilter as BloomFilterJS } from "../primitives/BloomFilter/index.js";
import { analyzeJumpDestinations, isBytecodeBoundary, isValidJumpDest, validate as validateBytecode } from "../primitives/Bytecode/Bytecode.wasm.js";
import { Bytecode as BytecodeJS } from "../primitives/Bytecode/index.js";
import { Bytes as BytesJS } from "../primitives/Bytes/Bytes.js";
import { Bytes32 as Bytes32JS } from "../primitives/Bytes/Bytes32/index.js";
import { Chain as ChainJS } from "../primitives/Chain/index.js";
import { blake2b as hashBlake2b, ripemd160 as hashRipemd160, sha256 as hashSha256, solidityKeccak256, soliditySha256 } from "../primitives/Hash/Hash.wasm.js";
import { type HashType } from "../primitives/Hash/index.js";
import { bytesToHex as wasmBytesToHex, hexToBytes as wasmHexToBytes } from "../primitives/Hex/Hex.wasm.js";
import { Hex as HexJS } from "../primitives/Hex/index.js";
import { Opcode as OpcodeJS } from "../primitives/Opcode/index.js";
import type { PrivateKeyType } from "../primitives/PrivateKey/PrivateKeyType.js";
import { Rlp as RlpJS } from "../primitives/Rlp/index.js";
import { encodeBytes as rlpEncodeBytes, encodeUint as rlpEncodeUint, encodeUintFromBigInt as rlpEncodeUintFromBigInt, fromHex as rlpFromHex, toHex as rlpToHex } from "../primitives/Rlp/Rlp.wasm.js";
import { Siwe as SiweJS } from "../primitives/Siwe/index.js";
import { detectTransactionType, TransactionType } from "../primitives/Transaction/Transaction.wasm.js";
import { Uint as UintJS } from "../primitives/Uint/Uint.js";
import { u256FromBigInt, u256FromHex, u256ToBigInt, u256ToHex } from "../primitives/Uint/Uint256.wasm.js";
import { isWasmLoaded, kzgFreeTrustedSetup, kzgIsInitialized, kzgLoadTrustedSetupBytes, unloadWasm, type WasmInput, WasmNotInitializedError } from "../wasm-loader/loader.js";
/**
 * Initialize the Voltaire WASM runtime asynchronously (`primitives.wasm`).
 * Required before calling WASM methods in browser environments; optional in Node/Bun.
 */
export declare function initWasm(wasmInput?: WasmInput): Promise<void>;
/**
 * Initialize the Voltaire WASM runtime synchronously (`primitives.wasm`).
 * Supported in Node.js/Bun (reads local file synchronously) or anywhere with raw bytes.
 */
export declare function initWasmSync(wasmInput?: WasmInput): void;
export { isWasmLoaded, kzgFreeTrustedSetup, kzgIsInitialized, kzgLoadTrustedSetupBytes, unloadWasm, type WasmInput, WasmNotInitializedError, };
declare function keccakHash(data: Uint8Array): Keccak256HashType;
declare function keccakHashString(str: string): Keccak256HashType;
declare function keccakHashHex(hex: string): Keccak256HashType;
declare function keccakFrom(input: Uint8Array | string): Keccak256HashType;
declare function keccakHashMultiple(chunks: readonly Uint8Array[]): Keccak256HashType;
declare function keccakSelector(signature: string): Uint8Array;
declare function keccakTopic(signature: string): Keccak256HashType;
declare function keccakContractAddress(sender: Uint8Array, nonce: bigint): Uint8Array;
declare function keccakCreate2Address(sender: Uint8Array, salt: Uint8Array, initCodeHash: Uint8Array): Uint8Array;
/**
 * Keccak256 backed by Zig WASM (`primitives.wasm`).
 */
export declare const Keccak256: typeof keccakFrom & {
    from: typeof keccakFrom;
    fromString: typeof keccakHashString;
    fromHex: typeof keccakHashHex;
    fromTopic: typeof keccakTopic;
    hash: typeof keccakHash;
    hashString: typeof keccakHashString;
    hashHex: typeof keccakHashHex;
    hashMultiple: typeof keccakHashMultiple;
    selector: typeof keccakSelector;
    topic: typeof keccakTopic;
    contractAddress: typeof keccakContractAddress;
    create2Address: typeof keccakCreate2Address;
    DIGEST_SIZE: number;
    RATE: number;
    STATE_SIZE: number;
    _wasm: {
        hash: typeof import("../crypto/keccak256.wasm.js").hash;
        hashString: typeof import("../crypto/keccak256.wasm.js").hashString;
        hashHex: typeof import("../crypto/keccak256.wasm.js").hashHex;
        hashMultiple: typeof import("../crypto/keccak256.wasm.js").hashMultiple;
        selector: typeof import("../crypto/keccak256.wasm.js").selector;
        topic: typeof import("../crypto/keccak256.wasm.js").topic;
        contractAddress: typeof import("../crypto/keccak256.wasm.js").contractAddress;
        create2Address: typeof import("../crypto/keccak256.wasm.js").create2Address;
        init: typeof import("../crypto/keccak256.wasm.js").init;
        initSync: typeof import("../crypto/keccak256.wasm.js").initSync;
        isReady: typeof import("../crypto/keccak256.wasm.js").isReady;
        reset: typeof import("../crypto/keccak256.wasm.js").reset;
        DIGEST_SIZE: number;
        RATE: number;
        STATE_SIZE: number;
    };
};
declare function sha256Hash(data: Uint8Array): SHA256HashType;
declare function sha256HashString(str: string): SHA256HashType;
declare function sha256HashHex(hex: string): SHA256HashType;
declare function sha256From(input: Uint8Array | string): SHA256HashType;
declare function sha256Create(): {
    update: (data: Uint8Array) => void;
    digest: () => Uint8Array;
};
/**
 * SHA256 backed by Zig WASM (`primitives.wasm`).
 */
export declare const SHA256: typeof sha256From & {
    from: typeof sha256From;
    fromString: typeof sha256HashString;
    fromHex: typeof sha256HashHex;
    hash: typeof sha256Hash;
    hashString: typeof sha256HashString;
    hashHex: typeof sha256HashHex;
    toHex: typeof import("../crypto/SHA256/toHex.js").toHex;
    create: typeof sha256Create;
    OUTPUT_SIZE: number;
    BLOCK_SIZE: number;
    _wasm: typeof Sha256Wasm;
};
declare function blake2Hash(data: Uint8Array | string, outputLength?: number): Blake2HashType;
declare function blake2HashString(str: string, outputLength?: number): Blake2HashType;
declare function blake2From(input: Uint8Array | string, outputLength?: number): Blake2HashType;
/**
 * Blake2b backed by Zig WASM (`primitives.wasm`).
 */
export declare const Blake2: typeof blake2From & {
    from: typeof blake2From;
    fromString: typeof blake2HashString;
    hash: typeof blake2Hash;
    hashString: typeof blake2HashString;
    SIZE: number;
    _wasm: typeof Blake2Wasm;
};
declare function ripemd160Hash(data: Uint8Array | string): Ripemd160HashType;
declare function ripemd160HashString(str: string): Ripemd160HashType;
declare function ripemd160HashHex(hex: string): Ripemd160HashType;
declare function ripemd160From(input: Uint8Array | string): Ripemd160HashType;
/**
 * Ripemd160 backed by Zig WASM (`primitives.wasm`).
 */
export declare const Ripemd160: typeof ripemd160From & {
    from: typeof ripemd160From;
    fromString: typeof ripemd160HashString;
    fromHex: typeof ripemd160HashHex;
    hash: typeof ripemd160Hash;
    hashString: typeof ripemd160HashString;
    hashHex: typeof ripemd160HashHex;
    SIZE: number;
    HEX_SIZE: number;
    _wasm: typeof Ripemd160Wasm;
};
declare function secp256k1Sign(messageHash: HashType, privateKey: PrivateKeyType, options?: {
    extraEntropy?: Uint8Array | boolean;
}): Secp256k1SignatureType;
declare function secp256k1SignHash(hash: HashType, privateKey: PrivateKeyType): Secp256k1SignatureType;
declare function secp256k1Verify(signature: Secp256k1SignatureType, messageHash: HashType, publicKey: Secp256k1PublicKeyType): boolean;
declare function secp256k1VerifyHash(signature: Secp256k1SignatureType, hash: HashType, publicKey: Secp256k1PublicKeyType): boolean;
declare function secp256k1Recover(signature: {
    r: Uint8Array;
    s: Uint8Array;
    v: number;
}, messageHash: HashType): Secp256k1PublicKeyType;
declare function secp256k1RecoverFromHash(signature: {
    r: Uint8Array;
    s: Uint8Array;
    v: number;
}, hash: HashType): Secp256k1PublicKeyType;
declare function secp256k1Derive(privateKey: PrivateKeyType): Secp256k1PublicKeyType;
declare function secp256k1IsValidSig(signature: Secp256k1SignatureType): boolean;
declare function secp256k1RandomPrivateKey(): Uint8Array;
declare function secp256k1CreateKeyPair(): {
    privateKey: PrivateKeyType;
    publicKey: Secp256k1PublicKeyType;
};
/**
 * Secp256k1 backed by Zig WASM (`primitives.wasm`).
 */
export declare const Secp256k1: {
    sign: typeof import("../crypto/Secp256k1/sign.js").sign;
    signHash: typeof import("../crypto/Secp256k1/signHash.js").signHash;
    verify: typeof import("../crypto/Secp256k1/verify.js").verify;
    verifyHash: typeof import("../crypto/Secp256k1/verifyHash.js").verifyHash;
    recoverPublicKey: typeof import("../crypto/Secp256k1/recoverPublicKey.js").recoverPublicKey;
    recoverPublicKeyFromHash: typeof import("../crypto/Secp256k1/recoverPublicKeyFromHash.js").recoverPublicKeyFromHash;
    derivePublicKey: typeof import("../crypto/Secp256k1/derivePublicKey.js").derivePublicKey;
    isValidSignature: typeof import("../crypto/Secp256k1/isValidSignature.js").isValidSignature;
    isValidPublicKey: typeof import("../crypto/Secp256k1/isValidPublicKey.js").isValidPublicKey;
    isValidPrivateKey: typeof import("../crypto/Secp256k1/isValidPrivateKey.js").isValidPrivateKey;
    randomPrivateKey: typeof import("../crypto/Secp256k1/randomPrivateKey.js").randomPrivateKey;
    createKeyPair: typeof import("../crypto/Secp256k1/createKeyPair.js").createKeyPair;
    ecdh: typeof import("../crypto/Secp256k1/ecdh.js").ecdh;
    getSharedSecret: typeof import("../crypto/Secp256k1/ecdh.js").ecdh;
    addPoints: typeof import("../crypto/Secp256k1/addPoints.js").addPoints;
    scalarMultiply: typeof import("../crypto/Secp256k1/scalarMultiply.js").scalarMultiply;
    Signature: typeof import("../crypto/Secp256k1/Signature/index.js");
    PublicKey: typeof import("../crypto/Secp256k1/PublicKey/index.js");
    PrivateKey: typeof import("../primitives/PrivateKey/index.js");
    CURVE_ORDER: bigint;
    PRIVATE_KEY_SIZE: number;
    PUBLIC_KEY_SIZE: number;
    SIGNATURE_COMPONENT_SIZE: number;
} & {
    sign: typeof secp256k1Sign;
    signHash: typeof secp256k1SignHash;
    verify: typeof secp256k1Verify;
    verifyHash: typeof secp256k1VerifyHash;
    recoverPublicKey: typeof secp256k1Recover;
    recoverPublicKeyFromHash: typeof secp256k1RecoverFromHash;
    derivePublicKey: typeof secp256k1Derive;
    isValidSignature: typeof secp256k1IsValidSig;
    randomPrivateKey: typeof secp256k1RandomPrivateKey;
    createKeyPair: typeof secp256k1CreateKeyPair;
    _wasm: typeof Secp256k1Wasm;
};
declare function ed25519Sign(message: Uint8Array, secretKey: Ed25519SecretKey): Ed25519Signature;
declare function ed25519Verify(signature: Ed25519Signature, message: Uint8Array, publicKey: Ed25519PublicKey): boolean;
declare function ed25519DerivePublicKey(secretKey: Ed25519SecretKey): Ed25519PublicKey;
declare function ed25519KeypairFromSeed(seed: Ed25519Seed): {
    secretKey: Ed25519SecretKey;
    publicKey: Ed25519PublicKey;
};
/**
 * Ed25519 backed by Zig WASM (`primitives.wasm`).
 */
export declare const Ed25519: {
    keypairFromSeed: typeof import("../crypto/Ed25519/keypairFromSeed.js").keypairFromSeed;
    sign: typeof import("../crypto/Ed25519/sign.js").sign;
    verify: typeof import("../crypto/Ed25519/verify.js").verify;
    derivePublicKey: typeof import("../crypto/Ed25519/derivePublicKey.js").derivePublicKey;
    validateSecretKey: typeof import("../crypto/Ed25519/validateSecretKey.js").validateSecretKey;
    validatePublicKey: typeof import("../crypto/Ed25519/validatePublicKey.js").validatePublicKey;
    isValidPublicKey: typeof import("../crypto/Ed25519/isValidPublicKey.js").isValidPublicKey;
    validateSeed: typeof import("../crypto/Ed25519/validateSeed.js").validateSeed;
    SECRET_KEY_SIZE: 32;
    PUBLIC_KEY_SIZE: 32;
    SIGNATURE_SIZE: 64;
    SEED_SIZE: 32;
} & {
    sign: typeof ed25519Sign;
    verify: typeof ed25519Verify;
    derivePublicKey: typeof ed25519DerivePublicKey;
    keypairFromSeed: typeof ed25519KeypairFromSeed;
    _wasm: typeof Ed25519Wasm;
};
declare function p256Sign(messageHash: HashType | SHA256HashType | Uint8Array, privateKey: P256PrivateKeyType, options?: {
    extraEntropy?: boolean | Uint8Array;
    lowS?: boolean;
}): P256SignatureType;
declare function p256Verify(signature: P256SignatureType, messageHash: HashType | SHA256HashType | Uint8Array, publicKey: P256PublicKeyType): boolean;
declare function p256DerivePublicKey(privateKey: P256PrivateKeyType): P256PublicKeyType;
declare function p256Ecdh(privateKey: P256PrivateKeyType, publicKey: P256PublicKeyType): Uint8Array;
/**
 * P256 backed by Zig WASM (`primitives.wasm`).
 */
export declare const P256: import("../crypto/P256/P256Constructor.js").P256Constructor & {
    sign: typeof p256Sign;
    verify: typeof p256Verify;
    derivePublicKey: typeof p256DerivePublicKey;
    ecdh: typeof p256Ecdh;
    _wasm: typeof P256Wasm;
};
declare function x25519DerivePublicKey(secretKey: X25519SecretKey): X25519PublicKey;
declare function x25519Scalarmult(secretKey: X25519SecretKey, publicKey: X25519PublicKey): X25519SharedSecret;
declare function x25519KeypairFromSeed(seed: Uint8Array): {
    secretKey: X25519SecretKey;
    publicKey: X25519PublicKey;
};
declare function x25519GenerateKeypair(): {
    secretKey: X25519SecretKey;
    publicKey: X25519PublicKey;
};
/**
 * X25519 backed by Zig WASM (`primitives.wasm`).
 */
export declare const X25519: {
    derivePublicKey: typeof import("../crypto/X25519/derivePublicKey.js").derivePublicKey;
    scalarmult: typeof import("../crypto/X25519/scalarmult.js").scalarmult;
    keypairFromSeed: typeof import("../crypto/X25519/keypairFromSeed.js").keypairFromSeed;
    generateSecretKey: typeof import("../crypto/X25519/generateSecretKey.js").generateSecretKey;
    generateKeypair: typeof import("../crypto/X25519/generateKeypair.js").generateKeypair;
    validateSecretKey: typeof import("../crypto/X25519/validateSecretKey.js").validateSecretKey;
    validatePublicKey: typeof import("../crypto/X25519/validatePublicKey.js").validatePublicKey;
    isValidPublicKey: typeof import("../crypto/X25519/isValidPublicKey.js").isValidPublicKey;
    isWeakPublicKey: typeof import("../crypto/X25519/isWeakPublicKey.js").isWeakPublicKey;
    SECRET_KEY_SIZE: 32;
    PUBLIC_KEY_SIZE: 32;
    SHARED_SECRET_SIZE: 32;
} & {
    derivePublicKey: typeof x25519DerivePublicKey;
    scalarmult: typeof x25519Scalarmult;
    keypairFromSeed: typeof x25519KeypairFromSeed;
    generateKeypair: typeof x25519GenerateKeypair;
    _wasm: typeof X25519Wasm;
};
/**
 * BN254 namespace (BN254 Zig exports are native-only on wasm32).
 */
export declare const BN254: {
    Fp: typeof import("../crypto/bn254/Fp/index.js");
    Fp2: typeof import("../crypto/bn254/Fp2/index.js");
    Fr: typeof import("../crypto/bn254/Fr/index.js");
    G1: typeof import("../crypto/bn254/G1/index.js");
    G2: typeof import("../crypto/bn254/G2/index.js");
    Pairing: typeof import("../crypto/bn254/Pairing/index.js");
    serializeG1: typeof import("../crypto/bn254/serializeG1.js").serializeG1;
    deserializeG1: typeof import("../crypto/bn254/deserializeG1.js").deserializeG1;
    serializeG2: typeof import("../crypto/bn254/serializeG2.js").serializeG2;
    deserializeG2: typeof import("../crypto/bn254/deserializeG2.js").deserializeG2;
} & {
    _wasm: typeof Bn254Wasm;
};
declare function eip712SignTypedData(typedData: Eip712TypedData, privateKey: string | Uint8Array): Eip712Signature;
/**
 * EIP712 backed by Zig WASM Keccak256 + Secp256k1 (`primitives.wasm`).
 */
export declare const EIP712: {
    HashDomain: typeof import("../crypto/EIP712/index.js").HashDomain;
    EncodeData: typeof import("../crypto/EIP712/encodeData.js").EncodeData;
    EncodeValue: typeof import("../crypto/EIP712/encodeValue.js").EncodeValue;
    HashStruct: typeof import("../crypto/EIP712/hashStruct.js").HashStruct;
    HashType: typeof import("../crypto/EIP712/hashType.js").HashType;
    HashTypedData: typeof import("../crypto/EIP712/hashTypedData.js").HashTypedData;
    RecoverAddress: typeof import("../crypto/EIP712/recoverAddress.js").RecoverAddress;
    SignTypedData: typeof import("../crypto/EIP712/signTypedData.js").SignTypedData;
    VerifyTypedData: typeof import("../crypto/EIP712/verifyTypedData.js").VerifyTypedData;
    Domain: {
        hash: (domain: import("../crypto/EIP712/EIP712Type.js").Domain) => import("../primitives/Hash/index.js").HashType;
    };
    encodeType: typeof import("../crypto/EIP712/encodeType.js").encodeType;
    hashType: (primaryType: string, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => import("../primitives/Hash/index.js").HashType;
    encodeValue: (type: string, value: import("../crypto/EIP712/EIP712Type.js").MessageValue, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => Uint8Array;
    encodeData: (primaryType: string, data: import("../crypto/EIP712/EIP712Type.js").Message, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => Uint8Array;
    hashStruct: (primaryType: string, data: import("../crypto/EIP712/EIP712Type.js").Message, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => import("../primitives/Hash/index.js").HashType;
    hashTypedData: (typedData: import("../crypto/EIP712/EIP712Type.js").TypedData) => import("../primitives/Hash/index.js").HashType;
    signTypedData: typeof import("../crypto/EIP712/EIP712.js").signTypedData;
    recoverAddress: (signature: import("../crypto/EIP712/EIP712Type.js").Signature, typedData: import("../crypto/EIP712/EIP712Type.js").TypedData) => import("../primitives/Address/AddressType.js").AddressType;
    verifyTypedData: (signature: import("../crypto/EIP712/EIP712Type.js").Signature, typedData: import("../crypto/EIP712/EIP712Type.js").TypedData, address: import("../primitives/Address/AddressType.js").AddressType) => boolean;
    format: typeof import("../crypto/EIP712/format.js").format;
    validate: typeof import("../crypto/EIP712/validate.js").validate;
} & {
    Domain: {
        hash: (domain: import("../crypto/EIP712/EIP712Type.js").Domain) => import("../primitives/Hash/index.js").HashType;
    };
    hashType: (primaryType: string, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => import("../primitives/Hash/index.js").HashType;
    encodeValue: (type: string, value: import("../crypto/EIP712/EIP712Type.js").MessageValue, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => Uint8Array;
    encodeData: (primaryType: string, data: import("../crypto/EIP712/EIP712Type.js").Message, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => Uint8Array;
    hashStruct: (primaryType: string, data: Eip712Message, types: Eip712TypeDefinitions) => HashType;
    hashTypedData: (typedData: import("../crypto/EIP712/EIP712Type.js").TypedData) => import("../primitives/Hash/index.js").HashType;
    signTypedData: typeof eip712SignTypedData;
    recoverAddress: (signature: import("../crypto/EIP712/EIP712Type.js").Signature, typedData: import("../crypto/EIP712/EIP712Type.js").TypedData) => import("../primitives/Address/AddressType.js").AddressType;
    verifyTypedData: (signature: import("../crypto/EIP712/EIP712Type.js").Signature, typedData: import("../crypto/EIP712/EIP712Type.js").TypedData, address: import("../primitives/Address/AddressType.js").AddressType) => boolean;
    _wasm: typeof Eip712Wasm;
};
export declare const Address: typeof AddressJS;
export declare const Hash: import("../primitives/Hash/HashConstructor.js").HashConstructor;
export declare const Hex: typeof HexJS;
export declare const Uint: typeof UintJS;
export declare const Rlp: typeof RlpJS;
export declare const Abi: typeof AbiJS;
export declare const Blob: typeof BlobJS;
export declare const AccessList: {
    from: (value: readonly import("../primitives/AccessList/AccessListType.js").Item[] | Uint8Array) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
    fromBytes: (bytes: Uint8Array) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
    is: (value: unknown) => value is import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
    isItem: (value: unknown) => value is import("../primitives/AccessList/AccessListType.js").Item;
    create: () => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
    merge: (...accessLists: import("../primitives/AccessList/AccessListType.js").BrandedAccessList[]) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
    gasCost: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => bigint;
    gasSavings: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => bigint;
    hasSavings: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => boolean;
    includesAddress: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType) => boolean;
    includesStorageKey: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType, storageKey: HashType) => boolean;
    keysFor: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType) => readonly HashType[] | undefined;
    deduplicate: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
    withAddress: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
    withStorageKey: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType, storageKey: HashType) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
    assertValid: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => void;
    toBytes: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => Uint8Array;
    addressCount: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => number;
    storageKeyCount: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => number;
    isEmpty: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => boolean;
    ADDRESS_COST: bigint;
    STORAGE_KEY_COST: bigint;
    COLD_ACCOUNT_ACCESS_COST: bigint;
    COLD_STORAGE_ACCESS_COST: bigint;
    WARM_STORAGE_ACCESS_COST: bigint;
};
export * as BlockAccessList from "../primitives/BlockAccessList/index.js";
export * as ExecutionPayloadBid from "../primitives/ExecutionPayloadBid/index.js";
export declare const Bytecode: typeof BytecodeJS;
export declare const Chain: typeof ChainJS;
export declare const Opcode: typeof OpcodeJS;
export declare const BloomFilter: typeof BloomFilterJS;
export declare const Siwe: typeof SiweJS;
export declare const Bytes: typeof BytesJS;
export declare const Bytes32: typeof Bytes32JS;
export declare const StorageKey: {
    from: (value: import("../primitives/State/StorageKeyType.js").StorageKeyLike) => import("../primitives/State/StorageKeyType.js").StorageKeyType;
    create: (address: import("../primitives/Address/AddressType.js").AddressType, slot: bigint) => import("../primitives/State/StorageKeyType.js").StorageKeyType;
    is: (value: unknown) => value is import("../primitives/State/StorageKeyType.js").StorageKeyType;
    equals: (a: import("../primitives/State/StorageKeyType.js").StorageKeyLike, b: import("../primitives/State/StorageKeyType.js").StorageKeyLike) => boolean;
    toString: (key: import("../primitives/State/StorageKeyType.js").StorageKeyLike) => string;
    fromString: (str: string) => import("../primitives/State/StorageKeyType.js").StorageKeyType | undefined;
    hashCode: (key: import("../primitives/State/StorageKeyType.js").StorageKeyLike) => number;
};
export declare const Wei: import("../primitives/Denomination/index.js").WeiConstructor;
export declare const Gwei: import("../primitives/Denomination/index.js").GweiConstructor;
export declare const Ether: import("../primitives/Denomination/index.js").EtherConstructor;
export * from "../primitives/errors/index.js";
export declare const Bls12381: {
    sign: typeof import("../crypto/Bls12381/sign.js").sign;
    signPoint: typeof import("../crypto/Bls12381/sign.js").signPoint;
    verify: typeof import("../crypto/Bls12381/verify.js").verify;
    verifyPoint: typeof import("../crypto/Bls12381/verify.js").verifyPoint;
    aggregate: typeof import("../crypto/Bls12381/aggregate.js").aggregate;
    aggregatePublicKeys: typeof import("../crypto/Bls12381/aggregate.js").aggregatePublicKeys;
    aggregateVerify: typeof import("../crypto/Bls12381/aggregateVerify.js").aggregateVerify;
    batchVerify: typeof import("../crypto/Bls12381/aggregateVerify.js").batchVerify;
    fastAggregateVerify: typeof import("../crypto/Bls12381/aggregateVerify.js").fastAggregateVerify;
    derivePublicKey: typeof import("../crypto/Bls12381/derivePublicKey.js").derivePublicKey;
    derivePublicKeyPoint: typeof import("../crypto/Bls12381/derivePublicKey.js").derivePublicKeyPoint;
    randomPrivateKey: typeof import("../crypto/Bls12381/randomPrivateKey.js").randomPrivateKey;
    isValidPrivateKey: typeof import("../crypto/Bls12381/randomPrivateKey.js").isValidPrivateKey;
    Fp: typeof import("../crypto/Bls12381/Fp/index.js");
    Fp2: typeof import("../crypto/Bls12381/Fp2/index.js");
    Fr: typeof import("../crypto/Bls12381/Fr/index.js");
    G1: typeof import("../crypto/Bls12381/G1/index.js");
    G2: typeof import("../crypto/Bls12381/G2/index.js");
    Pairing: typeof import("../crypto/Bls12381/Pairing/index.js");
};
export declare const KZG: typeof KZGJS;
export declare const ModExp: typeof import("../crypto/ModExp/compute.js").modexp & {
    modexp: typeof import("../crypto/ModExp/compute.js").modexp;
    modexpBytes: typeof import("../crypto/ModExp/modexpBytes.js").modexpBytes;
    calculateGas: typeof import("../crypto/ModExp/calculateGas.js").calculateGas;
};
export { AesGcm } from "../crypto/AesGcm/AesGcm.js";
export { Bip39 } from "../crypto/Bip39/index.js";
export { ChaCha20Poly1305 } from "../crypto/ChaCha20Poly1305/ChaCha20Poly1305.js";
export { ConstantTime } from "../crypto/ConstantTime/index.js";
export * as Keystore from "../crypto/Keystore/index.js";
declare const _wasmApi: {
    Address: typeof AddressJS;
    Hash: import("../primitives/Hash/HashConstructor.js").HashConstructor;
    Hex: typeof HexJS;
    Uint: typeof UintJS;
    Rlp: typeof RlpJS;
    Abi: typeof AbiJS;
    Blob: typeof BlobJS;
    AccessList: {
        from: (value: readonly import("../primitives/AccessList/AccessListType.js").Item[] | Uint8Array) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
        fromBytes: (bytes: Uint8Array) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
        is: (value: unknown) => value is import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
        isItem: (value: unknown) => value is import("../primitives/AccessList/AccessListType.js").Item;
        create: () => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
        merge: (...accessLists: import("../primitives/AccessList/AccessListType.js").BrandedAccessList[]) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
        gasCost: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => bigint;
        gasSavings: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => bigint;
        hasSavings: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => boolean;
        includesAddress: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType) => boolean;
        includesStorageKey: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType, storageKey: HashType) => boolean;
        keysFor: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType) => readonly HashType[] | undefined;
        deduplicate: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
        withAddress: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
        withStorageKey: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType, storageKey: HashType) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
        assertValid: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => void;
        toBytes: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => Uint8Array;
        addressCount: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => number;
        storageKeyCount: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => number;
        isEmpty: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => boolean;
        ADDRESS_COST: bigint;
        STORAGE_KEY_COST: bigint;
        COLD_ACCOUNT_ACCESS_COST: bigint;
        COLD_STORAGE_ACCESS_COST: bigint;
        WARM_STORAGE_ACCESS_COST: bigint;
    };
    Bytecode: typeof BytecodeJS;
    Chain: typeof ChainJS;
    Opcode: typeof OpcodeJS;
    BloomFilter: typeof BloomFilterJS;
    Siwe: typeof SiweJS;
    Bytes: typeof BytesJS;
    Bytes32: typeof Bytes32JS;
    StorageKey: {
        from: (value: import("../primitives/State/StorageKeyType.js").StorageKeyLike) => import("../primitives/State/StorageKeyType.js").StorageKeyType;
        create: (address: import("../primitives/Address/AddressType.js").AddressType, slot: bigint) => import("../primitives/State/StorageKeyType.js").StorageKeyType;
        is: (value: unknown) => value is import("../primitives/State/StorageKeyType.js").StorageKeyType;
        equals: (a: import("../primitives/State/StorageKeyType.js").StorageKeyLike, b: import("../primitives/State/StorageKeyType.js").StorageKeyLike) => boolean;
        toString: (key: import("../primitives/State/StorageKeyType.js").StorageKeyLike) => string;
        fromString: (str: string) => import("../primitives/State/StorageKeyType.js").StorageKeyType | undefined;
        hashCode: (key: import("../primitives/State/StorageKeyType.js").StorageKeyLike) => number;
    };
    Wei: import("../primitives/Denomination/index.js").WeiConstructor;
    Gwei: import("../primitives/Denomination/index.js").GweiConstructor;
    Ether: import("../primitives/Denomination/index.js").EtherConstructor;
    Keccak256: typeof keccakFrom & {
        from: typeof keccakFrom;
        fromString: typeof keccakHashString;
        fromHex: typeof keccakHashHex;
        fromTopic: typeof keccakTopic;
        hash: typeof keccakHash;
        hashString: typeof keccakHashString;
        hashHex: typeof keccakHashHex;
        hashMultiple: typeof keccakHashMultiple;
        selector: typeof keccakSelector;
        topic: typeof keccakTopic;
        contractAddress: typeof keccakContractAddress;
        create2Address: typeof keccakCreate2Address;
        DIGEST_SIZE: number;
        RATE: number;
        STATE_SIZE: number;
        _wasm: {
            hash: typeof import("../crypto/keccak256.wasm.js").hash;
            hashString: typeof import("../crypto/keccak256.wasm.js").hashString;
            hashHex: typeof import("../crypto/keccak256.wasm.js").hashHex;
            hashMultiple: typeof import("../crypto/keccak256.wasm.js").hashMultiple;
            selector: typeof import("../crypto/keccak256.wasm.js").selector;
            topic: typeof import("../crypto/keccak256.wasm.js").topic;
            contractAddress: typeof import("../crypto/keccak256.wasm.js").contractAddress;
            create2Address: typeof import("../crypto/keccak256.wasm.js").create2Address;
            init: typeof import("../crypto/keccak256.wasm.js").init;
            initSync: typeof import("../crypto/keccak256.wasm.js").initSync;
            isReady: typeof import("../crypto/keccak256.wasm.js").isReady;
            reset: typeof import("../crypto/keccak256.wasm.js").reset;
            DIGEST_SIZE: number;
            RATE: number;
            STATE_SIZE: number;
        };
    };
    SHA256: typeof sha256From & {
        from: typeof sha256From;
        fromString: typeof sha256HashString;
        fromHex: typeof sha256HashHex;
        hash: typeof sha256Hash;
        hashString: typeof sha256HashString;
        hashHex: typeof sha256HashHex;
        toHex: typeof import("../crypto/SHA256/toHex.js").toHex;
        create: typeof sha256Create;
        OUTPUT_SIZE: number;
        BLOCK_SIZE: number;
        _wasm: typeof Sha256Wasm;
    };
    Blake2: typeof blake2From & {
        from: typeof blake2From;
        fromString: typeof blake2HashString;
        hash: typeof blake2Hash;
        hashString: typeof blake2HashString;
        SIZE: number;
        _wasm: typeof Blake2Wasm;
    };
    Ripemd160: typeof ripemd160From & {
        from: typeof ripemd160From;
        fromString: typeof ripemd160HashString;
        fromHex: typeof ripemd160HashHex;
        hash: typeof ripemd160Hash;
        hashString: typeof ripemd160HashString;
        hashHex: typeof ripemd160HashHex;
        SIZE: number;
        HEX_SIZE: number;
        _wasm: typeof Ripemd160Wasm;
    };
    Secp256k1: {
        sign: typeof import("../crypto/Secp256k1/sign.js").sign;
        signHash: typeof import("../crypto/Secp256k1/signHash.js").signHash;
        verify: typeof import("../crypto/Secp256k1/verify.js").verify;
        verifyHash: typeof import("../crypto/Secp256k1/verifyHash.js").verifyHash;
        recoverPublicKey: typeof import("../crypto/Secp256k1/recoverPublicKey.js").recoverPublicKey;
        recoverPublicKeyFromHash: typeof import("../crypto/Secp256k1/recoverPublicKeyFromHash.js").recoverPublicKeyFromHash;
        derivePublicKey: typeof import("../crypto/Secp256k1/derivePublicKey.js").derivePublicKey;
        isValidSignature: typeof import("../crypto/Secp256k1/isValidSignature.js").isValidSignature;
        isValidPublicKey: typeof import("../crypto/Secp256k1/isValidPublicKey.js").isValidPublicKey;
        isValidPrivateKey: typeof import("../crypto/Secp256k1/isValidPrivateKey.js").isValidPrivateKey;
        randomPrivateKey: typeof import("../crypto/Secp256k1/randomPrivateKey.js").randomPrivateKey;
        createKeyPair: typeof import("../crypto/Secp256k1/createKeyPair.js").createKeyPair;
        ecdh: typeof import("../crypto/Secp256k1/ecdh.js").ecdh;
        getSharedSecret: typeof import("../crypto/Secp256k1/ecdh.js").ecdh;
        addPoints: typeof import("../crypto/Secp256k1/addPoints.js").addPoints;
        scalarMultiply: typeof import("../crypto/Secp256k1/scalarMultiply.js").scalarMultiply;
        Signature: typeof import("../crypto/Secp256k1/Signature/index.js");
        PublicKey: typeof import("../crypto/Secp256k1/PublicKey/index.js");
        PrivateKey: typeof import("../primitives/PrivateKey/index.js");
        CURVE_ORDER: bigint;
        PRIVATE_KEY_SIZE: number;
        PUBLIC_KEY_SIZE: number;
        SIGNATURE_COMPONENT_SIZE: number;
    } & {
        sign: typeof secp256k1Sign;
        signHash: typeof secp256k1SignHash;
        verify: typeof secp256k1Verify;
        verifyHash: typeof secp256k1VerifyHash;
        recoverPublicKey: typeof secp256k1Recover;
        recoverPublicKeyFromHash: typeof secp256k1RecoverFromHash;
        derivePublicKey: typeof secp256k1Derive;
        isValidSignature: typeof secp256k1IsValidSig;
        randomPrivateKey: typeof secp256k1RandomPrivateKey;
        createKeyPair: typeof secp256k1CreateKeyPair;
        _wasm: typeof Secp256k1Wasm;
    };
    Ed25519: {
        keypairFromSeed: typeof import("../crypto/Ed25519/keypairFromSeed.js").keypairFromSeed;
        sign: typeof import("../crypto/Ed25519/sign.js").sign;
        verify: typeof import("../crypto/Ed25519/verify.js").verify;
        derivePublicKey: typeof import("../crypto/Ed25519/derivePublicKey.js").derivePublicKey;
        validateSecretKey: typeof import("../crypto/Ed25519/validateSecretKey.js").validateSecretKey;
        validatePublicKey: typeof import("../crypto/Ed25519/validatePublicKey.js").validatePublicKey;
        isValidPublicKey: typeof import("../crypto/Ed25519/isValidPublicKey.js").isValidPublicKey;
        validateSeed: typeof import("../crypto/Ed25519/validateSeed.js").validateSeed;
        SECRET_KEY_SIZE: 32;
        PUBLIC_KEY_SIZE: 32;
        SIGNATURE_SIZE: 64;
        SEED_SIZE: 32;
    } & {
        sign: typeof ed25519Sign;
        verify: typeof ed25519Verify;
        derivePublicKey: typeof ed25519DerivePublicKey;
        keypairFromSeed: typeof ed25519KeypairFromSeed;
        _wasm: typeof Ed25519Wasm;
    };
    P256: import("../crypto/P256/P256Constructor.js").P256Constructor & {
        sign: typeof p256Sign;
        verify: typeof p256Verify;
        derivePublicKey: typeof p256DerivePublicKey;
        ecdh: typeof p256Ecdh;
        _wasm: typeof P256Wasm;
    };
    X25519: {
        derivePublicKey: typeof import("../crypto/X25519/derivePublicKey.js").derivePublicKey;
        scalarmult: typeof import("../crypto/X25519/scalarmult.js").scalarmult;
        keypairFromSeed: typeof import("../crypto/X25519/keypairFromSeed.js").keypairFromSeed;
        generateSecretKey: typeof import("../crypto/X25519/generateSecretKey.js").generateSecretKey;
        generateKeypair: typeof import("../crypto/X25519/generateKeypair.js").generateKeypair;
        validateSecretKey: typeof import("../crypto/X25519/validateSecretKey.js").validateSecretKey;
        validatePublicKey: typeof import("../crypto/X25519/validatePublicKey.js").validatePublicKey;
        isValidPublicKey: typeof import("../crypto/X25519/isValidPublicKey.js").isValidPublicKey;
        isWeakPublicKey: typeof import("../crypto/X25519/isWeakPublicKey.js").isWeakPublicKey;
        SECRET_KEY_SIZE: 32;
        PUBLIC_KEY_SIZE: 32;
        SHARED_SECRET_SIZE: 32;
    } & {
        derivePublicKey: typeof x25519DerivePublicKey;
        scalarmult: typeof x25519Scalarmult;
        keypairFromSeed: typeof x25519KeypairFromSeed;
        generateKeypair: typeof x25519GenerateKeypair;
        _wasm: typeof X25519Wasm;
    };
    BN254: {
        Fp: typeof import("../crypto/bn254/Fp/index.js");
        Fp2: typeof import("../crypto/bn254/Fp2/index.js");
        Fr: typeof import("../crypto/bn254/Fr/index.js");
        G1: typeof import("../crypto/bn254/G1/index.js");
        G2: typeof import("../crypto/bn254/G2/index.js");
        Pairing: typeof import("../crypto/bn254/Pairing/index.js");
        serializeG1: typeof import("../crypto/bn254/serializeG1.js").serializeG1;
        deserializeG1: typeof import("../crypto/bn254/deserializeG1.js").deserializeG1;
        serializeG2: typeof import("../crypto/bn254/serializeG2.js").serializeG2;
        deserializeG2: typeof import("../crypto/bn254/deserializeG2.js").deserializeG2;
    } & {
        _wasm: typeof Bn254Wasm;
    };
    Bls12381: {
        sign: typeof import("../crypto/Bls12381/sign.js").sign;
        signPoint: typeof import("../crypto/Bls12381/sign.js").signPoint;
        verify: typeof import("../crypto/Bls12381/verify.js").verify;
        verifyPoint: typeof import("../crypto/Bls12381/verify.js").verifyPoint;
        aggregate: typeof import("../crypto/Bls12381/aggregate.js").aggregate;
        aggregatePublicKeys: typeof import("../crypto/Bls12381/aggregate.js").aggregatePublicKeys;
        aggregateVerify: typeof import("../crypto/Bls12381/aggregateVerify.js").aggregateVerify;
        batchVerify: typeof import("../crypto/Bls12381/aggregateVerify.js").batchVerify;
        fastAggregateVerify: typeof import("../crypto/Bls12381/aggregateVerify.js").fastAggregateVerify;
        derivePublicKey: typeof import("../crypto/Bls12381/derivePublicKey.js").derivePublicKey;
        derivePublicKeyPoint: typeof import("../crypto/Bls12381/derivePublicKey.js").derivePublicKeyPoint;
        randomPrivateKey: typeof import("../crypto/Bls12381/randomPrivateKey.js").randomPrivateKey;
        isValidPrivateKey: typeof import("../crypto/Bls12381/randomPrivateKey.js").isValidPrivateKey;
        Fp: typeof import("../crypto/Bls12381/Fp/index.js");
        Fp2: typeof import("../crypto/Bls12381/Fp2/index.js");
        Fr: typeof import("../crypto/Bls12381/Fr/index.js");
        G1: typeof import("../crypto/Bls12381/G1/index.js");
        G2: typeof import("../crypto/Bls12381/G2/index.js");
        Pairing: typeof import("../crypto/Bls12381/Pairing/index.js");
    };
    KZG: typeof KZGJS;
    EIP712: {
        HashDomain: typeof import("../crypto/EIP712/index.js").HashDomain;
        EncodeData: typeof import("../crypto/EIP712/encodeData.js").EncodeData;
        EncodeValue: typeof import("../crypto/EIP712/encodeValue.js").EncodeValue;
        HashStruct: typeof import("../crypto/EIP712/hashStruct.js").HashStruct;
        HashType: typeof import("../crypto/EIP712/hashType.js").HashType;
        HashTypedData: typeof import("../crypto/EIP712/hashTypedData.js").HashTypedData;
        RecoverAddress: typeof import("../crypto/EIP712/recoverAddress.js").RecoverAddress;
        SignTypedData: typeof import("../crypto/EIP712/signTypedData.js").SignTypedData;
        VerifyTypedData: typeof import("../crypto/EIP712/verifyTypedData.js").VerifyTypedData;
        Domain: {
            hash: (domain: import("../crypto/EIP712/EIP712Type.js").Domain) => import("../primitives/Hash/index.js").HashType;
        };
        encodeType: typeof import("../crypto/EIP712/encodeType.js").encodeType;
        hashType: (primaryType: string, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => import("../primitives/Hash/index.js").HashType;
        encodeValue: (type: string, value: import("../crypto/EIP712/EIP712Type.js").MessageValue, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => Uint8Array;
        encodeData: (primaryType: string, data: import("../crypto/EIP712/EIP712Type.js").Message, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => Uint8Array;
        hashStruct: (primaryType: string, data: import("../crypto/EIP712/EIP712Type.js").Message, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => import("../primitives/Hash/index.js").HashType;
        hashTypedData: (typedData: import("../crypto/EIP712/EIP712Type.js").TypedData) => import("../primitives/Hash/index.js").HashType;
        signTypedData: typeof import("../crypto/EIP712/EIP712.js").signTypedData;
        recoverAddress: (signature: import("../crypto/EIP712/EIP712Type.js").Signature, typedData: import("../crypto/EIP712/EIP712Type.js").TypedData) => import("../primitives/Address/AddressType.js").AddressType;
        verifyTypedData: (signature: import("../crypto/EIP712/EIP712Type.js").Signature, typedData: import("../crypto/EIP712/EIP712Type.js").TypedData, address: import("../primitives/Address/AddressType.js").AddressType) => boolean;
        format: typeof import("../crypto/EIP712/format.js").format;
        validate: typeof import("../crypto/EIP712/validate.js").validate;
    } & {
        Domain: {
            hash: (domain: import("../crypto/EIP712/EIP712Type.js").Domain) => import("../primitives/Hash/index.js").HashType;
        };
        hashType: (primaryType: string, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => import("../primitives/Hash/index.js").HashType;
        encodeValue: (type: string, value: import("../crypto/EIP712/EIP712Type.js").MessageValue, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => Uint8Array;
        encodeData: (primaryType: string, data: import("../crypto/EIP712/EIP712Type.js").Message, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => Uint8Array;
        hashStruct: (primaryType: string, data: Eip712Message, types: Eip712TypeDefinitions) => HashType;
        hashTypedData: (typedData: import("../crypto/EIP712/EIP712Type.js").TypedData) => import("../primitives/Hash/index.js").HashType;
        signTypedData: typeof eip712SignTypedData;
        recoverAddress: (signature: import("../crypto/EIP712/EIP712Type.js").Signature, typedData: import("../crypto/EIP712/EIP712Type.js").TypedData) => import("../primitives/Address/AddressType.js").AddressType;
        verifyTypedData: (signature: import("../crypto/EIP712/EIP712Type.js").Signature, typedData: import("../crypto/EIP712/EIP712Type.js").TypedData, address: import("../primitives/Address/AddressType.js").AddressType) => boolean;
        _wasm: typeof Eip712Wasm;
    };
    ModExp: typeof import("../crypto/ModExp/compute.js").modexp & {
        modexp: typeof import("../crypto/ModExp/compute.js").modexp;
        modexpBytes: typeof import("../crypto/ModExp/modexpBytes.js").modexpBytes;
        calculateGas: typeof import("../crypto/ModExp/calculateGas.js").calculateGas;
    };
};
export { _wasmApi as wasmAPI };
export * as evm from "../evm/index.js";
export * as precompiles from "../evm/precompiles/precompiles.js";
export * from "../standards/index.js";
export { Blake2Wasm, Bn254Wasm, Ed25519Wasm, Eip712Wasm, Keccak256Wasm, P256Wasm, Ripemd160Wasm, Secp256k1Wasm, Sha256Wasm, X25519Wasm, };
export { accessListGasCost, accessListGasSavings, accessListIncludesAddress, accessListIncludesStorageKey, analyzeJumpDestinations, blobCalculateExcessGas, blobCalculateGas, blobCalculateGasPrice, blobEstimateCount, blobFromData, blobIsValid, blobToData, compressPublicKey, detectTransactionType, eip191HashMessage, generatePrivateKey, hashBlake2b as blake2b, hashRipemd160 as ripemd160, hashSha256 as sha256, isBytecodeBoundary, isValidJumpDest, KeccakHash, type ParsedSignature, rlpEncodeBytes, rlpEncodeUint, rlpEncodeUintFromBigInt, rlpFromHex, rlpToHex, secp256k1PubkeyFromPrivate, secp256k1RecoverAddress, secp256k1RecoverPubkey, secp256k1ValidateSignature, signatureIsCanonical, signatureNormalize, signatureParse, signatureSerialize, solidityKeccak256, soliditySha256, TransactionType, u256FromBigInt, u256FromHex, u256ToBigInt, u256ToHex, validateBytecode, wasmBytesToHex as bytesToHex, wasmHexToBytes as hexToBytes, wasmKeccak256 as keccak256, };
export * as block from "../block/index.js";
export * as contract from "../contract/index.js";
export * as stream from "../stream/index.js";
export * as transaction from "../transaction/index.js";
//# sourceMappingURL=index.d.ts.map