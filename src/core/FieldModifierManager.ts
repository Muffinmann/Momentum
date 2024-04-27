import { Value, FieldModelKeys, SettledModifier } from "../types"
import Modifier from "./Modifier"

type ModifierWithKeyAndPriority = {
  key: string
  priority: number
  modifier: Modifier
}

// implementation
// class ControlFlow {
//   flow: (v: Record<string, Value>) => Value
//   deps: string[]
//   constructor(flow: (v: Record<string, Value>) => Value, deps: string[]) {
//     this.flow = flow
//     this.deps = deps
//   }
//   evaluate(values: Record<string, Value>) {
//     console.log('Evaluateing with values: %o', values)
//     return this.flow(values)
//     // return null
//   }
//   tellDependencies(){
//     return this.deps
//     // return []
//   }
// }

// interface
// class ConditionalLogic {
//   controlFlow: ControlFlow
//   constructor(controlFlow: ControlFlow) {
//     this.controlFlow = controlFlow
//   }

//   evaluate(facts: Record<string, Value>) {
//     return this.controlFlow.evaluate(facts)
//   }
//   tellDependencies() {
//     return this.controlFlow.tellDependencies()
//   }
// }

// interface VariableContext {
//   returnValues(keys: string[]): Record<string, Value>
//   listenChange(cb:(initiator: string, v: Value) => void):void
// }


  // updateVariables(k: string, v: Value): void
  // updateVariables(k: Record<string, Value>): void
  // updateVariables(k: string | Record<string, Value>, v?: Value) {
  //   if (typeof k ==='object') {
  //     this.variables = {
  //       ...this.variables,
  //       ...k
  //     }
  //   } else {
  //     this.variables[k] = v || null
  //   }
  // }

// type Modifier = {
//   tag: string,
//   logic: Logic,
// }
// class FieldModifier {
//   key: string
//   modifiers: { // TODO support custom modifiers
//     // custom: Record<string, Modifier[]>
//     isVisible: Modifier[]
//     required: Modifier[];
//     validation: Modifier[];
//     colorTheme: Modifier[];
//     toolTip: Modifier[];
//     value: Modifier[];
//   }
//   existingModifiers: Modifier[] = []
//   listeners: ((m: FieldModifier['resolvedModifiers']) => void)[] = []
//   resolvedModifiers: {
//     [K in keyof FieldModifier['modifiers']]?: Value[]
//   } = {}
//   factMap: Record<string, Value> = {}

//   constructor(key: string, initFactMap?: Record<string, Value>){
//     this.key = key
//     this.modifiers = createDefaultModifiers()
//     if (initFactMap) {
//       this.factMap = initFactMap;
//     }
//     // resolve by construction
//     this.refresh()
//   }

//   handleFactChange(from: string, v: Value){
//     console.log("[FieldModifier] Modifier %s listened fact change by %s with value %s", this.key, from, v)
//     this.factMap[from] = v
//     this.notify()
//   }

//   refresh(){
//     // refresh resolved modifiers according to fact context
//     Object.entries(this.modifiers).forEach(([modifierName, members]) => {
//       // TODO logic for resolving
//       this.resolvedModifiers[modifierName as keyof FieldModifier['resolvedModifiers']] = members.map((member) => {
//         if (typeof member.logic === 'object' && member.logic !== null) {
//           if( 'var' in member.logic){
//             const targetKey = member.logic.var as string
//             return this.factMap[targetKey]
//           }
//           if ('varMap' in member.logic){
//             const targetKey = member.logic.varMap as string
//             return String(this.factMap[targetKey]).concat('mapped')
//           }
//         }
        
//         return member.logic as Value
//       })
//     })
//   }

//   addModifier(name: keyof FieldModifier['modifiers'], logic: Logic, tag: string) {
//     console.log("[FieldModifier] Adding modifier to %s with %s", this.key, name)
//     if (name in this.modifiers) {
//       this.modifiers[name].push({logic, tag})
//       this.notify()
//     } else {
//       console.log("'%s' is not a valid modifier name", name)
//     }
//   }

//   removeModifier (name: keyof FieldModifier['modifiers'], tag: string) {
//     if (name in this.modifiers) {
//       this.modifiers[name] = this.modifiers[name].filter((m) => m.tag !== tag)
//       this.notify()
//     } else {
//       console.log("'%s' is not a valid modifier name", name)
//     }
//   }
//   notify() {
//     this.refresh()
//     this.listeners.forEach((listener) => listener(this.resolvedModifiers))
//   }
//   onChange(listener: (m: FieldModifier['resolvedModifiers']) => void){
//     this.listeners.push(listener)
//   }
// }



class FieldModifierManager {
  private modifiers: ModifierWithKeyAndPriority[] = []
  private facts: Record<string, Value> = {}
  private onRefreshCallback: null | ((settledMods: Record<FieldModelKeys,SettledModifier[]>)=>void) = null

  constructor(initModifiers?: ModifierWithKeyAndPriority[]) {
    if (initModifiers) {
      this.modifiers = initModifiers
    }
  }

  tellDependencies() {
    return Array.from(new Set(this.modifiers.flatMap((mod) => mod.modifier.tellDependencies())))
  }

  addMember(modifier: Modifier, key: string, priority = 0){
    this.modifiers.push({modifier, key, priority})
    this.refresh()
    return () => this.removeMember(key) 
  }

  removeMember(k: string) {
    this.modifiers = this.modifiers.filter((mod) => mod.key !== k)
    this.refresh()
  }

  get members(){
    return this.modifiers
  }

  updateFact(k: string, v: Value) {
    this.facts[k] = v
  }

  onRefresh(cb: (settledMods: Record<FieldModelKeys, SettledModifier[]>) => void){
    this.onRefreshCallback = cb
  }

  // only update modifier having corresponding dependency of initiator
  listenFactChange(initiator: string, v: Value) {
    if (this.tellDependencies().includes(initiator)) {
      this.updateFact(initiator, v) 
      this.refresh()
    }
  }

  refresh() {
    const settledModifiers: Record<string, SettledModifier[]> = {}
      for (const mod of this.modifiers) {
        const result = mod.modifier.evaluate(this.facts)
        const modTag = mod.modifier.tag
        if (!(modTag in settledModifiers)) {
          settledModifiers[modTag] = []
        }
        settledModifiers[modTag].push({
          priority: mod.priority,
          result,
          key: mod.key
        })
      }
      Object.keys(settledModifiers).forEach((tag) => {
        settledModifiers[tag].sort((a, b) => a.priority < b.priority ? -1 : 1)
      })
      if (this.onRefreshCallback) {
        this.onRefreshCallback(settledModifiers)
      }
  }
}

export default FieldModifierManager