import FactContext from "./FactContext";
import FieldController from "./FieldController";
import FieldModifierManager from "./FieldModifierManager";
import Modifier from "./Modifier";
import ModifierControlStrategy from "./ModifierControlStrategy";
import { Value, FieldModel, FieldModelKeys, StoreMapConfig } from "../types";


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

const priorityDescModifierControlStrategy = new ModifierControlStrategy()
priorityDescModifierControlStrategy
.add('isVisible', (mods) => mods[mods.length - 1].result)
.add('required', (mods) => mods[mods.length - 1].result)
.add('value', (mods) => mods[mods.length - 1].result)
.add('validation', (mods) => mods[mods.length - 1].result)
.add('colorTheme', (mods) => mods[mods.length - 1].result)
.add('toolTip', (mods) => mods[mods.length - 1].result)

const priorityAscModifierControlStrategy = new ModifierControlStrategy()
priorityAscModifierControlStrategy
.add('isVisible', (mods) => mods[0].result)
.add('required', (mods) => mods[0].result)
.add('value', (mods) => mods[0].result)
.add('validation', (mods) => mods[0].result)
.add('colorTheme', (mods) => mods[0].result)
.add('toolTip', (mods) => mods[0].result)

// TODO: value persistance
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
    const modifierUpdated = this.modifierManager.listenFactChange(from, v)
    if (modifierUpdated) {
      this.emitChange()
    }
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

  changeControlStrategy(name: 'simple' | 'priorityAsc' | 'priorityDesc') {
    if (name === 'simple') {
      return
    }
    if (name === 'priorityAsc') {
      this.controller.changeControlStrategy(priorityAscModifierControlStrategy)
      return
    }
    if (name === 'priorityDesc') {
      this.controller.changeControlStrategy(priorityDescModifierControlStrategy)
    }
    this.emitChange()
  }
}


const singletonMap = new Map<string, FieldStore | null>([['test-field-1', null]])

export const createStoreMap = (config: StoreMapConfig, options?: {modifierPriority?: number}) => {
  const storeFactContext = new FactContext()
  const fieldKeys = Object.keys(config)
  const fieldStoreMap = Object.fromEntries(fieldKeys.map((key) => [key, singletonMap.get(key) || new FieldStore(key)]))
  const filteredKeys = fieldKeys.filter((k) => !singletonMap.get(k))
  for (const fieldKey of filteredKeys) {
    const modifier = config[fieldKey]
    const store = fieldStoreMap[fieldKey]
    if (singletonMap.has(fieldKey) && !singletonMap.get(fieldKey)) {
      singletonMap.set(fieldKey, store)
    }
    Object.entries(modifier).forEach(([name, m]) => {
      // name: 'isVisible', 'required', ...

      const mod = new Modifier(name as FieldModelKeys, m)
      store.addModifier(mod, fieldKey.concat(name), options?.modifierPriority || 0)
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
  store2.modifierManager.members.forEach((m) => {
      store1.modifierManager.addMember(m.modifier, m.key, m.priority)
  })
  store1.emitChange()
  return store1
}

export const mergeStoreMap = (storeMap1: Record<string, FieldStore>, storeMap2: Record<string, FieldStore>) => {
  const newMap = {...storeMap1}
  Object.entries(storeMap2).forEach(([fKey, store]) => {
    if (singletonMap.get(fKey) && fKey in newMap) {
      return
    }
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