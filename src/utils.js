class ValidationUtility {
  static validateType(value, type) {
    if (typeof value !== type) {
      throw new TypeError(`Expected ${type}, got ${typeof value}`);
    }
    return value;
  }

  static validateDate(value) {
    if (!(value instanceof Date)) {
      throw new TypeError(`Expected instance of Date, got ${typeof value}`);
    }
    return value;
  }

  static validateArray(value, constructor) {
    if (!Array.isArray(value) || !value.every(item => item instanceof constructor)) {
      throw new TypeError(`Expected an array of ${constructor.name} instances`);
    }
    return value;
  }
}

module.exports = {
  ValidationUtility
};