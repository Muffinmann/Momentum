import { useContext, useSyncExternalStore } from "react";
import StoreMapContext from "./contexts";


const useStoreMapContext = () => {
  const storeMap = useContext(StoreMapContext)
  if (!storeMap) {
    throw new Error('useStoreMapContext should be called inside the context provider')
  }
  return storeMap
}
const useTestFieldStore = (key: string) => {
  const storeMap = useStoreMapContext()
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
        {field.toolTip ? <p>{field.toolTip}</p> : null}
        {field.isVisible && <input style={{color: field.colorTheme}} name={field.key} value={(field.value || '') as string} onChange={(e) => store.updateValue(e.target.value)} />}
      </div>
      
    </div>
  )
}

export default DynamicField;