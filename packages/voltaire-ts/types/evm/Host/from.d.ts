/**
 * Create a Host interface implementation
 *
 * @param {object} impl - Host implementation
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType): bigint} impl.getBalance - Get balance
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType, bigint): void} impl.setBalance - Set balance
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType): Uint8Array} impl.getCode - Get code
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType, Uint8Array): void} impl.setCode - Set code
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType, bigint): bigint} impl.getStorage - Get storage
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType, bigint, bigint): void} impl.setStorage - Set storage
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType): bigint} impl.getNonce - Get nonce
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType, bigint): void} impl.setNonce - Set nonce
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType, bigint): bigint} impl.getTransientStorage - Get transient storage
 * @param {function(import("../../primitives/Address/AddressType.js").AddressType, bigint, bigint): void} impl.setTransientStorage - Set transient storage
 * @returns {import("./HostType.js").BrandedHost} Host instance
 */
export function from(impl: {
    getBalance: (arg0: import("../../primitives/Address/AddressType.js").AddressType) => bigint;
    setBalance: (arg0: import("../../primitives/Address/AddressType.js").AddressType, arg1: bigint) => void;
    getCode: (arg0: import("../../primitives/Address/AddressType.js").AddressType) => Uint8Array;
    setCode: (arg0: import("../../primitives/Address/AddressType.js").AddressType, arg1: Uint8Array) => void;
    getStorage: (arg0: import("../../primitives/Address/AddressType.js").AddressType, arg1: bigint) => bigint;
    setStorage: (arg0: import("../../primitives/Address/AddressType.js").AddressType, arg1: bigint, arg2: bigint) => void;
    getNonce: (arg0: import("../../primitives/Address/AddressType.js").AddressType) => bigint;
    setNonce: (arg0: import("../../primitives/Address/AddressType.js").AddressType, arg1: bigint) => void;
    getTransientStorage: (arg0: import("../../primitives/Address/AddressType.js").AddressType, arg1: bigint) => bigint;
    setTransientStorage: (arg0: import("../../primitives/Address/AddressType.js").AddressType, arg1: bigint, arg2: bigint) => void;
}): import("./HostType.js").BrandedHost;
//# sourceMappingURL=from.d.ts.map