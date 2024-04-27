import { isUndefinedOrNull } from '../utils';


type CommonPrimitive = string | number | boolean | undefined | null;
type BasicOperator =
| '+'
| '-'
| '*'
| '/'
| '>'
| '<'
| '!'
| '!!'
| '||'
| '==='
| '!=='
| 'min'
| 'max';

type Operator =
| BasicOperator
| 'some'
| 'every'
| 'if'
| 'and'
| 'or'
| 'var';

type Operand = CommonPrimitive | Logic;

type NumberOrVar = number | { var: string } | Logic;

export type Logic =
| { '+': NumberOrVar[] }
| { '*': NumberOrVar[] }
| { '<': NumberOrVar[] }
| { '>': NumberOrVar[] }
| { '-': [NumberOrVar, NumberOrVar] }
| { '/': [NumberOrVar, NumberOrVar] }
| { '!': Operand }
| { '!!': Operand }
| { '===': [Operand, Operand] }
| { '!==': [Operand, Operand] }
| { '!!': Operand }
| { '||': [Operand, Operand] }
| { 'min': number[] }
| { 'max': number[] }
| { 'some': [Operand[], Logic] }
| { 'every': [Operand[], Logic] }
| { 'and': Operand[] }
| { 'or': Operand[] }
| { 'if': Operand[] }
| { 'var': string };


const BASIC_OPERATION: { [K in BasicOperator]: Function } = {
  '+': (...xn: number[]) => xn.reduce((prev, crr) => prev + crr, 0),
  '-': (...xn: number[]) => xn[0] - xn[1],
  '*': (...xn: number[]) => xn.reduce((prev, crr) => prev * crr, 1),
  '/': (...xn: number[]) => xn[0] / xn[1],
  '!': (...xn: CommonPrimitive[]) => !xn[0],
  '!!': (...xn: CommonPrimitive[]) => !!xn[0],
  '===': (...xn: CommonPrimitive[]) => (isUndefinedOrNull(xn[0]) && isUndefinedOrNull(xn[1]) ? true : xn[0] === xn[1]),
  '!==': (...xn: CommonPrimitive[]) => (isUndefinedOrNull(xn[0]) && isUndefinedOrNull(xn[1]) ? false : xn[0] !== xn[1]),
  '<': (...xn: number[]) => {
    for (let i = 0; i < xn.length - 1; i++) {
      const current = xn[i];
      const next = xn[i + 1];
      if (Number.isNaN(current) || Number.isNaN(next)) {
        return false;
      }
      if (current >= next) {
        return false;
      }
    }
    return true;
  },
  '>': (...xn: number[]) => {
    for (let i = 0; i < xn.length - 1; i++) {
      const current = xn[i];
      const next = xn[i + 1];
      if (Number.isNaN(current) || Number.isNaN(next)) {
        return false;
      }
      if (current <= next) {
        return false;
      }
    }
    return true;
  },
  '||': (...xn: CommonPrimitive[]) => xn[0] || xn[1],
  max: Math.max,
  min: Math.min,
};

const AVAILABLE_OPERATORS = [
  ...Object.keys(BASIC_OPERATION),
  'some', 'every', 'if', 'and', 'or', 'var',
];

const getOperator = (logic: Logic): Operator => Object.keys(logic)[0] as Operator;

const getOperand = (logic: Logic): Operand[] => {
  const operand = logic[getOperator(logic) as keyof Logic];
  if (typeof operand === 'undefined') {
    throw new Error('Unknown operator or operand is undefined');
  }
  return Array.isArray(operand) ? operand : [operand];
};

/**
 * Checks whether the given value is of type 'string', 'number', 'boolean', 'undefined' or 'null'
 */
export const isCommonPrimitive = (val: unknown): val is CommonPrimitive => (typeof val !== 'object' && typeof val !== 'function') || val === null;

export const isLogic = (val: unknown): val is Logic => (typeof val === 'object'
    && !Array.isArray(val)
    && val !== null
    && val !== undefined
    && Object.keys(val).length === 1)
    && AVAILABLE_OPERATORS.includes(Object.keys(val)[0]);

export const resolveLogic = (logic: Logic | Operand | Operand[], data: Record<string, any> = {}): CommonPrimitive | CommonPrimitive[] => {
  if (Array.isArray(logic)) {
    const res = logic.map((l) => resolveLogic(l, data)) as CommonPrimitive[];
    return res;
  }

  if (!isLogic(logic)) {
    return logic;
  }

  const operator = getOperator(logic);
  const operand = getOperand(logic);

  if (operator === 'if') {
    for (let i = 0; i < operand.length - 1; i += 2) {
      if (resolveLogic(operand[i], data)) {
        return resolveLogic(operand[i + 1], data);
      }
    }
    return resolveLogic(operand[operand.length - 1], data);
  }

  if (operator === 'and') {
    for (let i = 0; i < operand.length; i++) {
      const value = resolveLogic(operand[i], data);
      if (!value) {
        return false;
      }
    }
    return true;
  }

  if (operator === 'or') {
    for (let i = 0; i < operand.length; i++) {
      const value = resolveLogic(operand[i], data);
      if (value) {
        return true;
      }
    }
    return false;
  }

  if (operator === 'some') {
    const value = resolveLogic(operand[0], data);
    if (Array.isArray(value)) {
      return value.some((v) => resolveLogic(operand[1], { ...data, $: v }));
    }
    return Boolean(value);
  }

  if (operator === 'every') {
    const value = resolveLogic(operand[0], data);
    if (Array.isArray(value)) {
      return value.every((v) => resolveLogic(operand[1], { ...data, $: v }));
    }
    return Boolean(value);
  }

  if (operator === 'var') {
    const path = operand[0] as string;
    const keys = path.split('.');
    let value = data;
    while (keys.length) {
      const key = keys.shift();
      if (key) {
        value = value[key];
        if (!value) {
          break;
        }
      }
    }
    return value as unknown as CommonPrimitive;
  }


  if (operator in BASIC_OPERATION) {
    const settledOperands = operand.map((o) => resolveLogic(o, data)) as CommonPrimitive[];
    if (operator === '!' || operator === '!!' || operator === '!==' || operator === '===') {
      return BASIC_OPERATION[operator](...settledOperands);
    }
    const transformedOperands = settledOperands.map(Number) as number[];
    return BASIC_OPERATION[operator](...transformedOperands);
  }

  throw new Error(`Unknown operator ${operator}`);
};


// a dependency is an object of the shape: {var: string} in the Logic expression
export const scanDependency = (logic: Logic | Operand | Operand[], onDepFound: (dep: string) => void) => {
  if (Array.isArray(logic)) {
    logic.forEach((l) => scanDependency(l, onDepFound));
  }

  if (!isLogic(logic)) {
    return;
  }

  const operator = getOperator(logic);

  const operands = getOperand(logic);

  if (operator === 'var') {
    onDepFound(operands[0] as string);
  } else {
    operands.forEach((operand) => scanDependency(operand, onDepFound));
  }
};

export const collectDependencies = (logic: Logic | Operand | Operand[]) => {
  const deps = new Set<string>();
  scanDependency(logic, (dep) => deps.add(dep));
  if (deps.has('$')) {
    deps.delete('$');
  }
  return Array.from(deps);
};
