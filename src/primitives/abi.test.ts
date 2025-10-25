import { describe, test, expect } from 'bun:test';
import {
  AbiType,
  StateMutability,
  encodeAbiParameters,
  decodeAbiParameters,
  encodeFunctionData,
  decodeFunctionData,
  encodeEventTopics,
  encodePacked,
  computeSelector,
  createFunctionSignature,
  estimateGasForData,
  uint256Value,
  boolValue,
  addressValue,
  stringValue,
  bytesValue,
  type AbiParameter,
  type FunctionDefinition,
} from './abi';

/**
 * Test helpers
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

describe('ABI Encoding - Basic Types', () => {
  test('encode uint256', () => {
    const params: AbiParameter[] = [{ type: AbiType.Uint256 }];
    const values = [uint256Value(69)];
    const result = encodeAbiParameters(params, values);
    // uint256(69) should be padded to 32 bytes
    expect(bytesToHex(result)).toBe('0x' + '0'.repeat(62) + '45');
  });

  test('encode bool true', () => {
    const params: AbiParameter[] = [{ type: AbiType.Bool }];
    const values = [boolValue(true)];
    const result = encodeAbiParameters(params, values);
    expect(bytesToHex(result)).toBe('0x' + '0'.repeat(62) + '01');
  });

  test('encode bool false', () => {
    const params: AbiParameter[] = [{ type: AbiType.Bool }];
    const values = [boolValue(false)];
    const result = encodeAbiParameters(params, values);
    expect(bytesToHex(result)).toBe('0x' + '0'.repeat(64));
  });

  test('encode address', () => {
    const params: AbiParameter[] = [{ type: AbiType.Address }];
    const address = '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4';
    const values = [addressValue(address)];
    const result = encodeAbiParameters(params, values);
    // Address should be left-padded to 32 bytes
    expect(bytesToHex(result)).toBe('0x' + '0'.repeat(24) + address.slice(2).toLowerCase());
  });

  test('encode bytes32', () => {
    const params: AbiParameter[] = [{ type: AbiType.Bytes32 }];
    const bytes = hexToBytes('0x' + '42'.repeat(32));
    const values = [bytesValue(bytes)];
    const result = encodeAbiParameters(params, values);
    expect(bytesToHex(result)).toBe('0x' + '42'.repeat(32));
  });

  test('encode multiple fixed types', () => {
    const params: AbiParameter[] = [
      { type: AbiType.Uint256 },
      { type: AbiType.Address },
      { type: AbiType.Bool },
    ];
    const values = [
      uint256Value(100),
      addressValue('0x5B38Da6a701c568545dCfcB03FcB875f56beddC4'),
      boolValue(true),
    ];
    const result = encodeAbiParameters(params, values);
    // Each parameter is 32 bytes, so total is 96 bytes
    expect(result.length).toBe(96);
  });
});

describe('ABI Encoding - Dynamic Types', () => {
  test('encode string', () => {
    const params: AbiParameter[] = [{ type: AbiType.String }];
    const values = [stringValue('hello')];
    const result = encodeAbiParameters(params, values);
    // Dynamic type: offset(32) + length(32) + data(padded to 32)
    expect(result.length).toBe(96);
  });

  test('encode bytes', () => {
    const params: AbiParameter[] = [{ type: AbiType.Bytes }];
    const bytes = hexToBytes('0x123456');
    const values = [bytesValue(bytes)];
    const result = encodeAbiParameters(params, values);
    // Dynamic type: offset(32) + length(32) + data(padded to 32)
    expect(result.length).toBe(96);
  });

  test('encode array', () => {
    const params: AbiParameter[] = [{ type: AbiType.Uint256Array }];
    const values = [[uint256Value(1), uint256Value(2), uint256Value(3)]];
    const result = encodeAbiParameters(params, values);
    // offset(32) + length(32) + 3*item(32 each) = 160 bytes
    expect(result.length).toBe(160);
  });
});

describe('ABI Decoding', () => {
  test('decode uint256', () => {
    const params: AbiParameter[] = [{ type: AbiType.Uint256 }];
    const data = hexToBytes('0x' + '0'.repeat(62) + '45');
    const result = decodeAbiParameters(params, data);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(69n);
  });

  test('decode bool', () => {
    const params: AbiParameter[] = [{ type: AbiType.Bool }];
    const dataTrue = hexToBytes('0x' + '0'.repeat(62) + '01');
    const resultTrue = decodeAbiParameters(params, dataTrue);
    expect(resultTrue[0]).toBe(true);

    const dataFalse = hexToBytes('0x' + '0'.repeat(64));
    const resultFalse = decodeAbiParameters(params, dataFalse);
    expect(resultFalse[0]).toBe(false);
  });

  test('decode address', () => {
    const params: AbiParameter[] = [{ type: AbiType.Address }];
    const address = '5B38Da6a701c568545dCfcB03FcB875f56beddC4';
    const data = hexToBytes('0x' + '0'.repeat(24) + address);
    const result = decodeAbiParameters(params, data);
    expect(result[0]).toBe('0x' + address);
  });

  test('decode multiple parameters', () => {
    const params: AbiParameter[] = [
      { type: AbiType.Uint256 },
      { type: AbiType.Bool },
      { type: AbiType.Address },
    ];
    // Encode known values
    const data = new Uint8Array(96);
    // uint256(100) at offset 0
    data[31] = 100;
    // bool(true) at offset 32
    data[63] = 1;
    // address at offset 64
    const addressBytes = hexToBytes('0x5B38Da6a701c568545dCfcB03FcB875f56beddC4');
    data.set(addressBytes, 76);

    const result = decodeAbiParameters(params, data);
    expect(result.length).toBe(3);
    expect(result[0]).toBe(100n);
    expect(result[1]).toBe(true);
  });
});

describe('ABI Function Encoding', () => {
  test('compute selector for transfer', () => {
    const signature = 'transfer(address,uint256)';
    const selector = computeSelector(signature);
    expect(selector.length).toBe(4);
    // keccak256("transfer(address,uint256)").slice(0, 4) = 0xa9059cbb
    expect(bytesToHex(selector)).toBe('0xa9059cbb');
  });

  test('compute selector for balanceOf', () => {
    const signature = 'balanceOf(address)';
    const selector = computeSelector(signature);
    expect(selector.length).toBe(4);
    // keccak256("balanceOf(address)").slice(0, 4) = 0x70a08231
    expect(bytesToHex(selector)).toBe('0x70a08231');
  });

  test('create function signature', () => {
    const definition: FunctionDefinition = {
      name: 'transfer',
      inputs: [
        { type: AbiType.Address },
        { type: AbiType.Uint256 },
      ],
    };
    const signature = createFunctionSignature(definition);
    expect(signature).toBe('transfer(address,uint256)');
  });

  test('encode ERC20 transfer function', () => {
    const definition: FunctionDefinition = {
      name: 'transfer',
      inputs: [
        { name: 'to', type: AbiType.Address },
        { name: 'amount', type: AbiType.Uint256 },
      ],
    };
    const args = [
      addressValue('0x5B38Da6a701c568545dCfcB03FcB875f56beddC4'),
      uint256Value(1000),
    ];
    const result = encodeFunctionData(definition, args);
    // 4-byte selector + 64 bytes of parameters
    expect(result.length).toBe(68);
    // First 4 bytes should be selector
    expect(bytesToHex(result.slice(0, 4))).toBe('0xa9059cbb');
  });

  test('decode function data', () => {
    const definition: FunctionDefinition = {
      name: 'transfer',
      inputs: [
        { name: 'to', type: AbiType.Address },
        { name: 'amount', type: AbiType.Uint256 },
      ],
    };
    // Selector + encoded parameters
    const selector = hexToBytes('0xa9059cbb');
    const params = new Uint8Array(64);
    // Address at offset 0
    const addressBytes = hexToBytes('0x5B38Da6a701c568545dCfcB03FcB875f56beddC4');
    params.set(addressBytes, 12);
    // Amount (1000) at offset 32
    params[63] = 232; // 1000 & 0xff
    params[62] = 3;   // (1000 >> 8) & 0xff

    const data = new Uint8Array(68);
    data.set(selector, 0);
    data.set(params, 4);

    const result = decodeFunctionData(definition, data);
    expect(result.length).toBe(2);
  });
});

describe('ABI Event Encoding', () => {
  test('encode event topics for Transfer', () => {
    const definition: FunctionDefinition = {
      name: 'Transfer',
      inputs: [
        { name: 'from', type: AbiType.Address, indexed: true },
        { name: 'to', type: AbiType.Address, indexed: true },
        { name: 'value', type: AbiType.Uint256, indexed: false },
      ],
    };
    const values = [
      addressValue('0x5B38Da6a701c568545dCfcB03FcB875f56beddC4'),
      addressValue('0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2'),
    ];
    const topics = encodeEventTopics(definition, values);
    // Event signature + 2 indexed parameters = 3 topics
    expect(topics.length).toBe(3);
    // Each topic is 32 bytes
    expect(topics[0].length).toBe(32);
  });
});

describe('ABI Packed Encoding', () => {
  test('encode packed uint256', () => {
    const params: AbiParameter[] = [{ type: AbiType.Uint256 }];
    const values = [uint256Value(69)];
    const result = encodePacked(params, values);
    // Packed encoding for uint256 is still 32 bytes but no padding between items
    expect(result.length).toBe(32);
  });

  test('encode packed multiple values', () => {
    const params: AbiParameter[] = [
      { type: AbiType.Uint8 },
      { type: AbiType.Uint8 },
      { type: AbiType.Address },
    ];
    const values = [1, 2, addressValue('0x5B38Da6a701c568545dCfcB03FcB875f56beddC4')];
    const result = encodePacked(params, values);
    // uint8(1 byte) + uint8(1 byte) + address(20 bytes) = 22 bytes
    expect(result.length).toBe(22);
  });

  test('encode packed string', () => {
    const params: AbiParameter[] = [{ type: AbiType.String }];
    const values = [stringValue('hello')];
    const result = encodePacked(params, values);
    // Packed encoding has no length prefix, just raw bytes
    expect(result.length).toBe(5);
    expect(new TextDecoder().decode(result)).toBe('hello');
  });
});

describe('ABI Gas Estimation', () => {
  test('estimate gas for empty calldata', () => {
    const data = new Uint8Array(0);
    const gas = estimateGasForData(data);
    expect(gas).toBe(0);
  });

  test('estimate gas for non-zero bytes', () => {
    const data = new Uint8Array([0x01, 0x02, 0x03]);
    const gas = estimateGasForData(data);
    // Each non-zero byte costs 16 gas
    expect(gas).toBe(48);
  });

  test('estimate gas for zero bytes', () => {
    const data = new Uint8Array([0x00, 0x00, 0x00]);
    const gas = estimateGasForData(data);
    // Each zero byte costs 4 gas
    expect(gas).toBe(12);
  });

  test('estimate gas for mixed bytes', () => {
    const data = new Uint8Array([0x00, 0x01, 0x00, 0x02]);
    const gas = estimateGasForData(data);
    // 2 zero bytes (8 gas) + 2 non-zero bytes (32 gas) = 40 gas
    expect(gas).toBe(40);
  });
});

describe('ABI Helper Functions', () => {
  test('uint256Value from number', () => {
    const value = uint256Value(100);
    expect(value).toBe(100n);
  });

  test('uint256Value from bigint', () => {
    const value = uint256Value(1000000000000000000n);
    expect(value).toBe(1000000000000000000n);
  });

  test('uint256Value from hex string', () => {
    const value = uint256Value('0x64');
    expect(value).toBe(100n);
  });

  test('boolValue', () => {
    expect(boolValue(true)).toBe(true);
    expect(boolValue(false)).toBe(false);
  });

  test('addressValue normalizes to checksum', () => {
    const address = addressValue('0x5b38da6a701c568545dcfcb03fcb875f56beddc4');
    expect(address.startsWith('0x')).toBe(true);
    expect(address.length).toBe(42);
  });

  test('stringValue', () => {
    const str = stringValue('hello world');
    expect(str).toBe('hello world');
  });

  test('bytesValue from Uint8Array', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const result = bytesValue(bytes);
    expect(result).toEqual(bytes);
  });

  test('bytesValue from hex string', () => {
    const result = bytesValue('0x010203');
    expect(result).toEqual(new Uint8Array([1, 2, 3]));
  });
});

describe('ABI Real Contract Examples', () => {
  test('ERC20 approve function', () => {
    const definition: FunctionDefinition = {
      name: 'approve',
      inputs: [
        { name: 'spender', type: AbiType.Address },
        { name: 'amount', type: AbiType.Uint256 },
      ],
      stateMutability: StateMutability.Nonpayable,
    };
    const args = [
      addressValue('0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2'),
      uint256Value(10000),
    ];
    const result = encodeFunctionData(definition, args);
    expect(result.length).toBe(68); // 4-byte selector + 64 bytes params
  });

  test('Uniswap V2 swap function', () => {
    const definition: FunctionDefinition = {
      name: 'swapExactTokensForTokens',
      inputs: [
        { name: 'amountIn', type: AbiType.Uint256 },
        { name: 'amountOutMin', type: AbiType.Uint256 },
        { name: 'path', type: AbiType.AddressArray },
        { name: 'to', type: AbiType.Address },
        { name: 'deadline', type: AbiType.Uint256 },
      ],
    };
    const signature = createFunctionSignature(definition);
    expect(signature).toBe('swapExactTokensForTokens(uint256,uint256,address[],address,uint256)');
  });
});
