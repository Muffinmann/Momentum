import { useMemo } from "react";
import DynamicField from "./DynamicField";
import StoreMapContext from "./contexts";
import { createStoreMap, reduceStoreMaps } from "./core/store";
import ModifierConfig from "./ModifierConfig";
import { StoreMapConfig } from "./types";


const MergedFieldContext = ({contextConfigs}: {contextConfigs: StoreMapConfig[]}) => {
  const {storeMap, keys} = useMemo(() => reduceStoreMaps(contextConfigs.map((config) => createStoreMap(config).storeMap)), [contextConfigs])
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
