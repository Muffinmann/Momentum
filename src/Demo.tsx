import { useState } from "react";
import DynamicField from "./DynamicField";
import RadioInput from "./RadioInput";
import storeMap from "./store";


const Demo = () => {
  const [valueModifierTarget, setValueModifierTarget] = useState('test-field-1')
  const [modifierSettingTarget, setModifierSettingTarget] = useState('test-field-1')
  const store = storeMap[modifierSettingTarget]
  const [modifierSettings, setModifierSettings] = useState<Record<string, {isVisible: string, required: string, value: string }>>(Object.fromEntries(Object.keys(storeMap).map((key) => [key, {
    isVisible: '',
    required: '',
    value: ''
  }])))
  return (
    <div>
      <div>
        <p>Modifiers</p>
        <div>Target Field: <select value={modifierSettingTarget} onChange={(e) => setModifierSettingTarget(e.target.value)}>{Object.keys(storeMap).map((k) => (<option key={k} value={k}>{k}</option>))}</select></div>
        <pre>
          isVisible: <RadioInput value={modifierSettings[modifierSettingTarget].isVisible} name={modifierSettingTarget.concat("isVisibleSelection")} options={[{name: 'true', value:'true'}, {name:'false', value:'false'}]} onChange={(e) => {
            setModifierSettings((old) => ({
              ...old,
              [modifierSettingTarget]: {
                ...old[modifierSettingTarget],
                isVisible: e.target.value
              }
            }))
            if (e.target.value === 'true') {
              store.addModifier('isVisible', true, modifierSettingTarget.concat('isVisibleTrue'))
            } else {
              store.removeModifier('isVisible', modifierSettingTarget.concat('isVisibleTrue'))
            }
          }} />
        
        </pre>
        <pre>
          required: <RadioInput value={modifierSettings[modifierSettingTarget].required} name={modifierSettingTarget.concat("requiredSelection")} options={[{name: 'true', value:'true'}, {name:'false', value:'false'}]} onChange={(e) => {
            setModifierSettings((old) => ({
              ...old,
              [modifierSettingTarget]: {
                ...old[modifierSettingTarget],
                required: e.target.value
              }
            }))
            if (e.target.value === 'true') {
              store.addModifier('required', true, modifierSettingTarget.concat('requiredTrue'))
            } else {
              store.removeModifier('required', modifierSettingTarget.concat('requiredTrue'))
            }
          }} />
        </pre>
        <pre>
          value: <RadioInput
           value={modifierSettings[modifierSettingTarget].value}
           name={modifierSettingTarget.concat("valueModifierSelection")} 
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
              store.addModifier('value', {"var": valueModifierTarget}, valueModifierTarget.concat('reflectedValue'))
              store.removeModifier('value', valueModifierTarget.concat('mappedValue'))
            } else if (e.target.value === 'map'){
              store.addModifier('value',{"varMap": valueModifierTarget}, valueModifierTarget.concat('mappedValue')) 
              store.removeModifier('value', valueModifierTarget.concat('reflectedValue'))
            } else {
              store.removeModifier('value', valueModifierTarget.concat('mappedValue'))
              store.removeModifier('value', valueModifierTarget.concat('reflectedValue'))
            }
          }} />
          <select value={valueModifierTarget} onChange={(e) => setValueModifierTarget(e.target.value)}>
            <option />
            {Object.keys(storeMap).filter((f) => f !== modifierSettingTarget).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </pre>
      </div>
      <DynamicField fieldKey="test-field-1" />
      <DynamicField fieldKey="test-field-2" />
      <DynamicField fieldKey="test-field-3" />
    </div>
  )
};
export default Demo;
