import { useState } from 'react'
import './App.css'
import DemoModifier from './DemoModifier'
import RadioInput from './RadioInput'
import DemoPageCreation from './DemoPageCreation'

function App() {
  const [currentDemo, setCurrentDemo] = useState('modifier')

  return (
    <div>
        <RadioInput
          name="demoSelection"
          value={currentDemo}
          options={[
            {name: 'modifier', value: 'modifier'},
            {name: 'pageCreation', value: 'pageCreation'},
          ]}
          onChange={(e) => setCurrentDemo(e.target.value)} />
      {
        currentDemo === 'modifier' ? <DemoModifier /> : null
      }
      {
        currentDemo === 'pageCreation' ? <DemoPageCreation /> : null
      }
    </div>
  )
}

export default App
