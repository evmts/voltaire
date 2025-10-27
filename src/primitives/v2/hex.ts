const hexSymbol = Symbol('hex');

export type Hex = string & { __brand: typeof hexSymbol };

export class InvalidHexFormatError extends Error {
  constructor(message = 'Invalid hex format: missing 0x prefix') {
    super(message);
    this.name = 'InvalidHexFormatError';
  }
}

export class InvalidHexLengthError extends Error {
  constructor(message = 'Invalid hex length') {
    super(message);
    this.name = 'InvalidHexLengthError';
  }
}

export class InvalidHexCharacterError extends Error {
  constructor(message = 'Invalid hex character') {
    super(message);
    this.name = 'InvalidHexCharacterError';
  }
}

export class OddLengthHexError extends Error {
  constructor(message = 'Odd length hex string') {
    super(message);
    this.name = 'OddLengthHexError';
  }
}

function hexCharToValue(c: string): number | null {
  const code = c.charCodeAt(0);
  if (code >= 48 && code <= 57) return code - 48; // 0-9
  if (code >= 97 && code <= 102) return code - 97 + 10; // a-f
  if (code >= 65 && code <= 70) return code - 65 + 10; // A-F
  return null;
}

export function Hex(value: string): Hex {
  if (value.length < 2 || !value.startsWith('0x')) throw new InvalidHexFormatError();
  for (let i = 2; i < value.length; i++) {
    if (hexCharToValue(value[i]) === null) throw new InvalidHexCharacterError();
  }
  return value as Hex;
}

Hex.isHex = function isHex(value: string): boolean {
  if (value.length < 3 || !value.startsWith('0x')) return false;
  for (let i = 2; i < value.length; i++) {
    if (hexCharToValue(value[i]) === null) return false;
  }
  return true;
};

Hex.fromBytes = function fromBytes(bytes: Uint8Array): Hex {
  const hexChars = '0123456789abcdef';
  let result = '0x';
  for (const byte of bytes) {
    result += hexChars[byte >> 4] + hexChars[byte & 0x0f];
  }
  return result as Hex;
};

Hex.toBytes = function toBytes(hex: Hex): Uint8Array {
  if (!hex.startsWith('0x')) throw new InvalidHexFormatError();
  const hexDigits = hex.slice(2);
  if (hexDigits.length % 2 !== 0) throw new OddLengthHexError();
  const bytes = new Uint8Array(hexDigits.length / 2);
  for (let i = 0; i < hexDigits.length; i += 2) {
    const high = hexCharToValue(hexDigits[i]);
    const low = hexCharToValue(hexDigits[i + 1]);
    if (high === null || low === null) throw new InvalidHexCharacterError();
    bytes[i / 2] = high * 16 + low;
  }
  return bytes;
};

Hex.concat = function concat(...hexes: Hex[]): Hex {
  return Hex.fromBytes(new Uint8Array(hexes.flatMap(h => Array.from(Hex.toBytes(h)))));
};

Hex.slice = function slice(hex: Hex, start: number, end?: number): Hex {
  const bytes = Hex.toBytes(hex);
  return Hex.fromBytes(bytes.slice(start, end));
};

Hex.size = function size(hex: Hex): number {
  return (hex.length - 2) / 2;
};

Hex.pad = function pad(hex: Hex, targetSize: number): Hex {
  const bytes = Hex.toBytes(hex);
  if (bytes.length >= targetSize) return Hex.fromBytes(bytes);
  const padded = new Uint8Array(targetSize);
  padded.set(bytes, targetSize - bytes.length);
  return Hex.fromBytes(padded);
};

Hex.trim = function trim(hex: Hex): Hex {
  const bytes = Hex.toBytes(hex);
  let start = 0;
  while (start < bytes.length && bytes[start] === 0) start++;
  return Hex.fromBytes(bytes.slice(start));
};
