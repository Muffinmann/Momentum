import { useRef, } from "react";
import DynamicField from "./DynamicField";
import { createStoreMap } from "./core/store";
import StoreMapContext from "./contexts";
import ModifierConfig from "./ModifierConfig";


const FieldContext = ({config}: {config: Record<string, object>}) => {
  const {storeMap, keys} = useRef(createStoreMap(config)).current
  return (
    <StoreMapContext.Provider value={storeMap}>
      <div style={{borderLeft: 'solid',  padding: '0rem 1rem'}}>
        <h2>Context</h2>
        <ModifierConfig storeMap={storeMap} />   
        {keys.map((key) => (
          <DynamicField key={key} fieldKey={key} />
        ))}
      </div>
    </StoreMapContext.Provider>
  )
};
export default FieldContext;
