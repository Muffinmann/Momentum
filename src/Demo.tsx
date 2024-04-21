import { useState } from "react";
import FieldContext from "./FieldContext";


const demoContexts = [
  'ctx1',
  'ctx2',
  'ctx3',
]

const Demo = () => {
  const [contextConfig, setContextConfig] = useState(Object.fromEntries(demoContexts.map((name) => [name, ''])))
  const [targetContext, setTargetContext] = useState('ctx1')
  const [generateConfig, setGeneratedConfig] = useState<Record<string, object>>(Object.fromEntries(demoContexts.map((name) => [name, {}])))

  console.log({generateConfig})
  const generateContextConfig = () => {
    const text = contextConfig[targetContext]
    try {
      const parsed = JSON.parse(text)
      setGeneratedConfig((old) => ({
        ...old,
        [targetContext]: parsed
      }))
    } catch(e) {
      console.error(e)
    }
  }

  const clearContextConfig = () => {
    setGeneratedConfig((old) => ({
      ...old,
      [targetContext]: {}
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
        {demoContexts.map((context) => (
          Object.keys(generateConfig[context]).length ? (<FieldContext key={context} config={generateConfig[context]} />) : null  
        ))}
      </div>
    </div>
  )
};
export default Demo;
