import { createContext } from "react";

type FieldStore = object 
const StoreMapContext = createContext<FieldStore | undefined>(undefined)

export default StoreMapContext;