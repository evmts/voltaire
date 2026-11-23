# ABI

`Abi` (`voltaire.abi`) computes 4-byte function selectors, encodes and decodes contract parameters and calldata, performs Solidity-compatible packed encoding, and estimates calldata gas cost through Voltaire's C FFI.

## Static Methods

| Method | Signature | Returns |
|--------|-----------|---------|
| `Abi.compute_selector` | `(signature: str) -> bytes` | 4-byte selector `keccak256(signature)[:4]` |
| `Abi.encode_parameters` | `(types: list[str], values: list[Any]) -> bytes` | Standard 32-byte-word ABI encoding |
| `Abi.decode_parameters` | `(types: list[str], data: bytes \| bytearray) -> list[Any]` | Decoded Python values (`int`, `str`, `bool`, `bytes`, `list`) |
| `Abi.encode_function_data` | `(signature: str, values: list[Any]) -> bytes` | 4-byte selector + ABI-encoded arguments (parameter types extracted from `signature`) |
| `Abi.decode_function_data` | `(types: list[str], data: bytes \| bytearray) -> tuple[bytes, list[Any]]` | `(selector_4bytes, decoded_values)` |
| `Abi.encode_packed` | `(types: list[str], values: list[Any]) -> bytes` | Compact non-padded encoding (`abi.encodePacked`) |
| `Abi.estimate_gas` | `(data: bytes) -> int` | Calldata intrinsic gas (`4` per zero byte, `16` per non-zero byte) |

## Example

```python
from voltaire import Abi

selector = Abi.compute_selector("transfer(address,uint256)")
assert selector == bytes.fromhex("a9059cbb")

recipient = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
calldata = Abi.encode_function_data(
    "transfer(address,uint256)",
    [recipient, 1000],
)
assert calldata[:4] == selector
assert len(calldata) == 68

dec_selector, values = Abi.decode_function_data(["address", "uint256"], calldata)
assert dec_selector == selector
assert values[1] == 1000

packed = Abi.encode_packed(["address", "uint256"], [recipient, 1000])
gas = Abi.estimate_gas(calldata)
```
