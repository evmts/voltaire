export class AbiEncodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbiEncodingError";
  }
}

export class AbiDecodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbiDecodingError";
  }
}

export class AbiParameterMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbiParameterMismatchError";
  }
}

export class AbiItemNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbiItemNotFoundError";
  }
}

export class AbiInvalidSelectorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbiInvalidSelectorError";
  }
}