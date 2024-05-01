import { useMemo, } from "react";
import DynamicField from "./DynamicField";
import { createStoreMap } from "./core/store";
import StoreMapContext from "./contexts";
import ModifierConfig from "./ModifierConfig";
import { StoreMapConfig } from "./types";


const FieldContext = ({name, config}: {name: string, config: StoreMapConfig}) => {
  const {storeMap, keys} = useMemo(() => createStoreMap(config), [config])
  return (
    <StoreMapContext.Provider value={storeMap}>
      <div style={{borderLeft: 'solid',  padding: '0rem 1rem'}}>
        <h2>Context {name}</h2>
        <ModifierConfig storeMap={storeMap} />   
        {keys.map((key) => (
          <DynamicField key={key} fieldKey={key} />
        ))}
      </div>
    </StoreMapContext.Provider>
  )
};
export default FieldContext;
