import FactContext from "./FactContext";
import FieldController from "./FieldController";
import FieldModifierManager from "./FieldModifierManager";
import Modifier from "./Modifier";
import ModifierControlStrategy from "./ModifierControlStrategy";
import { Logic} from "./runtimeEngine";
import { AvailableModifiers, Value, FieldModel, FieldModelKeys } from "../types";


type StoreMapConfig = {
  [fieldKey: string]: {
    [K in AvailableModifiers]: Logic[]
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


const simpleModifierControlStrategy = new ModifierControlStrategy()
simpleModifierControlStrategy
.add('isVisible', (mods) => mods.some((m) => m.result === true))
.add('required', (mods) => mods.some((m) => m.result === true))
.add('value', (mods) => mods[0].result)
.add('validation', (mods) => mods[0].result)
.add('colorTheme', (mods) => mods[0].result)
.add('toolTip', (mods) => mods[0].result)

export class FieldStore {
  key: string
  listeners: (() => void)[] = []
  model: FieldModel
  controller: FieldController
  modifierManager: FieldModifierManager
  snapShot: FieldModel
  constructor(key: string, defaultValue?: Value) {
    this.key = key
    this.model = createFieldModel(key, defaultValue)
    this.snapShot = this.model
    this.modifierManager = new FieldModifierManager() 
    this.controller = new FieldController({key, model: this.model, modifier: this.modifierManager, controlStrategy: simpleModifierControlStrategy})
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
    this.modifierManager.listenFactChange(from, v)
    this.emitChange()
  }

  addModifier(m: Modifier, key: string, priority: number = 0){
    this.modifierManager.addMember(m, key, priority)
    this.emitChange()
  }

  removeModifier(key: string) {
    this.modifierManager.removeMember(key)
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




export const createStoreMap = (config: StoreMapConfig) => {
  const storeFactContext = new FactContext()
  const fieldKeys = Object.keys(config)
  const fieldStoreMap = Object.fromEntries(fieldKeys.map((key) => [key, new FieldStore(key)]))
  for (const fieldKey of fieldKeys) {
    const modifier = config[fieldKey]
    const store = fieldStoreMap[fieldKey]
    Object.entries(modifier).forEach(([name, m]) => {
      // name: 'isVisible', 'required', ...

      const mod = new Modifier(name as FieldModelKeys, m)
      store.addModifier(mod, fieldKey.concat(name), 0)
    })
  }
  Object.values(fieldStoreMap).forEach((store) => store.bindFactContext(storeFactContext))

  console.log({config, fieldStoreMap})
  return {
    storeMap: fieldStoreMap,
    keys: Object.keys(fieldStoreMap)
  }
}

// combine modifiers of stores with same keys
const mergeStoreModifiers = (store1: FieldStore, store2: FieldStore) => {
  store2.modifierManager.members.forEach((m) => {
      store1.modifierManager.addMember(m.modifier, m.key, m.priority)
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