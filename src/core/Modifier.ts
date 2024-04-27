import { FieldModelKeys, Value } from "../types"
import { Logic, collectDependencies, resolveLogic } from "./runtimeEngine"


class Modifier {
  tag: FieldModelKeys
  logic: Logic | Value
  dependencies: string[]
  constructor(tag: FieldModelKeys, logic: Logic | Value) {
    this.tag = tag
    this.logic = logic
    this.dependencies = collectDependencies(logic)
  }

  evaluate(values: Record<string, Value>){
    return resolveLogic(this.logic, values)
  }

  tellDependencies() {
    return this.dependencies
  }

  isTag(t: string){
    return this.tag === t
  }

  isDependentOn(key: string) {
    return this.dependencies.includes(key)
  }

}


export default Modifier