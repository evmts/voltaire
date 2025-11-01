export class InvalidHexFormatError extends Error {
  constructor(message = "Invalid hex format for address") {
    super(message);
    this.name = "InvalidHexFormatError";
  }
}

export class InvalidHexStringError extends Error {
  constructor(message = "Invalid hex string") {
    super(message);
    this.name = "InvalidHexStringError";
  }
}

export class InvalidAddressLengthError extends Error {
  constructor(message = "Invalid address length") {
    super(message);
    this.name = "InvalidAddressLengthError";
  }
}

export class InvalidValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidValueError";
  }
}

export class NotImplementedError extends Error {
  constructor(message = "Not implemented") {
    super(message);
    this.name = "NotImplementedError";
  }
}
