/**
 * Native FFI bindings for Ethereum primitives
 * Uses Bun FFI or Node-API for maximum performance
 *
 * This entrypoint exports the same API as the main JS entrypoint (src/index.ts)
 * but with native-optimized implementations where available.
 *
 * Currently native implementations:
 * - Keccak256 (via Zig FFI)
 */
export { Address, BrandedAddress, Hash, BrandedHash, HashType, Hex, BrandedHex, Uint, BrandedUint, Uint8, BrandedUint8, Uint16, BrandedUint16, Uint32, BrandedUint32, Uint64, BrandedUint64, Uint128, BrandedUint128, Uint256, Int8, BrandedInt8, Int16, BrandedInt16, Int32, BrandedInt32, Int64, BrandedInt64, Int128, BrandedInt128, Int256, BrandedInt256, Wei, Gwei, Ether, BrandedWei, BrandedGwei, BrandedEther, Rlp, BrandedRlp, Ssz, Abi, BrandedAbi, Transaction, AccessList, BrandedAccessList, Authorization, BrandedAuthorization, Bytecode, BrandedBytecode, ContractCode, InitCode, RuntimeCode, Metadata, SourceMap, Opcode, BrandedOpcode, Gas, GasConstants, GasCosts, GasUsed, GasEstimate, GasRefund, StorageKey, BrandedStorageKey, State, Storage, Proxy, Blob, BrandedBlob, Chain, BrandedChain, FeeMarket, BrandedFeeMarket, Hardfork, ForkId, NetworkId, ProtocolVersion, PeerId, NodeInfo, PeerInfo, Slot, Epoch, ValidatorIndex, WithdrawalIndex, BeaconBlockRoot, Withdrawal, Block, BlockBody, BlockHeader, Uncle, EventLog, BrandedEventLog, FilterId, TopicFilter, LogFilter, BlockFilter, PendingTransactionFilter, ReturnData, RevertReason, ContractResult, EncodedData, DecodedData, CompilerVersion, License, TraceConfig, OpStep, StructLog, CallTrace, TraceResult, MemoryDump, StorageDiff, StateDiff, SyncStatus, ChainHead, Selector, FunctionSignature, EventSignature, ErrorSignature, TransactionHash, TransactionIndex, LogIndex, TransactionStatus, BlockHash, BlockNumber, Receipt, Siwe, BrandedSiwe, Ens, Permit, TransactionUrl, DomainSeparator, Domain, TypedData, SignedData, ContractSignature, StealthAddress, BinaryTree, BrandedBinaryTree, BloomFilter, BrandedBloomFilter, Base64, BrandedBase64, Bytes, BrandedBytes, Bytes1, BrandedBytes1, Bytes2, BrandedBytes2, Bytes3, BrandedBytes3, Bytes4, BrandedBytes4, Bytes5, BrandedBytes5, Bytes6, BrandedBytes6, Bytes7, BrandedBytes7, Bytes8, BrandedBytes8, Bytes16, BrandedBytes16, Bytes32, BrandedBytes32, Bytes64, BrandedBytes64, } from "../primitives/index.js";
export * from "../primitives/errors/index.js";
export { Keccak256 } from "../crypto/Keccak256/Keccak256.native.js";
export { Secp256k1, EIP712, KZG, BN254, Bls12381, Ripemd160, SHA256, Blake2, Ed25519, AesGcm, ChaCha20Poly1305, Bip39, Keystore, P256, X25519, ModExp, } from "../crypto/index.js";
export * as HDWallet from "../crypto/HDWallet/index.js";
export type { Keccak256Hash } from "../crypto/Keccak256/Keccak256HashType.js";
export type { Keccak256HashType, KzgBlobType, KzgCommitmentType, KzgProofType, Bls12381G1PointType, Bls12381G2PointType, Bls12381Fp2Type, Ripemd160Hash, Ripemd160HashType, SHA256Hash, SHA256HashType, Blake2Hash, Blake2HashType, } from "../crypto/index.js";
export * from "../standards/index.js";
export * as wasm from "../wasm/index.js";
export * as evm from "../evm/index.js";
export * as precompiles from "../evm/precompiles/precompiles.js";
export { loadNative, loadForkWasm, isBun, isNode, checkError, allocateOutput, allocateStringOutput, getPlatform, getNativeExtension, isNativeSupported, getNativeErrorMessage, NativeErrorCode, type Platform, type NativeErrorCodeType, } from "../native-loader/index.js";
export { Keccak256Hash as Keccak256HashNative, Keccak256 as Keccak256Native, } from "../crypto/Keccak256/Keccak256.native.js";
import { Address } from "../primitives/Address/index.js";
import { Hex } from "../primitives/Hex/index.js";
import { Uint } from "../primitives/Uint/Uint.js";
import { Rlp } from "../primitives/Rlp/index.js";
import { Abi } from "../primitives/Abi/Abi.js";
import { Blob } from "../primitives/Blob/index.js";
import { Bytecode } from "../primitives/Bytecode/index.js";
import { Chain } from "../primitives/Chain/index.js";
import { Opcode } from "../primitives/Opcode/index.js";
import { BloomFilter } from "../primitives/BloomFilter/index.js";
import { Siwe } from "../primitives/Siwe/index.js";
import { Bytes } from "../primitives/Bytes/Bytes.js";
import { Bytes32 } from "../primitives/Bytes/Bytes32/index.js";
import { KZG } from "../crypto/KZG/index.js";
/**
 * Native API object - satisfies VoltaireAPI interface
 * This ensures compile-time errors if the native API doesn't have all required namespaces.
 *
 * Note: The actual Keccak256 export is the native async version from Keccak256.native.js,
 * but we use JS Keccak256 here for type checking since native methods are async.
 */
declare const _nativeAPI: {
    Address: typeof Address;
    Hash: import("../primitives/Hash/HashConstructor.js").HashConstructor;
    Hex: typeof Hex;
    Uint: typeof Uint;
    Rlp: typeof Rlp;
    Abi: typeof Abi;
    Blob: typeof Blob;
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
    Bytecode: typeof Bytecode;
    Chain: typeof Chain;
    Opcode: typeof Opcode;
    BloomFilter: typeof BloomFilter;
    Siwe: typeof Siwe;
    Bytes: typeof Bytes;
    Bytes32: typeof Bytes32;
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
    };
    Blake2: typeof import("../crypto/Blake2/from.js").from & {
        from: typeof import("../crypto/Blake2/from.js").from;
        fromString: typeof import("../crypto/Blake2/hashString.js").hashString;
        hash: typeof import("../crypto/Blake2/hash.js").hash;
        hashString: typeof import("../crypto/Blake2/hashString.js").hashString;
        SIZE: number;
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
    };
    P256: import("../crypto/P256/P256Constructor.js").P256Constructor;
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
    KZG: typeof KZG;
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
    };
    ModExp: typeof import("../crypto/ModExp/compute.js").modexp & {
        modexp: typeof import("../crypto/ModExp/compute.js").modexp;
        modexpBytes: typeof import("../crypto/ModExp/modexpBytes.js").modexpBytes;
        calculateGas: typeof import("../crypto/ModExp/calculateGas.js").calculateGas;
    };
};
export { _nativeAPI as nativeAPI };
export * as block from "../block/index.js";
export * as contract from "../contract/index.js";
export * as transaction from "../transaction/index.js";
export * as stream from "../stream/index.js";
export * as wallet from "../wallet/index.js";
export type { HardwareWallet } from "../wallet/hardware/HardwareWallet.js";
//# sourceMappingURL=index.d.ts.map