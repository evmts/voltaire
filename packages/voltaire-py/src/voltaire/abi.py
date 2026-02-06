"""
ABI encoding and decoding for Ethereum smart contracts.

Provides functions for encoding and decoding data according to the
Ethereum ABI specification.
"""

import ctypes
import json
from ctypes import POINTER, c_char_p, c_size_t, c_uint8
from typing import Any, Union

from voltaire._ffi import get_lib
from voltaire.errors import InvalidInputError, InvalidLengthError


# Error codes from C API
PRIMITIVES_SUCCESS = 0
PRIMITIVES_ERROR_INVALID_HEX = -1
PRIMITIVES_ERROR_INVALID_LENGTH = -2
PRIMITIVES_ERROR_INVALID_INPUT = -5
PRIMITIVES_ERROR_OUT_OF_MEMORY = -4


def _check_error(result: int, context: str = "") -> None:
    """Check C API result and raise appropriate Python exception."""
    if result >= 0:
        return
    if result == PRIMITIVES_ERROR_INVALID_LENGTH:
        raise InvalidLengthError(f"Invalid length{': ' + context if context else ''}")
    if result == PRIMITIVES_ERROR_INVALID_INPUT:
        raise InvalidInputError(f"Invalid input{': ' + context if context else ''}")
    if result == PRIMITIVES_ERROR_INVALID_HEX:
        raise InvalidInputError(f"Invalid hex{': ' + context if context else ''}")
    if result == PRIMITIVES_ERROR_OUT_OF_MEMORY:
        raise MemoryError(f"Out of memory{': ' + context if context else ''}")
    raise InvalidInputError(f"ABI error code {result}{': ' + context if context else ''}")


def _parse_json_value(abi_type: str, value: Any) -> Any:
    """Convert JSON-decoded value to appropriate Python type based on ABI type."""
    # Check arrays FIRST (before uint/int/bytes checks which use startswith)
    if abi_type.endswith("[]"):
        # Dynamic array
        element_type = abi_type[:-2]
        if isinstance(value, list):
            return [_parse_json_value(element_type, v) for v in value]
        return value

    if abi_type == "address":
        # Address comes back as hex string
        return value if isinstance(value, str) else str(value)

    if abi_type.startswith("uint") or abi_type.startswith("int"):
        # Integers come back as strings for large values
        if isinstance(value, str):
            return int(value)
        return int(value)

    if abi_type == "bool":
        if isinstance(value, bool):
            return value
        return value == "true" or value is True

    if abi_type == "string":
        return str(value)

    if abi_type == "bytes" or abi_type.startswith("bytes"):
        # Bytes come back as hex strings
        if isinstance(value, str):
            hex_str = value[2:] if value.startswith("0x") else value
            return bytes.fromhex(hex_str) if hex_str else b""
        return bytes(value)

    # Fallback
    return value


class Abi:
    """ABI encoding and decoding utilities for Ethereum smart contracts."""

    @staticmethod
    def compute_selector(signature: str) -> bytes:
        """
        Compute the 4-byte function selector from a function signature.

        Args:
            signature: Function signature string (e.g., "transfer(address,uint256)")

        Returns:
            4-byte selector

        Example:
            >>> Abi.compute_selector("transfer(address,uint256)")
            b'\\xa9\\x05\\x9c\\xbb'
        """
        lib = get_lib()
        out_selector = (c_uint8 * 4)()

        result = lib.primitives_abi_compute_selector(
            signature.encode("utf-8"),
            ctypes.byref(out_selector),
        )
        _check_error(result, f"computing selector for {signature}")

        return bytes(out_selector)

    @staticmethod
    def decode_parameters(types: list[str], data: Union[bytes, bytearray]) -> list[Any]:
        """
        Decode ABI-encoded parameters back to Python values.

        Args:
            types: List of ABI type strings (e.g., ["uint256", "address"])
            data: ABI-encoded bytes to decode

        Returns:
            List of decoded Python values

        Raises:
            InvalidInputError: If types or data are invalid
            InvalidLengthError: If data is too short for the specified types

        Example:
            >>> data = bytes.fromhex("000000000000000000000000000000000000000000000000000000000000002a")
            >>> Abi.decode_parameters(["uint256"], data)
            [42]
        """
        # Handle empty case
        if not types and not data:
            return []

        if not types:
            return []

        if not data:
            raise InvalidLengthError("Empty data for non-empty parameter types")

        lib = get_lib()

        # Convert data to ctypes array
        data_bytes = bytes(data)
        data_array = (c_uint8 * len(data_bytes))(*data_bytes)

        # Create types JSON
        types_json = json.dumps(types).encode("utf-8")

        # Allocate output buffer (generous size for JSON output)
        buf_size = max(4096, len(data) * 10)
        out_buf = ctypes.create_string_buffer(buf_size)

        result = lib.primitives_abi_decode_parameters(
            ctypes.cast(data_array, POINTER(c_uint8)),
            c_size_t(len(data_bytes)),
            types_json,
            out_buf,
            c_size_t(buf_size),
        )
        _check_error(result, "decoding parameters")

        # Parse JSON output
        json_str = out_buf.value.decode("utf-8")
        if not json_str:
            return []

        decoded = json.loads(json_str)

        # Convert to appropriate Python types
        return [_parse_json_value(types[i], v) for i, v in enumerate(decoded)]

    @staticmethod
    def decode_function_data(
        types: list[str], data: Union[bytes, bytearray]
    ) -> tuple[bytes, list[Any]]:
        """
        Decode function calldata (4-byte selector + ABI-encoded parameters).

        Args:
            types: List of ABI type strings for the function parameters
            data: Function calldata (selector + encoded params)

        Returns:
            Tuple of (selector bytes, list of decoded values)

        Raises:
            InvalidInputError: If types or data are invalid
            InvalidLengthError: If data is too short (< 4 bytes)

        Example:
            >>> calldata = bytes.fromhex("a9059cbb" + "0" * 128)
            >>> selector, values = Abi.decode_function_data(["address", "uint256"], calldata)
        """
        if len(data) < 4:
            raise InvalidLengthError("Data too short for function selector (< 4 bytes)")

        lib = get_lib()

        # Convert data to ctypes array
        data_bytes = bytes(data)
        data_array = (c_uint8 * len(data_bytes))(*data_bytes)

        # Create types JSON
        types_json = json.dumps(types).encode("utf-8")

        # Allocate output buffers
        out_selector = (c_uint8 * 4)()
        buf_size = max(4096, len(data) * 10)
        out_buf = ctypes.create_string_buffer(buf_size)

        result = lib.primitives_abi_decode_function_data(
            ctypes.cast(data_array, POINTER(c_uint8)),
            c_size_t(len(data_bytes)),
            types_json,
            ctypes.byref(out_selector),
            out_buf,
            c_size_t(buf_size),
        )
        _check_error(result, "decoding function data")

        selector = bytes(out_selector)

        # Parse JSON output
        json_str = out_buf.value.decode("utf-8")
        if not json_str or json_str == "[]":
            return selector, []

        decoded = json.loads(json_str)

        # Convert to appropriate Python types
        values = [_parse_json_value(types[i], v) for i, v in enumerate(decoded)]

        return selector, values

    @staticmethod
    def encode_parameters(types: list[str], values: list[Any]) -> bytes:
        """
        ABI-encode parameters given types and values.

        Each parameter is encoded to 32 bytes (ABI word size), with appropriate
        padding based on the type.

        Args:
            types: List of ABI type strings (e.g., ["address", "uint256"])
            values: List of values corresponding to the types

        Returns:
            ABI-encoded bytes

        Raises:
            InvalidInputError: Type/value mismatch or unsupported type

        Example:
            >>> encoded = Abi.encode_parameters(["uint256"], [42])
            >>> len(encoded)
            32
        """
        if len(types) != len(values):
            raise InvalidInputError(
                f"Type/value count mismatch: {len(types)} types, {len(values)} values"
            )

        if len(types) == 0:
            return b""

        lib = get_lib()

        # Convert types and values to JSON format expected by C API
        types_json = json.dumps(types)
        values_json_list = [
            _format_value_for_json(v, t) for t, v in zip(types, values)
        ]
        values_json = json.dumps(values_json_list)

        # Allocate output buffer (generous size: 32 bytes per param + extra for dynamic)
        buf_size = max(len(types) * 32 * 4, 4096)
        out_buf = (c_uint8 * buf_size)()

        result = lib.primitives_abi_encode_parameters(
            types_json.encode("utf-8"),
            values_json.encode("utf-8"),
            ctypes.cast(out_buf, POINTER(c_uint8)),
            buf_size,
        )
        _check_error(result, "encoding parameters")

        # Result is number of bytes written
        return bytes(out_buf[:result])

    @staticmethod
    def encode_function_data(signature: str, values: list[Any]) -> bytes:
        """
        Encode complete function call data (selector + encoded parameters).

        The result is the concatenation of the 4-byte function selector and
        the ABI-encoded parameters.

        Args:
            signature: Function signature (e.g., "transfer(address,uint256)")
            values: List of parameter values

        Returns:
            Function calldata (selector + encoded params)

        Raises:
            InvalidInputError: Type/value mismatch or invalid signature

        Example:
            >>> calldata = Abi.encode_function_data(
            ...     "transfer(address,uint256)",
            ...     ["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 1000]
            ... )
            >>> calldata[:4].hex()
            'a9059cbb'
        """
        lib = get_lib()

        # Extract types from signature for validation and JSON
        types = _extract_types_from_signature(signature)

        if len(types) != len(values):
            raise InvalidInputError(
                f"Type/value count mismatch: {len(types)} types in signature, {len(values)} values"
            )

        # Convert to JSON format
        types_json = json.dumps(types)
        values_json_list = [
            _format_value_for_json(v, t) for t, v in zip(types, values)
        ]
        values_json = json.dumps(values_json_list)

        # Allocate output buffer
        buf_size = max(4 + len(types) * 32 * 4, 4096)
        out_buf = (c_uint8 * buf_size)()

        result = lib.primitives_abi_encode_function_data(
            signature.encode("utf-8"),
            types_json.encode("utf-8"),
            values_json.encode("utf-8"),
            ctypes.cast(out_buf, POINTER(c_uint8)),
            buf_size,
        )
        _check_error(result, "encoding function data")

        return bytes(out_buf[:result])

    @staticmethod
    def encode_packed(types: list[str], values: list[Any]) -> bytes:
        """
        Non-standard packed encoding (like Solidity abi.encodePacked).

        Unlike standard ABI encoding, packed encoding:
        - Does not pad values to 32 bytes
        - Concatenates values directly
        - Does not include length prefixes for dynamic types

        Args:
            types: List of ABI type strings
            values: List of values corresponding to the types

        Returns:
            Packed encoded bytes

        Raises:
            InvalidInputError: Type/value count mismatch

        Example:
            >>> packed = Abi.encode_packed(["uint8", "uint16"], [0x12, 0x3456])
            >>> packed.hex()
            '123456'
        """
        if len(types) != len(values):
            raise InvalidInputError(
                f"Type/value count mismatch: {len(types)} types, {len(values)} values"
            )

        if len(types) == 0:
            return b""

        lib = get_lib()

        # Convert to JSON format
        types_json = json.dumps(types)
        values_json_list = [
            _format_value_for_json(v, t) for t, v in zip(types, values)
        ]
        values_json = json.dumps(values_json_list)

        # Allocate output buffer (packed is typically smaller, but be generous)
        buf_size = max(len(types) * 32 * 2, 4096)
        out_buf = (c_uint8 * buf_size)()

        result = lib.primitives_abi_encode_packed(
            types_json.encode("utf-8"),
            values_json.encode("utf-8"),
            ctypes.cast(out_buf, POINTER(c_uint8)),
            buf_size,
        )
        _check_error(result, "encoding packed")

        return bytes(out_buf[:result])

    @staticmethod
    def estimate_gas(data: bytes) -> int:
        """
        Estimate calldata gas cost based on EVM pricing rules.

        Zero bytes cost 4 gas each, non-zero bytes cost 16 gas each.
        This is useful for estimating transaction costs and comparing
        encoding strategies.

        Args:
            data: Calldata bytes

        Returns:
            Estimated gas cost

        Example:
            >>> Abi.estimate_gas(bytes([0, 0, 0, 1]))  # 3 zeros + 1 non-zero
            28
        """
        if len(data) == 0:
            return 0

        lib = get_lib()

        data_array = (c_uint8 * len(data))(*data)
        result = lib.primitives_abi_estimate_gas(
            ctypes.cast(data_array, POINTER(c_uint8)),
            len(data),
        )

        # Result is the gas estimate (non-negative)
        return int(result)


def _format_value_for_json(value: Any, type_str: str) -> str:
    """Format a Python value as a string for the C API JSON format."""
    if type_str == "bool":
        return "true" if value else "false"
    elif type_str == "address":
        # Ensure 0x prefix for addresses
        if isinstance(value, str):
            return value if value.startswith("0x") else f"0x{value}"
        raise InvalidInputError(f"Address must be a string, got {type(value)}")
    elif type_str.startswith("uint") or type_str.startswith("int"):
        # Convert integers to string (decimal or hex)
        if isinstance(value, int):
            return str(value)
        raise InvalidInputError(f"Integer type requires int value, got {type(value)}")
    elif type_str.startswith("bytes"):
        # bytes1-bytes32 or dynamic bytes
        if isinstance(value, bytes):
            return "0x" + value.hex()
        elif isinstance(value, str):
            return value if value.startswith("0x") else f"0x{value}"
        raise InvalidInputError(f"Bytes type requires bytes or hex string, got {type(value)}")
    elif type_str == "string":
        if isinstance(value, str):
            return value
        raise InvalidInputError(f"String type requires str value, got {type(value)}")
    else:
        # Fallback: try to convert to string
        return str(value)


def _extract_types_from_signature(signature: str) -> list[str]:
    """
    Extract parameter types from a function signature.

    Args:
        signature: Function signature like "transfer(address,uint256)"

    Returns:
        List of type strings like ["address", "uint256"]
    """
    # Find the parameter section between parentheses
    start = signature.find("(")
    end = signature.rfind(")")

    if start == -1 or end == -1 or end <= start:
        raise InvalidInputError(f"Invalid function signature: {signature}")

    params_str = signature[start + 1:end]

    if not params_str:
        return []

    # Split by comma, but be careful with nested types (tuples)
    types = []
    depth = 0
    current = ""

    for char in params_str:
        if char == "(":
            depth += 1
            current += char
        elif char == ")":
            depth -= 1
            current += char
        elif char == "," and depth == 0:
            types.append(current.strip())
            current = ""
        else:
            current += char

    if current.strip():
        types.append(current.strip())

    return types
