import { ChangeEventHandler, ReactElement, ReactNode, useSyncExternalStore } from "react"

type Value = string | number | boolean | string[] | number[] | boolean[] | null;
type FieldValue = string | number | boolean | string[] | number[] | boolean[] | null;
type FieldError = string;
type FieldModel = {
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

type Logic = object;


const defaultModifiers = {
  isVisible: [],
  required: [],
  validation: [],
  colorTheme: [],
  toolTip: [],
  value:[],
}


type Factable = {
  value: Value
}
class Fact {
  v: Value | Factable
  constructor(v: Value | Factable){
    this.v = v
  }

  get value(){
    if (this.v !== null && typeof this.v === 'object' &&  'value' in this.v) {
      return this.v.value
    }
   return this.v 
  }
}
// observe object change
class FactsObserver {
  facts: Fact[]
  constructor(facts: Fact[]){
    this.facts = facts
  }
  onChange(cb) {
    
  }
}

class FieldInteractor {
  modifiers: FieldModifier[]
  interactionMap: Record<string, FieldModifier[]> = {}
  modifierRules: Record<string, ModifierRule>
  factsObserver: FactsObserver

  constructor(props: {modifiers: FieldModifier[], modifierRules: object, factsObserver: FactsObserver}) {
    this.modifiers = props.modifiers;
    this.modifierRules = props.modifierRules
    this.factsObserver = props.factsObserver
    this.factsObserver.onChange(this.handleFactsChange.bind(this))
  }

  handleFactsChange(){}

  broadcastChange(from: string, value: unknown) {
    if (from in this.interactionMap) {
      this.interactionMap[from].forEach((c) => {})
    }
  }
}

type FactContextListener = (from: string, v: Value) => void
class FactContext{
  listeners: FactContextListener[] = []
  constructor(){}
  onChange(cb: FactContextListener){
    this.listeners.push(cb)
  }
  notify(from: string, v:Value){
    this.listeners.forEach((listener) => {
      listener(from, v)
    })
  }
}

class FieldModifier {
  key: string
  modifiers: {
    isVisible: Logic[]
    required: Logic[];
    validation: Logic[];
    colorTheme: Logic[];
    toolTip: Logic[];
    value: Logic[];
  }
  listeners: ((m: FieldModifier['modifiers']) => void)[]
  factContext: FactContext

  constructor(key: string, factContext: FactContext){
    this.key = key
    this.modifiers = defaultModifiers
    this.listeners = []
    this.factContext = factContext
    this.factContext.onChange(this.handleFactChange.bind(this))
  }

  handleFactChange(from: string, v: Value){
    console.log("Modifier %s listened fact change by %s with value %s", this.key, from, v)
  }

  addModifier(name: keyof FieldModifier['modifiers'], content: Logic) {
    if (name in this.modifiers) {
      this.modifiers[name].push(content)
      this.notify()
    } else {
      console.log("'%s' is not a valid modifier name", name)
    }
  }

  removeModifier (name: keyof FieldModifier['modifiers'], content: Logic) {
    if (name in this.modifiers) {
      this.modifiers[name] = this.modifiers[name].filter((m) => m !== content)
      this.notify()
    } else {
      console.log("'%s' is not a valid modifier name", name)
    }
  }
  notify() {
    this.listeners.forEach((listener) => listener(this.modifiers))
  }
  onChange(listener: (m: FieldModifier['modifiers']) => void){
    this.listeners.push(listener)
  }
}

class FieldController {
  key: string;
  modifier: FieldModifier;
  model: FieldModel;

  constructor(props: {key: string, model: FieldModel, modifier: FieldModifier }){
    this.key = props.key;
    this.model = props.model;
    this.modifier = props.modifier;
    // this.handleModifier(this.modifier)
    this.modifier.onChange(this.handleModifier.bind(this))
  }

  handleModifier(m: FieldModifier['modifiers']) {
    // update model according to modifiers
    // compare the resolved modifiers and decide whether to update the model or not?
    console.log('[FieldController] modifiers of %s updated to %o', this.key, m)
    this.updateModel('isVisible', m.isVisible.some(Boolean))
  }
  updateModel(k: keyof FieldModel, v: FieldModel[keyof FieldModel]){
    // update the model prop value
    console.log('[FieldController] update %s to %s', k, v)
    this.model[k] = v
    console.log('...finished', this.model)
  }

}


type Field = {
  key: string;
  value: FieldValue;
  error: FieldError | null;
  isVisible: boolean;
  required: boolean;
  validation: string;
  colorTheme: string;
  toolTip: string;
}

const createFieldModel = (key: string): FieldModel => {
  return {
    key,
    type: "text",
    value: null,
    error:  null,
    isVisible: false,
    required: false,
    validation: '',
    colorTheme: 'default',
    toolTip: '',
  }
}

class FieldStore {
  listeners: (() => void)[] = []
  model: FieldModel
  controller: FieldController
  modifier: FieldModifier
  factContext: FactContext
  snapShot: FieldModel
  constructor(key: string) {
    this.model = createFieldModel(key)
    this.snapShot = this.model
    this.factContext = new FactContext() 
    this.modifier = new FieldModifier(key, this.factContext)
    this.controller = new FieldController({key, model: this.model, modifier: this.modifier})
  }

  addModifier(k: string, v: any){
    this.modifier.addModifier(k, v)
    this.emitChange()
  }
  removeModifier(k: string, v: any) {
    this.modifier.removeModifier(k, v)
    this.emitChange()
  }
  updateValue(v: Value){
    console.log("updating start", this.model)
    this.controller.updateModel('value', v)
    console.log("updating finished", this.model)
    this.emitChange()
  }

  subscribe(listener: () => void) {
    console.log("subscribed!")
    this.listeners = [...this.listeners, listener];
    return () => {
    console.log("unsubscribed!")
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getSnapshot() {
    console.log('get snap shot!', this.model)
    return this.snapShot
  }
  
  emitChange() {
    console.log("emit change:", this.model)
    this.snapShot = {...this.model}
    for (const listener of this.listeners) {
      listener()
    }
  }
}

const testFieldStore = new FieldStore('test-field-1')

const useTestFieldStore = () => {
  const field = useSyncExternalStore(testFieldStore.subscribe.bind(testFieldStore), testFieldStore.getSnapshot.bind(testFieldStore))
  console.log({field})
  return field
}

const RadioInput = ({name, onChange, options}: {
  name: string,
  // value: string,
  options: {name: string, value: string}[],
  onChange: ChangeEventHandler<HTMLInputElement>
}) => {
  return options.map((opt) => (
    <label key={opt.value}>
      {opt.name}
      <input type="radio" name={name} value={opt.value} onChange={onChange}/>
    </label>
  ))
}

const Demo = () => {
  const {value, key, ...f} = useTestFieldStore()
  console.log('v ===>',value)

  return (
    <div>
      <div>
        <p>text input {f.required && <span style={{color: 'red'}}>*</span>}</p>
        {f.isVisible && <input name={key} value={(value || '') as string} onChange={(e) => testFieldStore.updateValue(e.target.value)} />}
        <pre>model: 
          {JSON.stringify({value, key, ...f}, null, 2)}
        </pre>
      </div>
      <div>
        <p>Modifiers</p>
        <pre>
          isVisible: <RadioInput name="isVisibleSelection" options={[{name: 'true', value:'true'}, {name:'false', value:'false'}]} onChange={(e) => {
            if (e.target.value === 'true') {
              testFieldStore.addModifier('isVisible', true)
            } else {
              testFieldStore.removeModifier('isVisible', true)
            }
          }} />
        </pre>
      </div>
    </div>
  )
};
export default Demo;
