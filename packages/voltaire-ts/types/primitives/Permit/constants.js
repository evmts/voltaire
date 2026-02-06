/**
 * EIP-2612 Permit type definition for EIP-712
 */
export const PERMIT_TYPES = {
    Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
    ],
};
