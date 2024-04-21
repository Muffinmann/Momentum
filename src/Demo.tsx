import { useState } from "react";
import FieldContext from "./FieldContext";
import MergedFieldContext from "./MergedFieldContext";


const demoContexts = [
  'ctx1',
  'ctx2',
  'ctx3',
]

const Demo = () => {
  const [contextConfig, setContextConfig] = useState(Object.fromEntries(demoContexts.map((name) => [name, ''])))
  const [targetContext, setTargetContext] = useState('ctx1')
  const [generatedConfig, setGeneratedConfig] = useState<Record<string, object>>({})

  const [sessionId, setSessionId] = useState(0)
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
    // console.log(result)
    // const text = contextConfig[targetContext]
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
    setSessionId((old) => old+1)
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
        {Object.values(generatedConfig).map((contextConfig, i) => (
           (<FieldContext key={String(sessionId).concat(Object.keys(generatedConfig)[i] || String(i))} config={contextConfig} />)
        ))}
        {Object.keys(generatedConfig).length ? <MergedFieldContext contextConfigs={Object.values(generatedConfig)} /> : null}
      </div>
    </div>
  )
};
export default Demo;
