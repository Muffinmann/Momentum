import { createContext } from "react";
import { FieldStore } from "./core/store";

const StoreMapContext = createContext<Record<string,FieldStore> | undefined>(undefined)

export default StoreMapContext;