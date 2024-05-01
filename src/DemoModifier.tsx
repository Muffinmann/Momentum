import { useState } from "react";
import FieldContext from "./FieldContext";
import MergedFieldContext from "./MergedFieldContext";
import { StoreMapConfig } from "./types";


const demoContexts = [
  'ctx1',
  'ctx2',
  'ctx3',
]

const defaultCtxConfig: Record<string, Record<string, object>> = {
    'ctx1': {
      'test-field-1': {
        isVisible: true
      },
      'test-field-2': {
        isVisible: false
      },
    }
  }
const Demo = () => {
  const [contextConfig, setContextConfig] = useState(Object.fromEntries(demoContexts.map((name) => [name, JSON.stringify(defaultCtxConfig[name] || '', null, 2)])))
  const [targetContext, setTargetContext] = useState('ctx1')
  const [generatedConfig, setGeneratedConfig] = useState<Record<string, Record<string, object>>>(defaultCtxConfig)

  const generateContextConfig = () => {
    const result = Object.fromEntries(Object.entries(contextConfig).filter((entry) => entry[1].length > 0).map(([name, configRawText]) => {
      try {
        const parsed = JSON.parse(configRawText)
        return [name, parsed]
      } catch(e) {
        console.error(e)
        return [name, {}]
      }
    }))
    setGeneratedConfig(result)
  }

  const clearContextConfig = () => {
    setGeneratedConfig((old) => {
      return Object.fromEntries(Object.entries(old).filter(([name]) => name !== targetContext))
    })
    setContextConfig((old) => ({
      ...old,
      [targetContext]: ''
    }))
  }
  return (
    <div>
      <h1> Demo </h1>
      <div>
        <h2>Config Context</h2>
        <pre> <button onClick={generateContextConfig}>Generate</button> <button onClick={clearContextConfig}>Clear</button></pre>
        <pre>Current Context: <select value={targetContext} onChange={(e) => setTargetContext(e.target.value)}>
          {demoContexts.map((ctx) => (
            <option value={ctx} key={ctx}>{ctx}</option>))}
        </select>
        </pre>
        <textarea 
          style={{width: '60%', padding:'0.5rem 0.3rem'}} 
          rows={8}
          value={contextConfig[targetContext]} 
          onChange={(e) => {
            setContextConfig((old) => ({
              ...old,
              [targetContext]: e.target.value
            }))
        }}/>
      </div>
      <div style={{display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1fr 1fr'}}>
        {Object.entries(generatedConfig).map(([ctxName, contextConfig], i) => (
           (contextConfig ? <FieldContext key={ctxName.concat(String(i))} name={ctxName} config={contextConfig as StoreMapConfig} /> : null)
        ))}
        {Object.values(generatedConfig).filter(Boolean).length > 1 ? <MergedFieldContext contextConfigs={Object.values(generatedConfig).filter(Boolean) as StoreMapConfig[]} /> : null}
      </div>
    </div>
  )
};
export default Demo;
