import { Uint16 } from "@tevm/voltaire";
const httpPort = Uint16.fromNumber(80);
const httpsPort = Uint16.fromNumber(443);
const customPort = Uint16.fromNumber(8080);
// RGB565: 5 bits red, 6 bits green, 5 bits blue
const red = Uint16.fromNumber(0b1111100000000000); // Pure red
const green = Uint16.fromNumber(0b0000011111100000); // Pure green
const blue = Uint16.fromNumber(0b0000000000011111); // Pure blue
const white = Uint16.fromNumber(0b1111111111111111); // White
const silence = Uint16.fromNumber(32768); // Mid-point (signed 0)
const maxAmplitude = Uint16.MAX;
const minAmplitude = Uint16.MIN;
const a = Uint16.fromNumber(1000);
const b = Uint16.fromNumber(500);
const color = Uint16.fromNumber(0b1010101111001100);
const redMask = Uint16.fromNumber(0b1111100000000000);
const greenMask = Uint16.fromNumber(0b0000011111100000);
const blueMask = Uint16.fromNumber(0b0000000000011111);
const port1 = Uint16.fromNumber(3000);
const port2 = Uint16.fromNumber(8080);
