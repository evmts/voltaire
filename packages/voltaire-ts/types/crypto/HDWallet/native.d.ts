export * from "./HDWallet.js";
export type HDWallet = import("./HDWallet.js").HDWallet;
/** @typedef {import("./HDWallet.js").HDWallet} HDWallet */
/** Keep libwally mnemonic behavior available from the native entry point. */
export const HDWallet: {
    generateMnemonic: typeof generateMnemonic;
    mnemonicToSeed: typeof mnemonicToSeed;
    validateMnemonic: typeof validateMnemonic;
    fromSeed: typeof import("./fromSeed.js").fromSeed;
    fromExtendedKey: typeof import("./fromExtendedKey.js").fromExtendedKey;
    fromPublicExtendedKey: typeof import("./fromPublicExtendedKey.js").fromPublicExtendedKey;
    derivePath: typeof import("./derivePath.js").derivePath;
    deriveChild: typeof import("./deriveChild.js").deriveChild;
    deriveEthereum: typeof import("./deriveEthereum.js").deriveEthereum;
    deriveBitcoin: typeof import("./deriveBitcoin.js").deriveBitcoin;
    toExtendedPrivateKey: typeof import("./toExtendedPrivateKey.js").toExtendedPrivateKey;
    toExtendedPublicKey: typeof import("./toExtendedPublicKey.js").toExtendedPublicKey;
    getPrivateKey: typeof import("./getPrivateKey.js").getPrivateKey;
    getPublicKey: typeof import("./getPublicKey.js").getPublicKey;
    getChainCode: typeof import("./getChainCode.js").getChainCode;
    canDeriveHardened: typeof import("./canDeriveHardened.js").canDeriveHardened;
    toPublic: typeof import("./toPublic.js").toPublic;
    isHardenedPath: typeof import("./isHardenedPath.js").isHardenedPath;
    isValidPath: typeof import("./isValidPath.js").isValidPath;
    parseIndex: typeof import("./parseIndex.js").parseIndex;
    HARDENED_OFFSET: number;
    CoinType: Readonly<{
        BTC: 0;
        BTC_TESTNET: 1;
        ETH: 60;
        ETC: 61;
    }>;
    BIP44_PATH: Readonly<{
        ETH: (account?: number, index?: number) => string;
        BTC: (account?: number, index?: number) => string;
    }>;
};
import { generateMnemonic } from "./generateMnemonic.native.js";
import { mnemonicToSeed } from "./mnemonicToSeed.native.js";
import { validateMnemonic } from "./validateMnemonic.native.js";
export { generateMnemonic, mnemonicToSeed, validateMnemonic };
//# sourceMappingURL=native.d.ts.map