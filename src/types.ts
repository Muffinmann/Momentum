
export type Value = string | number | boolean | string[] | number[] | boolean[] | null;
export type FieldValue = string | number | boolean | string[] | number[] | boolean[] | null;
export type FieldError = string;
export type FieldModel = {
  type: string;
  key: string;
  value: FieldValue;
  error: FieldError | null;
  isVisible: boolean;
  required: boolean;
  validation: string;
  colorTheme: string;
  toolTip: string;
}

export type FactContextListener = (from: string, v: Value) => void
export type AvailableModifiers = 'isVisible' | 'required' | 'value'
export type FieldModelKeys = Exclude<keyof FieldModel, 'key' | 'type' | 'error'>
export type SettledModifier = {
  key: string
  // tag: string
  result: Value
  priority: number
}

