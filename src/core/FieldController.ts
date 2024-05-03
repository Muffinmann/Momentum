import { FieldModel, FieldModelKeys, SettledModifier } from "../types";
import FieldModifierManager from "./FieldModifierManager";
import ModifierControlStrategy from "./ModifierControlStrategy";

class FieldController {
  key: string;
  model: FieldModel;
  modifierManager: FieldModifierManager
  controlStrategy: ModifierControlStrategy 

  constructor(props: {key: string, model: FieldModel, modifier: FieldModifierManager, controlStrategy:  ModifierControlStrategy}){
    this.key = props.key;
    this.model = props.model;
    this.controlStrategy = props.controlStrategy;
    this.modifierManager = props.modifier
    this.modifierManager.onRefresh(this.handleModifierEvaluation.bind(this)) 
  }

  handleModifierEvaluation(mods: Record<FieldModelKeys, SettledModifier[]>) {
    Object.entries(mods).forEach(([t, mods]) => {
      const tag = t as FieldModelKeys
      if (this.controlStrategy.has(tag)) {
        const result = this.controlStrategy.handle(tag, mods)
        if (!this.modelValueIs(tag, result)) {
          this.updateModel(tag, result)
        }
      } else {
        console.log("[FieldController] Can not find the handle strategy for the modifier '%s'", tag)
      }
    })
  }

  updateModel<K extends keyof FieldModel>(k: K, v: FieldModel[K]){
    // update the model prop value
    this.model[k] = v
  }

  modelValueIs<K extends keyof FieldModel>(k: K, v: FieldModel[K]) {
    return this.model[k] === v
  }
  changeModel(newModel: FieldModel) {
    this.model = newModel
  }
  changeControlStrategy(newStrategy: ModifierControlStrategy) {
    this.controlStrategy = newStrategy
    this.modifierManager.refresh()
  }

}

export default FieldController

