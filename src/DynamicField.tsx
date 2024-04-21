import { useContext, useSyncExternalStore } from "react";
import StoreMapContext from "./contexts";


const useTestFieldStore = (key: string) => {
  const storeMap = useContext(StoreMapContext)
  const store = storeMap[key]
  const field = useSyncExternalStore(store.subscribe.bind(store), store.getSnapshot.bind(store))
  return {field, store}
}

const DynamicField= ({fieldKey}: {fieldKey: string}) => {
 const {field, store} = useTestFieldStore(fieldKey)

  return (
    <div style={{display: 'grid', gap:'2rem', gridTemplateColumns: '1fr 1fr 1fr'}}>
      <pre>model: 
        {JSON.stringify(field, null, 2)}
      </pre>
      <div>
        <p>{fieldKey}{field.required && <span style={{color: 'red'}}>*</span>}</p>
        {field.isVisible && <input name={field.key} value={(field.value || '') as string} onChange={(e) => store.updateValue(e.target.value)} />}
      </div>
      
    </div>
  )
}

export default DynamicField;