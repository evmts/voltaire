import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from guillotine_evm import (
    EVM, CallType, BlockInfo, CallParams, Address, U256, Bytes
)


def make_block_info() -> BlockInfo:
    return BlockInfo(
        number=1,
        timestamp=1,
        gas_limit=30_000_000,
        coinbase="0x" + "00" * 20,
        base_fee=1_000_000_000,
        chain_id=1,
        difficulty=0,
        prev_randao=b"\x00" * 32,
    )


def push32_return_bytes(data: bytes) -> bytes:
    assert len(data) == 32
    # 0x7f <32 bytes> 0x60 00 0x52 0x60 20 0x60 00 0xf3
    return bytes([0x7F]) + data + bytes([0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xF3])


def test_create_and_destroy_evm():
    evm = EVM(make_block_info())
    evm.destroy()


def test_set_balance_and_code_and_call_returns_constant():
    evm = EVM(make_block_info())

    caller = "0x" + "11" * 20
    to = "0x" + "22" * 20

    # set caller balance (not strictly required for this test but exercises FFI)
    evm.set_balance(caller, 10**18)

    # program: return 32 bytes where last byte is 0x2a
    ret = (b"\x00" * 31) + b"\x2a"
    code = push32_return_bytes(ret)
    evm.set_code(to, code)

    params = CallParams(
        caller=caller,
        to=to,
        value=0,
        input=b"",
        gas=100_000,
        call_type=CallType.CALL,
    )

    res = evm.call(params)
    assert res.success is True
    assert res.error is None
    assert res.gas_left > 0
    assert res.output == ret

    # simulate should produce same output without committing state
    sim = evm.simulate(params)
    assert sim.success is True
    assert sim.output == ret

    evm.destroy()


def test_invalid_address_raises():
    evm = EVM(make_block_info())
    to = "0x" + "22" * 20
    with pytest.raises(Exception):
        evm.set_code("0x1234", b"\x00")  # invalid address
    evm.destroy()

