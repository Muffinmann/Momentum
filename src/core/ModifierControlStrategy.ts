import { SettledModifier, Value } from "../types"

class ModifierControlStrategy {
  // tag: string
  // strategy: (mods: SettledModifier[]) => Value
  strategies: Record<string, (mods: SettledModifier[]) => Value> = {}
  constructor(){
  }
  handle(tag: string, mods: SettledModifier[]): Value{
    if (tag in this.strategies) {
      return this.strategies[tag](mods)
    } else {
      console.log("Strategy for %s not defined", tag)
      return null
    }
  }

  has(tag: string) {
    return tag in this.strategies
  }

  add(tag: string, strategy: (mods: SettledModifier[]) => Value) {
    if (!(tag in this.strategies)) {
      this.strategies[tag] = strategy
    }
    return this
  }
}

export default ModifierControlStrategy