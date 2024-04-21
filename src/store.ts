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

type Logic = object | Value;


const createDefaultModifiers = () => ({
  isVisible: [],
  required: [],
  validation: [],
  colorTheme: [],
  toolTip: [],
  value:[],
})


// type Factable = {
//   value: Value
// }

// class Fact {
//   v: Value | Factable
//   constructor(v: Value | Factable){
//     this.v = v
//   }

//   get value(){
//     if (this.v !== null && typeof this.v === 'object' &&  'value' in this.v) {
//       return this.v.value
//     }
//    return this.v 
//   }
// }

// observe object change
// class FactsObserver {
//   facts: Fact[]
//   constructor(facts: Fact[]){
//     this.facts = facts
//   }
//   onChange(cb) {
    
//   }
// }



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

type AvailableModifiers = keyof FieldModifier['modifiers'];

type Modifier = {
  tag: string,
  logic: Logic,
}
class FieldModifier {
  key: string
  modifiers: { // TODO support custom modifiers
    // custom: Record<string, Modifier[]>
    isVisible: Modifier[]
    required: Modifier[];
    validation: Modifier[];
    colorTheme: Modifier[];
    toolTip: Modifier[];
    value: Modifier[];
  }
  listeners: ((m: FieldModifier['resolvedModifiers']) => void)[] = []
  resolvedModifiers: {
    [K in keyof FieldModifier['modifiers']]?: Value[]
  } = {}
  factMap: Record<string, Value> = {}

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
      // TODO logic for resolving
      this.resolvedModifiers[modifierName as keyof FieldModifier['resolvedModifiers']] = members.map((member) => {
        if (typeof member.logic === 'object' && member.logic !== null) {
          if( 'var' in member.logic){
            const targetKey = member.logic.var as string
            return this.factMap[targetKey]
          }
          if ('varMap' in member.logic){
            const targetKey = member.logic.varMap as string
            return String(this.factMap[targetKey]).concat('mapped')
          }
        }
        
        return member.logic as Value
      })
    })
  }

  addModifier(name: keyof FieldModifier['modifiers'], logic: Logic, tag: string) {
    console.log("[FieldModifier] Adding modifier to %s with %s", this.key, name)
    if (name in this.modifiers) {
      this.modifiers[name].push({logic, tag})
      this.notify()
    } else {
      console.log("'%s' is not a valid modifier name", name)
    }
  }

  removeModifier (name: keyof FieldModifier['modifiers'], tag: string) {
    if (name in this.modifiers) {
      this.modifiers[name] = this.modifiers[name].filter((m) => m.tag !== tag)
      this.notify()
    } else {
      console.log("'%s' is not a valid modifier name", name)
    }
  }
  notify() {
    this.refresh()
    this.listeners.forEach((listener) => listener(this.resolvedModifiers))
  }
  onChange(listener: (m: FieldModifier['resolvedModifiers']) => void){
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
    // this.handleModifier(this.modifier.modifiers)
    this.modifier.onChange(this.handleModifier.bind(this))
  }

  handleModifier(m: FieldModifier['resolvedModifiers']) {
    // update model according to modifiers
    // compare the resolved modifiers and decide whether to update the model or not?
    console.log('[FieldController] modifiers of %s updated to %o', this.key, m)
    if (m.isVisible?.length) {
      this.updateModel('isVisible', m.isVisible.some(Boolean))
    }
    if (m.required?.length) {
      this.updateModel('required', m.required.some(Boolean))
    }
    if (m.value?.length) {
      this.updateModel('value', m.value[m.value.length - 1])
    }
  }
  updateModel<K extends keyof FieldModel>(k: K, v: FieldModel[K]){
    // update the model prop value
    this.model[k] = v
  }
  changeModel(newModel: FieldModel) {
    this.model = newModel
  }

}


const createFieldModel = (key: string, defaultValue?: Value): FieldModel => {
  return {
    key,
    type: "text",
    value: defaultValue || null,
    error:  null,
    isVisible: false,
    required: false,
    validation: '',
    colorTheme: 'default',
    toolTip: '',
  }
}

export class FieldStore {
  key: string
  listeners: (() => void)[] = []
  model: FieldModel
  controller: FieldController
  modifier: FieldModifier
  snapShot: FieldModel
  constructor(key: string, defaultValue?: Value) {
    this.key = key
    this.model = createFieldModel(key, defaultValue)
    this.snapShot = this.model
    this.modifier = new FieldModifier(key)
    this.controller = new FieldController({key, model: this.model, modifier: this.modifier})
  }

  bindFactContext(factContext: FactContext){
    factContext.onChange(this.key, this.updateModifierFact.bind(this))

    this.model = new Proxy(this.model,{
      set(target, p, newValue, receiver) {  
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

  updateModifierFact(from: string, v: Value){
    this.modifier.handleFactChange(from, v)
    this.emitChange()
  }

  addModifier(k: AvailableModifiers, v: Logic, tag: string){
    this.modifier.addModifier(k, v, tag)
    this.emitChange()
  }
  removeModifier(k: AvailableModifiers, tag: string) {
    this.modifier.removeModifier(k, tag)
    this.emitChange()
  }
  updateValue(v: Value){
    this.controller.updateModel('value', v)
    this.emitChange()
  }

  subscribe(listener: () => void) {
    this.listeners = [...this.listeners, listener];
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getSnapshot() {
    return this.snapShot
  }
  
  emitChange() {
    this.snapShot = {...this.model}
    for (const listener of this.listeners) {
      listener()
    }
  }
}


type StoreMapConfig = {
  [fieldKey: string]: {
    [K in AvailableModifiers]: Logic[]
  }
}

export const createStoreMap = (config: StoreMapConfig) => {
  const storeFactContext = new FactContext()
  const fieldKeys = Object.keys(config)
  const fieldStoreMap = Object.fromEntries(fieldKeys.map((key) => [key, new FieldStore(key)]))
  for (const fieldKey of fieldKeys) {
    const modifier = config[fieldKey]
    const store = fieldStoreMap[fieldKey]
    Object.entries(modifier).forEach(([name, m]) => {
      store.addModifier(name as AvailableModifiers, m, 'ctxTag')
    })
  }
  Object.values(fieldStoreMap).forEach((store) => store.bindFactContext(storeFactContext))

  return {
    storeMap: fieldStoreMap,
    keys: Object.keys(fieldStoreMap)
  }
}

// combine modifiers of stores with same keys
const mergeStoreModifiers = (store1: FieldStore, store2: FieldStore) => {
  Object.entries(store2.modifier.modifiers).forEach(([name, ms]) => {
    ms.forEach((m) => {
      store1.addModifier(name as AvailableModifiers, m.logic, m.tag)
    })
  })
  return store1
}

export const mergeStoreMap = (storeMap1: Record<string, FieldStore>, storeMap2: Record<string, FieldStore>) => {
  const newMap = {...storeMap1}
  Object.entries(storeMap2).forEach(([fKey, store]) => {
    if (fKey in newMap){
      mergeStoreModifiers(newMap[fKey], store)
    } else {
      newMap[fKey] = store
    }
  })

  return newMap
}

export const reduceStoreMaps = (storeMaps: Record<string, FieldStore>[]) => {
  const finalMap = storeMaps.reduce((prev, crr) => mergeStoreMap(prev, crr))
  const factContext = new FactContext()

  Object.values(finalMap).forEach((store) => store.bindFactContext(factContext))
  return {
    storeMap: finalMap,
    keys: Object.keys(finalMap)
  }
}