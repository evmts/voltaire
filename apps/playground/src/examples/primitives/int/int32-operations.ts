import { Int32 } from "@tevm/voltaire";
const lat_sf = Int32.fromNumber(37774929); // San Francisco: 37.774929°N
const lon_sf = Int32.fromNumber(-122419416); // -122.419416°W
const lat_nyc = Int32.fromNumber(40712776); // New York: 40.712776°N
const lon_nyc = Int32.fromNumber(-74005974); // -74.005974°W
const lat_delta = Int32.minus(lat_nyc, lat_sf);
const lon_delta = Int32.minus(lon_nyc, lon_sf);
const epoch = Int32.fromNumber(0); // 1970-01-01
const y2k = Int32.fromNumber(946684800); // 2000-01-01
const recent = Int32.fromNumber(1700000000); // 2023-11-14
const delta_days = Int32.dividedBy(Int32.minus(recent, y2k), 86400);
const base_id = Int32.fromNumber(1000000);
const offset_a = Int32.fromNumber(-50);
const offset_b = Int32.fromNumber(100);
const price = Int32.fromNumber(9999); // $99.99
const discount = Int32.fromNumber(-1500); // -$15.00 discount
const tax = Int32.fromNumber(800); // $8.00 tax
const total = Int32.plus(Int32.plus(price, discount), tax);
