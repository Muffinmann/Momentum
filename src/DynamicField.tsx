import { useState, useSyncExternalStore } from "react";
import RadioInput from "./RadioInput";

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


const createDefaultModifiers = () => ({
  isVisible: [],
  required: [],
  validation: [],
  colorTheme: [],
  toolTip: [],
  value:[],
})


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
  listeners: {key: string, cb: FactContextListener}[] = []
  constructor(){}
  onChange(key: string, cb: FactContextListener){
    this.listeners.push({key,cb})
  }
  notify(from: string, v:Value){
    this.listeners.forEach((listener) => {
      if (listener.key !== from) {
        listener.cb(from, v)
      }
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
  listeners: ((m: FieldModifier['modifiers']) => void)[] = []
  resolvedModifiers = {}
  factMap = {}

  constructor(key: string){
    this.key = key
    this.modifiers = createDefaultModifiers()
    // resolve by construction
    this.refresh()
  }

  handleFactChange(from: string, v: Value){
    console.log("[FieldModifier] Modifier %s listened fact change by %s with value %s", this.key, from, v)
    this.factMap[from] = v
    this.notify()
  }

  refresh(){
    // refresh resolved modifiers according to fact context
    Object.entries(this.modifiers).forEach(([modifierName, members]) => {
      this.resolvedModifiers[modifierName] = members.map((member) => {
        if (typeof member === 'object' && 'var' in member){
          return this.factMap[member.var]
        }
        return member
      })
    })
  }

  addModifier(name: keyof FieldModifier['modifiers'], content: Logic) {
    console.log("[FieldModifier] Adding modifier to %s with %s", this.key, name)
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
    this.refresh()
    this.listeners.forEach((listener) => listener(this.resolvedModifiers))
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
    this.handleModifier(this.modifier.modifiers)
    this.modifier.onChange(this.handleModifier.bind(this))
  }

  handleModifier(m: FieldModifier['modifiers']) {
    // update model according to modifiers
    // compare the resolved modifiers and decide whether to update the model or not?
    console.log('[FieldController] modifiers of %s updated to %o', this.key, m)
    this.updateModel('isVisible', m.isVisible.length > 0 && m.isVisible.some(Boolean))
    this.updateModel('required', m.required.length > 0 && m.required.some(Boolean))
    if (m.value.length) {
      this.updateModel('value', m.value[m.value.length - 1])
    }
  }
  updateModel(k: keyof FieldModel, v: FieldModel[keyof FieldModel]){
    // update the model prop value
    this.model[k] = v
  }
  changeModel(newModel: FieldModel) {
    this.model = newModel
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


const factContext = new FactContext()

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
  key: string
  listeners: (() => void)[] = []
  model: FieldModel
  controller: FieldController
  modifier: FieldModifier
  factContext: FactContext | null = null
  snapShot: FieldModel
  constructor(key: string) {
    this.key = key
    this.model = createFieldModel(key)
    this.snapShot = this.model
    this.modifier = new FieldModifier(key)
    this.controller = new FieldController({key, model: this.model, modifier: this.modifier})
  }

  bindFactContext(factContext: FactContext){
    this.factContext = factContext
    this.factContext.onChange(this.key, this.updateModifierFact.bind(this))

    const m = this.model
    this.model = new Proxy(this.model,{
      set(target, p, newValue, receiver) {  
        console.log("set", {receiver, thisObj: this})
        if (Reflect.get(target, p, receiver) !== newValue) {
          console.log('[FieldModel] set %s with %s = %s', target.key, p, newValue)
          Reflect.set(target, p, newValue, receiver)
          if (p === 'value') {
            factContext.notify(target.key, newValue)
          }
          return true
        }
        return true
      },
    })
    this.controller.changeModel(this.model)
  }

  updateModifierFact(from: string, v: any){
    this.modifier.handleFactChange(from, v)
    this.emitChange()
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
    // console.log("updating start", this.model)
    this.controller.updateModel('value', v)
    // console.log("updating finished", this.model)
    // if (this.factContext) {
    //   this.factContext.notify(this.key, v)
    // }
    this.emitChange()
  }

  subscribe(listener: () => void) {
    // console.log("subscribed!")
    this.listeners = [...this.listeners, listener];
    return () => {
    // console.log("unsubscribed!")
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getSnapshot() {
    // console.log('get snap shot!', this.model)
    return this.snapShot
  }
  
  emitChange() {
    // console.log("emit change:", this.model)
    this.snapShot = {...this.model}
    for (const listener of this.listeners) {
      listener()
    }
  }
}



const storeMap: Record<string, FieldStore> = {
  'test-field-1': new FieldStore('test-field-1'),
  'test-field-2': new FieldStore('test-field-2'),
  'test-field-3': new FieldStore('test-field-3'),
}


Object.values(storeMap).forEach((store) => store.bindFactContext(factContext))

const useTestFieldStore = (key: string) => {
  const store = storeMap[key]
  const field = useSyncExternalStore(store.subscribe.bind(store), store.getSnapshot.bind(store))
  return {field, store}
}

const DynamicField= ({fieldKey}: {fieldKey: string}) => {
 const {field, store} = useTestFieldStore(fieldKey)

  const [valueModifierTarget, setValueModifierTarget] = useState('')
  return (
    <div style={{display: 'grid', gap:'2rem', gridTemplateColumns: '1fr 1fr 1fr'}}>
      <pre>model: 
        {JSON.stringify(field, null, 2)}
      </pre>
      <div>
        <p>{fieldKey}{field.required && <span style={{color: 'red'}}>*</span>}</p>
        {field.isVisible && <input name={field.key} value={(field.value || '') as string} onChange={(e) => store.updateValue(e.target.value)} />}
      </div>
      <div>
        <p>Modifiers</p>
        <pre>
          isVisible: <RadioInput name={fieldKey.concat("isVisibleSelection")} options={[{name: 'true', value:'true'}, {name:'false', value:'false'}]} onChange={(e) => {
            if (e.target.value === 'true') {
              store.addModifier('isVisible', true)
            } else {
              store.removeModifier('isVisible', true)
            }
          }} />
        
        </pre>
        <pre>
          required: <RadioInput name={fieldKey.concat("requiredSelection")} options={[{name: 'true', value:'true'}, {name:'false', value:'false'}]} onChange={(e) => {
            if (e.target.value === 'true') {
              store.addModifier('required', true)
            } else {
              store.removeModifier('required', true)
            }
          }} />
        </pre>
        <pre>
          value: <RadioInput name={fieldKey.concat("valueModifierSelection")} options={[{name: 'reflect field', value:'reflect'}, {name:'map value', value:'map'}]} onChange={(e) => {
            
            if (e.target.value === 'reflect') {
              store.addModifier('value', {"var": valueModifierTarget})
            } else {
              store.addModifier('value', String(storeMap[valueModifierTarget].getSnapshot().value).concat("-mapped"))
            }
          }} />
          <select value={valueModifierTarget} onChange={(e) => setValueModifierTarget(e.target.value)}>
            <option />
            {Object.keys(storeMap).filter((f) => f!== fieldKey).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </pre>
      </div>
    </div>
  )
}

export default DynamicField;