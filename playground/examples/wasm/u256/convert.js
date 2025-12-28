// WASM: U256 conversions
import { u256FromHex, u256ToHex, u256FromBigInt, u256ToBigInt } from "voltaire/wasm";

(() => {
  const v1 = u256FromBigInt(123456789n);
  console.log("u256FromBigInt(123456789n) ->", u256ToHex(v1));

  const v2 = u256FromHex("0x01");
  console.log("u256FromHex(0x01) ->", u256ToBigInt(v2).toString());
})();

