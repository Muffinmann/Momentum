import { useId, useState, useMemo, FormEventHandler } from "react";
import RadioInput from "./RadioInput";
import { FieldStore } from "./core/store";
import Modifier from "./core/Modifier";
import { FieldModelKeys } from "./types";
import { Logic } from "./core/runtimeEngine";

const nameIsFieldModelKeys = (n: string): n is FieldModelKeys => {
  return  ['value', 'isVisible' ,'required' ,'validation' ,'colorTheme' ,'toolTip'].includes(n)
}

const ModifierConfig = ({storeMap}: {storeMap: Record<string, FieldStore>}) => {
  const id = useId()
  const keys = Object.keys(storeMap)
  
  const [modifierSettingTarget, setModifierSettingTarget] = useState(keys?.[0] || '')
  const [modifierSettings, setModifierSettings] = useState<Record<string, {strategy: 'simple' | 'priorityAsc' | 'priorityDesc', priority: number }>>(
    Object.fromEntries(keys.map((key) => [key, {
    strategy: 'simple',
    priority: 0 ,
  }])))
  const [err, setErr] = useState<string[]>([])

  const store = useMemo(() => storeMap[modifierSettingTarget], [modifierSettingTarget, storeMap])
  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault() 
    const data = new FormData(e.target as HTMLFormElement)
    const dict =  Object.fromEntries(Array.from(data.entries()))
    try {
      const rules = JSON.parse((dict.ruleContent || '') as string)
      Object.entries(rules).forEach(([name, rule]) => {
        if (nameIsFieldModelKeys(name)) {
          store.addModifier(new Modifier(name, rule as Logic), 'modifier'.concat(modifierSettingTarget,name), modifierSettings[modifierSettingTarget].priority)
        } else {
          setErr((old) => [...old, `"${name}" is not a valid modifier name`])
        }
      })
    } catch(e) {
      setErr((old) => [...old, `Something went wrong: ${e}`])
    }
  }
  return (
    <div>
      <p>Modifiers</p>
      <div>Target Field: <select value={modifierSettingTarget} onChange={(e) => setModifierSettingTarget(e.target.value)}>{Object.keys(storeMap).map((k) => (<option key={k} value={k}>{k}</option>))}</select></div>
      <div>
        strategy: <RadioInput 
        value={modifierSettings[modifierSettingTarget].strategy} 
        name={modifierSettingTarget.concat(id, "isVisibleSelection")}
        options={[
          {name: 'simple', value:'simple'},
          {name:'priorityAsc(small first)', value:'priorityAsc'},
          {name:'priorityDesc(big first)', value:'priorityDesc'},
        ]}
        onChange={(e) => {
          const newStrategy = e.target.value as 'simple' | 'priorityAsc' | 'priorityDesc'
          setModifierSettings((old) => ({
            ...old,
            [modifierSettingTarget]: {
              ...old[modifierSettingTarget],
              strategy: newStrategy
            }
          }))
          store.changeControlStrategy(newStrategy)
        }} />
      
      </div>
      <pre>
        priority: <input
        type="number"
        value={modifierSettings[modifierSettingTarget].priority}
        name={modifierSettingTarget.concat(id, "priorityNumber")} 
        onChange={(e) => {
          setModifierSettings((old) => ({
            ...old,
            [modifierSettingTarget]: {
              ...old[modifierSettingTarget],
              priority: e.target.valueAsNumber
            }
          }))
        }} />
      </pre>
      <form onSubmit={handleSubmit}>
        <textarea name="ruleContent" rows={10} cols={50} />
        <button>submit</button>
      </form>
      <ul style={{color: 'red'}}>
        {err.length > 0 ? (
          err.map((e, i) => <li key={i}>{e}</li>)
        ) : null}
        {err.length ? <button onClick={() => setErr([])}>clear error</button> : null}
      </ul>
    </div>
  )
};
export default ModifierConfig;
