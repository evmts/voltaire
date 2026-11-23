/**
 * Create a Host interface implementation
 *
 * @param {object} impl - Host implementation
 * @param {(address: import("../../primitives/Address/AddressType.js").AddressType) => bigint} impl.getBalance - Get balance
 * @param {(address: import("../../primitives/Address/AddressType.js").AddressType, balance: bigint) => void} impl.setBalance - Set balance
 * @param {(address: import("../../primitives/Address/AddressType.js").AddressType) => Uint8Array} impl.getCode - Get code
 * @param {(address: import("../../primitives/Address/AddressType.js").AddressType, code: Uint8Array) => void} impl.setCode - Set code
 * @param {(address: import("../../primitives/Address/AddressType.js").AddressType, slot: bigint) => bigint} impl.getStorage - Get storage
 * @param {(address: import("../../primitives/Address/AddressType.js").AddressType, slot: bigint, value: bigint) => void} impl.setStorage - Set storage
 * @param {(address: import("../../primitives/Address/AddressType.js").AddressType) => bigint} impl.getNonce - Get nonce
 * @param {(address: import("../../primitives/Address/AddressType.js").AddressType, nonce: bigint) => void} impl.setNonce - Set nonce
 * @param {(address: import("../../primitives/Address/AddressType.js").AddressType, slot: bigint) => bigint} impl.getTransientStorage - Get transient storage
 * @param {(address: import("../../primitives/Address/AddressType.js").AddressType, slot: bigint, value: bigint) => void} impl.setTransientStorage - Set transient storage
 * @returns {import("./HostType.js").BrandedHost} Host instance
 */
export function from(impl: {
    getBalance: (address: import("../../primitives/Address/AddressType.js").AddressType) => bigint;
    setBalance: (address: import("../../primitives/Address/AddressType.js").AddressType, balance: bigint) => void;
    getCode: (address: import("../../primitives/Address/AddressType.js").AddressType) => Uint8Array;
    setCode: (address: import("../../primitives/Address/AddressType.js").AddressType, code: Uint8Array) => void;
    getStorage: (address: import("../../primitives/Address/AddressType.js").AddressType, slot: bigint) => bigint;
    setStorage: (address: import("../../primitives/Address/AddressType.js").AddressType, slot: bigint, value: bigint) => void;
    getNonce: (address: import("../../primitives/Address/AddressType.js").AddressType) => bigint;
    setNonce: (address: import("../../primitives/Address/AddressType.js").AddressType, nonce: bigint) => void;
    getTransientStorage: (address: import("../../primitives/Address/AddressType.js").AddressType, slot: bigint) => bigint;
    setTransientStorage: (address: import("../../primitives/Address/AddressType.js").AddressType, slot: bigint, value: bigint) => void;
}): import("./HostType.js").BrandedHost;
//# sourceMappingURL=from.d.ts.map