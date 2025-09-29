import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from guillotine_evm import (
    EVM, BlockInfo, CallType, CallParams, Address, U256
)


def bi() -> BlockInfo:
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
    return bytes([0x7F]) + data + bytes([0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xF3])


def make_runtime_returning_32(val: int) -> bytes:
    ret = (b"\x00" * 31) + bytes([val & 0xff])
    return push32_return_bytes(ret)


def make_init_code_for_runtime(runtime: bytes) -> bytes:
    # Build init code that returns the provided runtime bytes
    runtime_len = len(runtime)
    assert runtime_len < 256
    # Prologue: PUSH1 len, PUSH1 code_off, PUSH1 0, CODECOPY, PUSH1 len, PUSH1 0, RETURN
    prologue = [0x60, runtime_len, 0x60, 0x00, 0x60, 0x00, 0x39, 0x60, runtime_len, 0x60, 0x00, 0xF3]
    code_off = len(prologue)
    prologue[3] = code_off  # fill code offset
    return bytes(prologue) + runtime


def test_call_static_delegate_return_constant():
    evm = EVM(bi())
    caller = "0x" + "aa" * 20
    to = "0x" + "bb" * 20
    evm.set_balance(caller, 10**18)
    code = make_runtime_returning_32(0x2a)
    evm.set_code(to, code)

    for ct in (CallType.CALL, CallType.STATICCALL, CallType.DELEGATECALL):
        res = evm.call(CallParams(
            caller=caller,
            to=to,
            value=0,
            input=b"",
            gas=200_000,
            call_type=ct,
        ))
        assert res.success is True
        assert res.error is None
        assert res.gas_left > 0
        assert res.output == (b"\x00" * 31 + b"\x2a")

    evm.destroy()


def test_simulate_only_allows_call():
    evm = EVM(bi())
    caller = "0x" + "11" * 20
    to = "0x" + "22" * 20
    evm.set_balance(caller, 10**18)
    evm.set_code(to, make_runtime_returning_32(0x2a))

    # CALL works
    sim = evm.simulate(CallParams(
        caller=caller,
        to=to,
        value=0,
        input=b"",
        gas=100_000,
        call_type=CallType.CALL,
    ))
    assert sim.success is True

    # Others should raise (guillotine_simulate supports CALL only)
    with pytest.raises(RuntimeError):
        evm.simulate(CallParams(
            caller=caller,
            to=to,
            value=0,
            input=b"",
            gas=100_000,
            call_type=CallType.DELEGATECALL,
        ))

    evm.destroy()


def test_revert():
    evm = EVM(bi())
    caller = "0x" + "01" * 20
    to = "0x" + "02" * 20
    # PUSH1 00, PUSH1 00, REVERT => revert without data
    revert_code = bytes([0x60, 0x00, 0x60, 0x00, 0xFD])
    evm.set_code(to, revert_code)

    res = evm.call(CallParams(
        caller=caller,
        to=to,
        value=0,
        input=b"",
        gas=100_000,
        call_type=CallType.CALL,
    ))
    assert res.success is False
    # Output may be empty on revert
    assert isinstance(res.output, (bytes, bytearray))

    evm.destroy()


def test_create_and_create2_success():
    evm = EVM(bi())
    caller = "0x" + "0a" * 20
    # runtime returns 0x2a*32
    runtime = make_runtime_returning_32(0x2a)
    init = make_init_code_for_runtime(runtime)

    res = evm.call(CallParams(
        caller=caller,
        to="0x" + "00" * 20,  # ignored for CREATE
        value=0,
        input=init,
        gas=500_000,
        call_type=CallType.CREATE,
    ))
    assert res.success is True
    assert res.gas_left > 0

    # CREATE2 with salt
    res2 = evm.call(CallParams(
        caller=caller,
        to="0x" + "00" * 20,
        value=0,
        input=init,
        gas=500_000,
        call_type=CallType.CREATE2,
        salt=123456789,
    ))
    assert res2.success is True
    assert res2.gas_left > 0

    evm.destroy()


def test_gas_consumption_changes():
    evm = EVM(bi())
    caller = "0x" + "33" * 20
    to = "0x" + "44" * 20

    # Build a small program that does some work then STOP
    body = []
    for _ in range(20):
        body += [0x60, 0x01, 0x60, 0x01, 0x01, 0x50]  # PUSH1 1; PUSH1 1; ADD; POP
    body += [0x00]  # STOP
    code = bytes(body)
    evm.set_code(to, code)

    res = evm.call(CallParams(
        caller=caller,
        to=to,
        value=0,
        input=b"",
        gas=200_000,
        call_type=CallType.CALL,
    ))
    assert res.success is True
    assert 0 < res.gas_left < 200_000

    evm.destroy()


def test_type_variants_and_bytecode_support():
    evm = EVM(bi())
    caller = Address.from_hex("0x" + "55" * 20)
    to = Address.from_hex("0x" + "66" * 20)

    # Use object with to_bytes method in set_code path (no dependency on bytecode FFI)
    runtime = make_runtime_returning_32(0x99)
    class CodeObj:
        def __init__(self, data: bytes):
            self._d = data
        def to_bytes(self) -> bytes:
            return self._d
    evm.set_code(to, CodeObj(runtime))

    # Use U256 for value
    value = U256.from_int(0)

    res = evm.call(CallParams(
        caller=caller,
        to=to,
        value=value,
        input=b"",
        gas=150_000,
        call_type=CallType.CALL,
    ))
    assert res.success is True
    assert res.output == (b"\x00" * 31 + b"\x99")

    evm.destroy()


def test_invalid_call_type_raises_and_set_balance_u256():
    evm = EVM(bi())
    caller = Address.from_hex("0x" + "77" * 20)
    to = Address.from_hex("0x" + "88" * 20)
    evm.set_code(to, make_runtime_returning_32(0x11))

    # set_balance accepts U256
    evm.set_balance(caller, U256.from_int(10**18))

    # invalid call type (simulate invalid integer)
    with pytest.raises(RuntimeError):
        evm.call(CallParams(
            caller=caller,
            to=to,
            value=0,
            input=b"",
            gas=100_000,
            call_type=99,  # invalid
        ))

    evm.destroy()
