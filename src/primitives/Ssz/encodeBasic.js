/**
 * @description Encodes basic types using SSZ serialization
 * @param {number | bigint | boolean} value - Value to encode
 * @param {string} type - Type: 'uint8', 'uint16', 'uint32', 'uint64', 'uint256', 'bool'
 * @returns {Uint8Array} SSZ encoded bytes
 */
export function encodeBasic(value, type) {
	switch (type) {
		case "uint8": {
			const buf = new Uint8Array(1);
			buf[0] = Number(value);
			return buf;
		}
		case "uint16": {
			const buf = new Uint8Array(2);
			const view = new DataView(buf.buffer);
			view.setUint16(0, Number(value), true); // little-endian
			return buf;
		}
		case "uint32": {
			const buf = new Uint8Array(4);
			const view = new DataView(buf.buffer);
			view.setUint32(0, Number(value), true); // little-endian
			return buf;
		}
		case "uint64": {
			const buf = new Uint8Array(8);
			const view = new DataView(buf.buffer);
			view.setBigUint64(0, BigInt(value), true); // little-endian
			return buf;
		}
		case "uint256": {
			const buf = new Uint8Array(32);
			let val = BigInt(value);
			for (let i = 0; i < 32; i++) {
				buf[i] = Number(val & 0xffn);
				val >>= 8n;
			}
			return buf;
		}
		case "bool": {
			const buf = new Uint8Array(1);
			buf[0] = value ? 1 : 0;
			return buf;
		}
		default:
			throw new Error(`Unsupported type: ${type}`);
	}
}

/**
 * @description Decodes basic types from SSZ serialization
 * @param {Uint8Array} bytes - SSZ encoded bytes
 * @param {string} type - Type: 'uint8', 'uint16', 'uint32', 'uint64', 'uint256', 'bool'
 * @returns {number | bigint | boolean} Decoded value
 */
export function decodeBasic(bytes, type) {
	switch (type) {
		case "uint8": {
			if (bytes.length !== 1) throw new Error("Invalid length for uint8");
			return bytes[0];
		}
		case "uint16": {
			if (bytes.length !== 2) throw new Error("Invalid length for uint16");
			const view = new DataView(
				bytes.buffer,
				bytes.byteOffset,
				bytes.byteLength,
			);
			return view.getUint16(0, true); // little-endian
		}
		case "uint32": {
			if (bytes.length !== 4) throw new Error("Invalid length for uint32");
			const view = new DataView(
				bytes.buffer,
				bytes.byteOffset,
				bytes.byteLength,
			);
			return view.getUint32(0, true); // little-endian
		}
		case "uint64": {
			if (bytes.length !== 8) throw new Error("Invalid length for uint64");
			const view = new DataView(
				bytes.buffer,
				bytes.byteOffset,
				bytes.byteLength,
			);
			return view.getBigUint64(0, true); // little-endian
		}
		case "uint256": {
			if (bytes.length !== 32) throw new Error("Invalid length for uint256");
			let result = 0n;
			for (let i = 31; i >= 0; i--) {
				result = (result << 8n) | BigInt(bytes[i]);
			}
			return result;
		}
		case "bool": {
			if (bytes.length !== 1) throw new Error("Invalid length for bool");
			return bytes[0] !== 0;
		}
		default:
			throw new Error(`Unsupported type: ${type}`);
	}
}
