import { useRef, } from "react";
import DynamicField from "./DynamicField";
import StoreMapContext from "./contexts";
import { createStoreMap, reduceStoreMaps } from "./core/store";
import ModifierConfig from "./ModifierConfig";


const MergedFieldContext = ({contextConfigs}: {contextConfigs: Record<string, object>[]}) => {
  const {storeMap, keys} = useRef(reduceStoreMaps(contextConfigs.map((config) => createStoreMap(config).storeMap))).current
  return (
    <StoreMapContext.Provider value={storeMap}>
      <div style={{borderLeft: 'solid',  padding: '0rem 1rem'}}>
        <h2>Merged Context</h2>
        <ModifierConfig storeMap={storeMap} /> 
        {keys.map((key) => (
          <DynamicField key={key} fieldKey={key} />
        ))}
      </div>
    </StoreMapContext.Provider>
  )
};
export default MergedFieldContext;
