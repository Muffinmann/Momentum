import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Demo from './Demo'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <Demo />
    </div>
  )
}

export default App
