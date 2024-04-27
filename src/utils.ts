export type Primitive =
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint;

export type EmptyObject = { [K in string | number]: never };

export const isObject = (val: unknown): val is object => Object.prototype.toString.call(val) === '[object Object]';

export const isPrimitive = (v: unknown): v is Primitive => {
  if (v === null || v === undefined) {
    return true;
  }
  if (Array.isArray(v)) {
    return false;
  }
  if (typeof v === 'function') {
    return false;
  }
  return !(Object.prototype.toString.call(v) === '[object Object]');
};

export const isUndefinedOrNull = (v: unknown): v is null | undefined => v === undefined || v === null;

export const isEmptyObject = (value: unknown): value is EmptyObject => Object.prototype.toString.call(value) === '[object Object]' && Object.keys(value as object).length === 0;