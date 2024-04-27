import { useId, useState, useMemo, FormEventHandler, FormEvent } from "react";
import RadioInput from "./RadioInput";
import { FieldStore } from "./core/store";
import Modifier from "./core/Modifier";


const ModifierConfig = ({storeMap}: {storeMap: Record<string, FieldStore>}) => {
  const id = useId()
  const keys = Object.keys(storeMap)

  
  const [valueModifierTarget, setValueModifierTarget] = useState(keys?.[0] || '')
  const [modifierSettingTarget, setModifierSettingTarget] = useState(keys?.[0] || '')
  const [modifierSettings, setModifierSettings] = useState<Record<string, {isVisible: string, required: string, value: string }>>(
    Object.fromEntries(keys.map((key) => [key, {
    isVisible: '',
    required: '',
    value: ''
  }])))

  const store = useMemo(() => storeMap[modifierSettingTarget], [modifierSettingTarget, storeMap])
  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault() 
    const data = new FormData(e.target as HTMLFormElement)
    const dict =  Object.fromEntries(Array.from(data.entries()))
    try {
      const rules = JSON.parse((dict.ruleContent || '') as string)
      Object.entries(rules).forEach(([name, rule]) => {
        store.addModifier(new Modifier(name, rule), 'modifier'.concat(modifierSettingTarget,name), 1)
      })
    } catch(e) {
      console.log('Something went wrong: %o', e)
    }
  }
  return (
    <div>
      <p>Modifiers</p>
      <div>Target Field: <select value={modifierSettingTarget} onChange={(e) => setModifierSettingTarget(e.target.value)}>{Object.keys(storeMap).map((k) => (<option key={k} value={k}>{k}</option>))}</select></div>
      <pre>
        isVisible: <RadioInput 
        value={modifierSettings[modifierSettingTarget].isVisible} 
        name={modifierSettingTarget.concat(id, "isVisibleSelection")} options={[{name: 'true', value:'true'}, {name:'false', value:'false'}]} onChange={(e) => {
          setModifierSettings((old) => ({
            ...old,
            [modifierSettingTarget]: {
              ...old[modifierSettingTarget],
              isVisible: e.target.value
            }
          }))
          if (e.target.value === 'true') {
            store.addModifier(new Modifier('isVisible', true), modifierSettingTarget.concat('isVisibleTrue'), 1)
          } else {
            store.removeModifier(modifierSettingTarget.concat('isVisibleTrue'))
          }
        }} />
      
      </pre>
      <pre>
        required: <RadioInput 
        value={modifierSettings[modifierSettingTarget].required} 
        name={modifierSettingTarget.concat(id, "requiredSelection")} 
        options={[{name: 'true', value:'true'}, {name:'false', value:'false'}]} 
        onChange={(e) => {
          setModifierSettings((old) => ({
            ...old,
            [modifierSettingTarget]: {
              ...old[modifierSettingTarget],
              required: e.target.value
            }
          }))
          if (e.target.value === 'true') {
            store.addModifier(new Modifier('required', true), modifierSettingTarget.concat('requiredTrue'), 1)
          } else {
            store.removeModifier(modifierSettingTarget.concat('requiredTrue'))
          }
        }} />
      </pre>
      <pre>
        value: <RadioInput
        value={modifierSettings[modifierSettingTarget].value}
        name={modifierSettingTarget.concat(id, "valueModifierSelection")} 
        options={[
          {name: 'reflect field', value:'reflect'},
          {name:'map value', value:'map'},
          {name:'none', value:'none'},
        ]} 
        onChange={(e) => {
          setModifierSettings((old) => ({
            ...old,
            [modifierSettingTarget]: {
              ...old[modifierSettingTarget],
              value: e.target.value
            }
          }))
          if (e.target.value === 'reflect') {
            store.addModifier(new Modifier('value', {"var": valueModifierTarget}), valueModifierTarget.concat('reflectedValue'))
            store.removeModifier(valueModifierTarget.concat('mappedValue'))
          } else if (e.target.value === 'map'){
            store.addModifier(new Modifier('value',{"var": valueModifierTarget}), valueModifierTarget.concat('mappedValue')) 
            store.removeModifier(valueModifierTarget.concat('reflectedValue'))
          } else {
            store.removeModifier(valueModifierTarget.concat('mappedValue'))
            store.removeModifier(valueModifierTarget.concat('reflectedValue'))
          }
        }} />
        <select value={valueModifierTarget} onChange={(e) => setValueModifierTarget(e.target.value)}>
          <option />
          {Object.keys(storeMap).filter((f) => f !== modifierSettingTarget).map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </pre>
      <form onSubmit={handleSubmit}>
        <textarea name="ruleContent" rows={10} cols={50} />
        <button>submit</button>
      </form>
    </div>
  )
};
export default ModifierConfig;
