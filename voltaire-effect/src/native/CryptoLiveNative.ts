import * as Layer from "effect/Layer";
import { CryptoLive } from "../crypto/CryptoLive.js";
import { HDWalletLive } from "../crypto/HDWallet/HDWalletLive.js";

/**
 * CryptoLive with native-only HDWallet support.
 */
export const CryptoLiveNative = Layer.mergeAll(CryptoLive, HDWalletLive);
