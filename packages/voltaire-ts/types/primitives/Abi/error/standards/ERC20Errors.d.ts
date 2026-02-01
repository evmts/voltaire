/**
 * ERC-6093: Custom Errors for ERC-20 Tokens
 *
 * @see https://eips.ethereum.org/EIPS/eip-6093
 * @since 0.0.0
 */
/**
 * Insufficient balance for transfer
 * error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)
 */
export declare const ERC20InsufficientBalance: {
    readonly type: "error";
    readonly name: "ERC20InsufficientBalance";
    readonly inputs: readonly [{
        readonly name: "sender";
        readonly type: "address";
    }, {
        readonly name: "balance";
        readonly type: "uint256";
    }, {
        readonly name: "needed";
        readonly type: "uint256";
    }];
};
/**
 * Invalid sender address
 * error ERC20InvalidSender(address sender)
 */
export declare const ERC20InvalidSender: {
    readonly type: "error";
    readonly name: "ERC20InvalidSender";
    readonly inputs: readonly [{
        readonly name: "sender";
        readonly type: "address";
    }];
};
/**
 * Invalid receiver address
 * error ERC20InvalidReceiver(address receiver)
 */
export declare const ERC20InvalidReceiver: {
    readonly type: "error";
    readonly name: "ERC20InvalidReceiver";
    readonly inputs: readonly [{
        readonly name: "receiver";
        readonly type: "address";
    }];
};
/**
 * Insufficient allowance for transfer
 * error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)
 */
export declare const ERC20InsufficientAllowance: {
    readonly type: "error";
    readonly name: "ERC20InsufficientAllowance";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly type: "address";
    }, {
        readonly name: "allowance";
        readonly type: "uint256";
    }, {
        readonly name: "needed";
        readonly type: "uint256";
    }];
};
/**
 * Invalid approver address
 * error ERC20InvalidApprover(address approver)
 */
export declare const ERC20InvalidApprover: {
    readonly type: "error";
    readonly name: "ERC20InvalidApprover";
    readonly inputs: readonly [{
        readonly name: "approver";
        readonly type: "address";
    }];
};
/**
 * Invalid spender address
 * error ERC20InvalidSpender(address spender)
 */
export declare const ERC20InvalidSpender: {
    readonly type: "error";
    readonly name: "ERC20InvalidSpender";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly type: "address";
    }];
};
//# sourceMappingURL=ERC20Errors.d.ts.map