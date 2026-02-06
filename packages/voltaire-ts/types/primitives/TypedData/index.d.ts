export { encode as _encode } from "./encode.js";
export * from "./errors.js";
export { from as _from } from "./from.js";
export { hash as _hash } from "./hash.js";
export type { TypedDataField, TypedDataType } from "./TypedDataType.js";
export { validate as _validate } from "./validate.js";
export declare function from<T = Record<string, unknown>>(typedData: {
    types: {
        EIP712Domain: readonly import("./TypedDataType.js").TypedDataField[];
        [key: string]: readonly import("./TypedDataType.js").TypedDataField[];
    };
    primaryType: string;
    domain: {
        name?: string;
        version?: string;
        chainId?: import("../ChainId/ChainIdType.js").ChainIdType | number;
        verifyingContract?: import("../Address/AddressType.js").AddressType | string;
        salt?: import("../Hash/HashType.js").HashType | string;
    };
    message: T;
}): import("./TypedDataType.js").TypedDataType<T>;
export declare function hash(typedData: import("./TypedDataType.js").TypedDataType, crypto: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): import("../Hash/HashType.js").HashType;
export declare function encode(typedData: import("./TypedDataType.js").TypedDataType, crypto: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): Uint8Array;
export declare function validate(typedData: import("./TypedDataType.js").TypedDataType): void;
//# sourceMappingURL=index.d.ts.map