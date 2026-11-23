export * from "./EIP712Type.js";
export * from "./errors.js";
export namespace EIP712 {
    export { HashDomain };
    export { EncodeData };
    export { EncodeValue };
    export { HashStruct };
    export { HashType };
    export { HashTypedData };
    export { RecoverAddress };
    export { SignTypedData };
    export { VerifyTypedData };
    export namespace Domain {
        export { hashDomain as hash };
    }
    export { encodeType };
    export { hashType };
    export { encodeValue };
    export { encodeData };
    export { hashStruct };
    export { hashTypedData };
    export { signTypedData };
    export { recoverAddress };
    export { verifyTypedData };
    export { format };
    export { validate };
}
export type TypedData = import("./EIP712Type.js").TypedData;
export type Domain = import("./EIP712Type.js").Domain;
export type TypeProperty = import("./EIP712Type.js").TypeProperty;
export type TypeDefinitions = import("./EIP712Type.js").TypeDefinitions;
export type Message = import("./EIP712Type.js").Message;
export type MessageValue = import("./EIP712Type.js").MessageValue;
export type Signature = import("./EIP712Type.js").Signature;
export type BrandedEIP712 = import("./EIP712Type.js").BrandedEIP712;
import { EncodeData } from "./encodeData.js";
import { EncodeValue } from "./encodeValue.js";
import { encodeType } from "./encodeType.js";
import { format } from "./format.js";
import { Hash as HashDomain } from "./Domain/hash.js";
import { HashStruct } from "./hashStruct.js";
import { HashType } from "./hashType.js";
import { HashTypedData } from "./hashTypedData.js";
import { RecoverAddress } from "./recoverAddress.js";
import { SignTypedData } from "./signTypedData.js";
import { VerifyTypedData } from "./verifyTypedData.js";
import { validate } from "./validate.js";
export const _signTypedData: (typedData: import("./EIP712Type.js").TypedData, privateKey: Uint8Array) => import("./EIP712Type.js").Signature;
export const encodeData: (primaryType: string, data: import("./EIP712Type.js").Message, types: import("./EIP712Type.js").TypeDefinitions) => Uint8Array;
export const encodeValue: (type: string, value: import("./EIP712Type.js").MessageValue, types: import("./EIP712Type.js").TypeDefinitions) => Uint8Array;
export const hashDomain: (domain: import("./EIP712Type.js").Domain) => import("../../primitives/Hash/HashType.js").HashType;
export let hashStruct: any;
export const hashType: (primaryType: string, types: import("./EIP712Type.js").TypeDefinitions) => import("../../primitives/Hash/HashType.js").HashType;
export const hashTypedData: (typedData: import("./EIP712Type.js").TypedData) => import("../../primitives/Hash/HashType.js").HashType;
export const recoverAddress: (signature: import("./EIP712Type.js").Signature, typedData: import("./EIP712Type.js").TypedData) => import("../../primitives/Address/AddressType.js").AddressType;
export function signTypedData(typedData: any, privateKey: any): import("./EIP712Type.js").Signature;
export const verifyTypedData: (signature: import("./EIP712Type.js").Signature, typedData: import("./EIP712Type.js").TypedData, address: import("../../primitives/Address/AddressType.js").AddressType) => boolean;
export { EncodeData, EncodeValue, encodeType, format, HashDomain, HashStruct, HashType, HashTypedData, RecoverAddress, SignTypedData, VerifyTypedData, validate };
//# sourceMappingURL=EIP712.d.ts.map