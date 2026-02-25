export type { DomainType } from "./DomainType.js";
export type { ERC5267Response } from "./ERC5267Type.js";
export { ERC5267_FIELDS } from "./ERC5267Type.js";
export { encodeData as _encodeData } from "./encodeData.js";
export { encodeType as _encodeType } from "./encodeType.js";
export { encodeValue as _encodeValue } from "./encodeValue.js";
export * from "./errors.js";
export { from as _from } from "./from.js";
export { getEIP712DomainType as _getEIP712DomainType } from "./getEIP712DomainType.js";
export { getFieldsBitmap as _getFieldsBitmap } from "./getFieldsBitmap.js";
export { hashType as _hashType } from "./hashType.js";
export { toErc5267Response as _toErc5267Response } from "./toErc5267Response.js";
export { toHash as _toHash } from "./toHash.js";
export declare function from(domain: {
    name?: string;
    version?: string;
    chainId?: import("../ChainId/ChainIdType.js").ChainIdType | number | bigint;
    verifyingContract?: import("../Address/AddressType.js").AddressType | string;
    salt?: import("../Hash/HashType.js").HashType | string;
}): import("./DomainType.js").DomainType;
export declare function toHash(domain: import("./DomainType.js").DomainType, crypto: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): import("../DomainSeparator/DomainSeparatorType.js").DomainSeparatorType;
export declare function encodeData(primaryType: string, data: any, types: Record<string, readonly {
    readonly name: string;
    readonly type: string;
}[]>, crypto: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): Uint8Array;
export declare function encodeType(primaryType: string, types: Record<string, readonly {
    readonly name: string;
    readonly type: string;
}[]>): string;
export declare function encodeValue(type: string, value: any, types: Record<string, readonly {
    readonly name: string;
    readonly type: string;
}[]>, crypto: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): Uint8Array;
export declare function hashType(primaryType: string, types: Record<string, readonly {
    readonly name: string;
    readonly type: string;
}[]>, crypto: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): Uint8Array;
export declare function getEIP712DomainType(domain: import("./DomainType.js").DomainType): Array<{
    name: string;
    type: string;
}>;
export declare function getFieldsBitmap(domain: import("./DomainType.js").DomainType): Uint8Array;
export declare function toErc5267Response(domain: import("./DomainType.js").DomainType): import("./ERC5267Type.js").ERC5267Response;
//# sourceMappingURL=index.d.ts.map