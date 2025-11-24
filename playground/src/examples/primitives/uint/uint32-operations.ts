import * as Uint32 from "../../../primitives/Uint32/index.js";
const timestamp1 = Uint32.fromNumber(1609459200); // 2021-01-01 00:00:00 UTC
const timestamp2 = Uint32.fromNumber(1640995200); // 2022-01-01 00:00:00 UTC
const secondsInYear = Uint32.fromNumber(31536000);
// IPv4: 192.168.1.1 = 0xC0A80101
const localhost = Uint32.fromHex("0x7f000001"); // 127.0.0.1
const privateNet = Uint32.fromHex("0xc0a80101"); // 192.168.1.1
const googleDns = Uint32.fromHex("0x08080808"); // 8.8.8.8
const cloudflare = Uint32.fromHex("0x01010101"); // 1.1.1.1

function ipToString(ip: ReturnType<typeof Uint32.from>): string {
	const n = Uint32.toNumber(ip);
	return [
		(n >>> 24) & 0xff,
		(n >>> 16) & 0xff,
		(n >>> 8) & 0xff,
		n & 0xff,
	].join(".");
}
const kb = Uint32.fromNumber(1024);
const mb = Uint32.fromNumber(1024 * 1024);
const fileSize1 = Uint32.fromNumber(2560000); // ~2.4 MB
const fileSize2 = Uint32.fromNumber(5242880); // 5 MB
const red = Uint32.fromHex("0xff0000ff");
const green = Uint32.fromHex("0x00ff00ff");
const blue = Uint32.fromHex("0x0000ffff");
const transparent = Uint32.fromHex("0x00000000");
const base = Uint32.fromNumber(2);
const exp = Uint32.fromNumber(10);
const flags = Uint32.fromNumber(0b00001111);
const mask = Uint32.fromNumber(0b11110000);
