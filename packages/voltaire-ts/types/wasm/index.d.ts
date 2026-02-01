/**
 * WASM entrypoint for Voltaire
 *
 * Provides the same API as the main JS entrypoint (src/index.ts) but with
 * WASM-accelerated implementations where available.
 *
 * @example
 * ```typescript
 * import { Keccak256, Secp256k1, Address } from '@voltaire/wasm';
 *
 * // Same API as JS entrypoint
 * const hash = Keccak256.hash(data);
 * const sig = Secp256k1.sign(hash, privateKey);
 * ```
 */
import { Address as AddressJS } from "../primitives/Address/index.js";
import { Hex as HexJS } from "../primitives/Hex/index.js";
import { Uint as UintJS } from "../primitives/Uint/Uint.js";
import { Rlp as RlpJS } from "../primitives/Rlp/index.js";
import { Abi as AbiJS } from "../primitives/Abi/Abi.js";
import { Blob as BlobJS } from "../primitives/Blob/index.js";
import { Bytecode as BytecodeJS } from "../primitives/Bytecode/index.js";
import { Chain as ChainJS } from "../primitives/Chain/index.js";
import { Opcode as OpcodeJS } from "../primitives/Opcode/index.js";
import { BloomFilter as BloomFilterJS } from "../primitives/BloomFilter/index.js";
import { Siwe as SiweJS } from "../primitives/Siwe/index.js";
import { Bytes as BytesJS } from "../primitives/Bytes/Bytes.js";
import { Bytes32 as Bytes32JS } from "../primitives/Bytes/Bytes32/index.js";
import { KZG as KZGJS } from "../crypto/KZG/index.js";
import { Keccak256Wasm } from "../crypto/keccak256.wasm.js";
import { Sha256Wasm } from "../crypto/sha256.wasm.js";
import { Blake2Wasm } from "../crypto/Blake2/Blake2.wasm.js";
import { Ripemd160Wasm } from "../crypto/ripemd160.wasm.js";
import { Secp256k1Wasm } from "../crypto/secp256k1.wasm.js";
import { Ed25519Wasm } from "../crypto/ed25519.wasm.js";
import { P256Wasm } from "../crypto/p256.wasm.js";
import { X25519Wasm } from "../crypto/x25519.wasm.js";
import { Bn254Wasm } from "../crypto/bn254.wasm.js";
import { Eip712Wasm } from "../crypto/eip712.wasm.js";
import { analyzeJumpDestinations, isBytecodeBoundary, isValidJumpDest, validate as validateBytecode } from "../primitives/Bytecode/Bytecode.wasm.js";
import { sha256 as hashSha256, ripemd160 as hashRipemd160, blake2b as hashBlake2b, solidityKeccak256, soliditySha256 } from "../primitives/Hash/Hash.wasm.js";
import { hexToBytes as wasmHexToBytes, bytesToHex as wasmBytesToHex } from "../primitives/Hex/Hex.wasm.js";
import { encodeBytes as rlpEncodeBytes, encodeUint as rlpEncodeUint, encodeUintFromBigInt as rlpEncodeUintFromBigInt, toHex as rlpToHex, fromHex as rlpFromHex } from "../primitives/Rlp/Rlp.wasm.js";
import { TransactionType, detectTransactionType } from "../primitives/Transaction/Transaction.wasm.js";
import { u256FromHex, u256ToHex, u256FromBigInt, u256ToBigInt } from "../primitives/Uint/Uint256.wasm.js";
import { fromDataWasm as blobFromData, toDataWasm as blobToData, isValidWasm as blobIsValid, calculateGasWasm as blobCalculateGas, estimateBlobCountWasm as blobEstimateCount, calculateGasPriceWasm as blobCalculateGasPrice, calculateExcessGasWasm as blobCalculateExcessGas } from "../primitives/Blob/Blob.wasm.js";
import { gasCostWasm as accessListGasCost, gasSavingsWasm as accessListGasSavings, includesAddressWasm as accessListIncludesAddress, includesStorageKeyWasm as accessListIncludesStorageKey } from "../primitives/AccessList/AccessList.wasm.js";
import { type ParsedSignature, secp256k1RecoverPubkey, secp256k1RecoverAddress, secp256k1PubkeyFromPrivate, secp256k1ValidateSignature, signatureNormalize, signatureIsCanonical, signatureParse, signatureSerialize } from "../crypto/signature.wasm.js";
import { Hash as KeccakHash, keccak256 as wasmKeccak256, eip191HashMessage } from "../crypto/keccak.wasm.js";
import { generatePrivateKey, compressPublicKey } from "../crypto/wallet.wasm.js";
/**
 * Keccak256 with WASM acceleration
 * Falls back to JS implementation, but WASM methods available via `_wasm`
 */
export declare const Keccak256: typeof import("../crypto/Keccak256/from.js").from & {
    from: typeof import("../crypto/Keccak256/from.js").from;
    fromString: typeof import("../crypto/Keccak256/hashString.js").hashString;
    fromHex: typeof import("../crypto/Keccak256/hashHex.js").hashHex;
    fromTopic: typeof import("../crypto/Keccak256/topic.js").topic;
    hash: typeof import("../crypto/Keccak256/hash.js").hash;
    hashString: typeof import("../crypto/Keccak256/hashString.js").hashString;
    hashHex: typeof import("../crypto/Keccak256/hashHex.js").hashHex;
    hashMultiple: typeof import("../crypto/Keccak256/hashMultiple.js").hashMultiple;
    selector: typeof import("../crypto/Keccak256/selector.js").selector;
    topic: typeof import("../crypto/Keccak256/topic.js").topic;
    contractAddress: typeof import("../crypto/Keccak256/contractAddress.js").contractAddress;
    create2Address: typeof import("../crypto/Keccak256/create2Address.js").create2Address;
    DIGEST_SIZE: number;
    RATE: number;
    STATE_SIZE: number;
} & {
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
        isReady: typeof import("../crypto/keccak256.wasm.js").isReady;
        DIGEST_SIZE: number;
        RATE: number;
        STATE_SIZE: number;
    };
};
/**
 * SHA256 with WASM acceleration
 */
export declare const SHA256: typeof import("../crypto/SHA256/from.js").from & {
    from: typeof import("../crypto/SHA256/from.js").from;
    fromString: typeof import("../crypto/SHA256/hashString.js").hashString;
    fromHex: typeof import("../crypto/SHA256/hashHex.js").hashHex;
    hash: typeof import("../crypto/SHA256/hash.js").hash;
    hashString: typeof import("../crypto/SHA256/hashString.js").hashString;
    hashHex: typeof import("../crypto/SHA256/hashHex.js").hashHex;
    toHex: typeof import("../crypto/SHA256/toHex.js").toHex;
    create: typeof import("../crypto/SHA256/create.js").create;
    OUTPUT_SIZE: number;
    BLOCK_SIZE: number;
} & {
    _wasm: typeof Sha256Wasm;
};
/**
 * Blake2 with WASM acceleration
 */
export declare const Blake2: typeof import("../crypto/Blake2/from.js").from & {
    from: typeof import("../crypto/Blake2/from.js").from;
    fromString: typeof import("../crypto/Blake2/hashString.js").hashString;
    hash: typeof import("../crypto/Blake2/hash.js").hash;
    hashString: typeof import("../crypto/Blake2/hashString.js").hashString;
    SIZE: number;
} & {
    _wasm: typeof Blake2Wasm;
};
/**
 * Ripemd160 with WASM acceleration
 */
export declare const Ripemd160: typeof import("../crypto/Ripemd160/from.js").from & {
    from: typeof import("../crypto/Ripemd160/from.js").from;
    fromString: typeof import("../crypto/Ripemd160/hashString.js").hashString;
    fromHex: typeof import("../crypto/Ripemd160/hashHex.js").hashHex;
    hash: typeof import("../crypto/Ripemd160/hash.js").hash;
    hashString: typeof import("../crypto/Ripemd160/hashString.js").hashString;
    hashHex: typeof import("../crypto/Ripemd160/hashHex.js").hashHex;
    SIZE: number;
    HEX_SIZE: number;
} & {
    _wasm: typeof Ripemd160Wasm;
};
/**
 * Secp256k1 with WASM acceleration
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
    _wasm: typeof Secp256k1Wasm;
};
/**
 * Ed25519 with WASM acceleration
 */
export declare const Ed25519: {
    keypairFromSeed: typeof import("../crypto/Ed25519/keypairFromSeed.js").keypairFromSeed;
    sign: typeof import("../crypto/Ed25519/sign.js").sign;
    verify: typeof import("../crypto/Ed25519/verify.js").verify;
    derivePublicKey: typeof import("../crypto/Ed25519/derivePublicKey.js").derivePublicKey;
    validateSecretKey: typeof import("../crypto/Ed25519/validateSecretKey.js").validateSecretKey;
    validatePublicKey: typeof import("../crypto/Ed25519/validatePublicKey.js").validatePublicKey;
    validateSeed: typeof import("../crypto/Ed25519/validateSeed.js").validateSeed;
    SECRET_KEY_SIZE: 32;
    PUBLIC_KEY_SIZE: 32;
    SIGNATURE_SIZE: 64;
    SEED_SIZE: 32;
} & {
    _wasm: typeof Ed25519Wasm;
};
/**
 * P256 with WASM acceleration
 */
export declare const P256: import("../crypto/P256/P256Constructor.js").P256Constructor & {
    _wasm: typeof P256Wasm;
};
/**
 * X25519 with WASM acceleration
 */
export declare const X25519: {
    derivePublicKey: typeof import("../crypto/X25519/derivePublicKey.js").derivePublicKey;
    scalarmult: typeof import("../crypto/X25519/scalarmult.js").scalarmult;
    keypairFromSeed: typeof import("../crypto/X25519/keypairFromSeed.js").keypairFromSeed;
    generateSecretKey: typeof import("../crypto/X25519/generateSecretKey.js").generateSecretKey;
    generateKeypair: typeof import("../crypto/X25519/generateKeypair.js").generateKeypair;
    validateSecretKey: typeof import("../crypto/X25519/validateSecretKey.js").validateSecretKey;
    validatePublicKey: typeof import("../crypto/X25519/validatePublicKey.js").validatePublicKey;
    SECRET_KEY_SIZE: 32;
    PUBLIC_KEY_SIZE: 32;
    SHARED_SECRET_SIZE: 32;
} & {
    _wasm: typeof X25519Wasm;
};
/**
 * BN254 with WASM acceleration
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
/**
 * EIP712 with WASM acceleration
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
        hash: (domain: import("../crypto/EIP712/EIP712Type.js").Domain) => import("../primitives/Hash/HashType.js").HashType;
    };
    encodeType: typeof import("../crypto/EIP712/encodeType.js").encodeType;
    hashType: (primaryType: string, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => import("../primitives/Hash/HashType.js").HashType;
    encodeValue: (type: string, value: import("../crypto/EIP712/EIP712Type.js").MessageValue, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => Uint8Array;
    encodeData: (primaryType: string, data: import("../crypto/EIP712/EIP712Type.js").Message, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => Uint8Array;
    hashStruct: (primaryType: string, data: import("../crypto/EIP712/EIP712Type.js").Message, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => import("../primitives/Hash/HashType.js").HashType;
    hashTypedData: (typedData: import("../crypto/EIP712/EIP712Type.js").TypedData) => import("../primitives/Hash/HashType.js").HashType;
    signTypedData: typeof import("../crypto/EIP712/EIP712.js").signTypedData;
    recoverAddress: (signature: import("../crypto/EIP712/EIP712Type.js").Signature, typedData: import("../crypto/EIP712/EIP712Type.js").TypedData) => import("../primitives/Address/AddressType.js").AddressType;
    verifyTypedData: (signature: import("../crypto/EIP712/EIP712Type.js").Signature, typedData: import("../crypto/EIP712/EIP712Type.js").TypedData, address: import("../primitives/Address/AddressType.js").AddressType) => boolean;
    format: typeof import("../crypto/EIP712/format.js").format;
    validate: typeof import("../crypto/EIP712/validate.js").validate;
} & {
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
    includesStorageKey: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType, storageKey: import("../primitives/Hash/HashType.js").HashType) => boolean;
    keysFor: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType) => readonly import("../primitives/Hash/HashType.js").HashType[] | undefined;
    deduplicate: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
    withAddress: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
    withStorageKey: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType, storageKey: import("../primitives/Hash/HashType.js").HashType) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
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
export { ChaCha20Poly1305 } from "../crypto/ChaCha20Poly1305/ChaCha20Poly1305.js";
export { Bip39 } from "../crypto/Bip39/index.js";
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
        includesStorageKey: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType, storageKey: import("../primitives/Hash/HashType.js").HashType) => boolean;
        keysFor: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType) => readonly import("../primitives/Hash/HashType.js").HashType[] | undefined;
        deduplicate: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
        withAddress: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
        withStorageKey: (list: import("../primitives/AccessList/AccessListType.js").BrandedAccessList, address: import("../primitives/Address/AddressType.js").AddressType, storageKey: import("../primitives/Hash/HashType.js").HashType) => import("../primitives/AccessList/AccessListType.js").BrandedAccessList;
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
    Keccak256: typeof import("../crypto/Keccak256/from.js").from & {
        from: typeof import("../crypto/Keccak256/from.js").from;
        fromString: typeof import("../crypto/Keccak256/hashString.js").hashString;
        fromHex: typeof import("../crypto/Keccak256/hashHex.js").hashHex;
        fromTopic: typeof import("../crypto/Keccak256/topic.js").topic;
        hash: typeof import("../crypto/Keccak256/hash.js").hash;
        hashString: typeof import("../crypto/Keccak256/hashString.js").hashString;
        hashHex: typeof import("../crypto/Keccak256/hashHex.js").hashHex;
        hashMultiple: typeof import("../crypto/Keccak256/hashMultiple.js").hashMultiple;
        selector: typeof import("../crypto/Keccak256/selector.js").selector;
        topic: typeof import("../crypto/Keccak256/topic.js").topic;
        contractAddress: typeof import("../crypto/Keccak256/contractAddress.js").contractAddress;
        create2Address: typeof import("../crypto/Keccak256/create2Address.js").create2Address;
        DIGEST_SIZE: number;
        RATE: number;
        STATE_SIZE: number;
    } & {
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
            isReady: typeof import("../crypto/keccak256.wasm.js").isReady;
            DIGEST_SIZE: number;
            RATE: number;
            STATE_SIZE: number;
        };
    };
    SHA256: typeof import("../crypto/SHA256/from.js").from & {
        from: typeof import("../crypto/SHA256/from.js").from;
        fromString: typeof import("../crypto/SHA256/hashString.js").hashString;
        fromHex: typeof import("../crypto/SHA256/hashHex.js").hashHex;
        hash: typeof import("../crypto/SHA256/hash.js").hash;
        hashString: typeof import("../crypto/SHA256/hashString.js").hashString;
        hashHex: typeof import("../crypto/SHA256/hashHex.js").hashHex;
        toHex: typeof import("../crypto/SHA256/toHex.js").toHex;
        create: typeof import("../crypto/SHA256/create.js").create;
        OUTPUT_SIZE: number;
        BLOCK_SIZE: number;
    } & {
        _wasm: typeof Sha256Wasm;
    };
    Blake2: typeof import("../crypto/Blake2/from.js").from & {
        from: typeof import("../crypto/Blake2/from.js").from;
        fromString: typeof import("../crypto/Blake2/hashString.js").hashString;
        hash: typeof import("../crypto/Blake2/hash.js").hash;
        hashString: typeof import("../crypto/Blake2/hashString.js").hashString;
        SIZE: number;
    } & {
        _wasm: typeof Blake2Wasm;
    };
    Ripemd160: typeof import("../crypto/Ripemd160/from.js").from & {
        from: typeof import("../crypto/Ripemd160/from.js").from;
        fromString: typeof import("../crypto/Ripemd160/hashString.js").hashString;
        fromHex: typeof import("../crypto/Ripemd160/hashHex.js").hashHex;
        hash: typeof import("../crypto/Ripemd160/hash.js").hash;
        hashString: typeof import("../crypto/Ripemd160/hashString.js").hashString;
        hashHex: typeof import("../crypto/Ripemd160/hashHex.js").hashHex;
        SIZE: number;
        HEX_SIZE: number;
    } & {
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
        _wasm: typeof Secp256k1Wasm;
    };
    Ed25519: {
        keypairFromSeed: typeof import("../crypto/Ed25519/keypairFromSeed.js").keypairFromSeed;
        sign: typeof import("../crypto/Ed25519/sign.js").sign;
        verify: typeof import("../crypto/Ed25519/verify.js").verify;
        derivePublicKey: typeof import("../crypto/Ed25519/derivePublicKey.js").derivePublicKey;
        validateSecretKey: typeof import("../crypto/Ed25519/validateSecretKey.js").validateSecretKey;
        validatePublicKey: typeof import("../crypto/Ed25519/validatePublicKey.js").validatePublicKey;
        validateSeed: typeof import("../crypto/Ed25519/validateSeed.js").validateSeed;
        SECRET_KEY_SIZE: 32;
        PUBLIC_KEY_SIZE: 32;
        SIGNATURE_SIZE: 64;
        SEED_SIZE: 32;
    } & {
        _wasm: typeof Ed25519Wasm;
    };
    P256: import("../crypto/P256/P256Constructor.js").P256Constructor & {
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
        SECRET_KEY_SIZE: 32;
        PUBLIC_KEY_SIZE: 32;
        SHARED_SECRET_SIZE: 32;
    } & {
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
            hash: (domain: import("../crypto/EIP712/EIP712Type.js").Domain) => import("../primitives/Hash/HashType.js").HashType;
        };
        encodeType: typeof import("../crypto/EIP712/encodeType.js").encodeType;
        hashType: (primaryType: string, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => import("../primitives/Hash/HashType.js").HashType;
        encodeValue: (type: string, value: import("../crypto/EIP712/EIP712Type.js").MessageValue, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => Uint8Array;
        encodeData: (primaryType: string, data: import("../crypto/EIP712/EIP712Type.js").Message, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => Uint8Array;
        hashStruct: (primaryType: string, data: import("../crypto/EIP712/EIP712Type.js").Message, types: import("../crypto/EIP712/EIP712Type.js").TypeDefinitions) => import("../primitives/Hash/HashType.js").HashType;
        hashTypedData: (typedData: import("../crypto/EIP712/EIP712Type.js").TypedData) => import("../primitives/Hash/HashType.js").HashType;
        signTypedData: typeof import("../crypto/EIP712/EIP712.js").signTypedData;
        recoverAddress: (signature: import("../crypto/EIP712/EIP712Type.js").Signature, typedData: import("../crypto/EIP712/EIP712Type.js").TypedData) => import("../primitives/Address/AddressType.js").AddressType;
        verifyTypedData: (signature: import("../crypto/EIP712/EIP712Type.js").Signature, typedData: import("../crypto/EIP712/EIP712Type.js").TypedData, address: import("../primitives/Address/AddressType.js").AddressType) => boolean;
        format: typeof import("../crypto/EIP712/format.js").format;
        validate: typeof import("../crypto/EIP712/validate.js").validate;
    } & {
        _wasm: typeof Eip712Wasm;
    };
    ModExp: typeof import("../crypto/ModExp/compute.js").modexp & {
        modexp: typeof import("../crypto/ModExp/compute.js").modexp;
        modexpBytes: typeof import("../crypto/ModExp/modexpBytes.js").modexpBytes;
        calculateGas: typeof import("../crypto/ModExp/calculateGas.js").calculateGas;
    };
};
export { _wasmApi as wasmAPI };
export * from "../standards/index.js";
export * as evm from "../evm/index.js";
export * as precompiles from "../evm/precompiles/precompiles.js";
export { Keccak256Wasm, Sha256Wasm, Blake2Wasm, Ripemd160Wasm, Secp256k1Wasm, Ed25519Wasm, P256Wasm, X25519Wasm, Bn254Wasm, Eip712Wasm, };
export { KeccakHash, wasmKeccak256 as keccak256, eip191HashMessage, hashSha256 as sha256, hashRipemd160 as ripemd160, hashBlake2b as blake2b, solidityKeccak256, soliditySha256, wasmHexToBytes as hexToBytes, wasmBytesToHex as bytesToHex, rlpEncodeBytes, rlpEncodeUint, rlpEncodeUintFromBigInt, rlpToHex, rlpFromHex, TransactionType, detectTransactionType, u256FromHex, u256ToHex, u256FromBigInt, u256ToBigInt, blobFromData, blobToData, blobIsValid, blobCalculateGas, blobEstimateCount, blobCalculateGasPrice, blobCalculateExcessGas, accessListGasCost, accessListGasSavings, accessListIncludesAddress, accessListIncludesStorageKey, analyzeJumpDestinations, isBytecodeBoundary, isValidJumpDest, validateBytecode, type ParsedSignature, secp256k1RecoverPubkey, secp256k1RecoverAddress, secp256k1PubkeyFromPrivate, secp256k1ValidateSignature, signatureNormalize, signatureIsCanonical, signatureParse, signatureSerialize, generatePrivateKey, compressPublicKey, };
export * as block from "../block/index.js";
export * as contract from "../contract/index.js";
export * as transaction from "../transaction/index.js";
export * as stream from "../stream/index.js";
//# sourceMappingURL=index.d.ts.map