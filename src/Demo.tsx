import { ReactElement, ReactNode } from "react"


type Logic = object | boolean | string | number | ((...args: unknown[]) => unknown) | Logic[]

type FieldDefinition = {
  key: string,
  unique: boolean, // context indenpendent
  inputType: 'text' | 'number' | 'radiogroup' | 'checkbox',
  // keepValue: boolean,  # Might be not necessary?
  rules: Partial<{
    isVisible: Logic,
    required: Logic,
    value: Logic
  }>
}

interface RegisterMember {
    factory: Function;
    singleton: boolean;
    instance?: {};
}

interface iClass<T> {
  new(...args: unknown[]): T
}

class Register {
    private container: Map<string, RegisterMember>;

    constructor() {
        this.container = new Map<string, RegisterMember>();
    }

    bind<T>(key: string, fn: iClass<T>){
      const factory = () => new fn()
      this.container.set(key, {factory, singleton: true})
    }

    use(namespace: string) {
      const item = this.container.get(namespace);
      if (item !== undefined) {
          if (item.singleton && !item.instance) {
            item.instance = item.factory();
          }
          return item.singleton ? item.instance : item.factory();
        } else {
          throw new Error('Factory method not found');
        }
    }
}



class Field {
  key: string;

  fieldValue: FieldValue;

  context: TheContext;

  // rules: FieldRule[];
  rules: Rule[];

  hidden: boolean;

  constructor({context, key, fieldValue, rules}: {context: Field['context'], key: Field['key'], fieldValue: Field['fieldValue'], rules: Field['rules']}) {
    this.context = context;
    this.key = key;
    this.fieldValue = fieldValue;
    this.rules = rules
    this.hidden = false
  }

  set value(v: FieldValue) {
    this.fieldValue = v
    this.context.broadcastChange(this.key, this.fieldValue)
  }
  
}

class TheContext {
  id: string;

  members: Field[]

  memberKeys: Set<string>

  constructor(id: string){
    this.id = id;
    this.members = []
    this.memberKeys = new Set()
  }

  broadcastChange(k: string, v: FieldValue){}

  includeMember(f: FieldDefinition){
    if (!this.memberKeys.has(f.key)) {
      this.members.push(new Field(f))
    } else {
      const existingField = this.members.find((field) => field.key === f.key) 
      if (existingField.unique) {}
      console.log("Key %s already exists.", f.key)
    }
  } 

  excludeMember(k: string){
    if (this.memberKeys.has(k)) {
      this.members = this.members.filter((m) => m.key !== k)
    } else {
      console.log("%s does not exist in the context", k)
    }
  }

  init(){} 
}

type RuleType = 'valueValidation' | 'onFieldChange' | 'onFieldFocus' | 'visibility' | 'onBroadcast'

type FieldRule = {
  type: RuleType,
  symbol: string, /** symbol to display when rule is applied, for example an asterisk "*" when the rule makes the field "required" */
  priority: number, /** priority when two rules have conflict */
  activation: Logic,
  action: Logic
}

type Rule = {
  isVisible: Logic,
  calculateValue: Logic,
  required: Logic,
  hiddenOptions: string[] | number[],
}

type FieldValue = string | number | boolean | null | undefined | string[] | number[] | boolean[]


class RuleResolver {
  
}







const Demo = () => {
  return (
    <div>
      Coming soon...
    </div>
  )
};
export default Demo;
