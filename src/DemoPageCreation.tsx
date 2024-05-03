import { ChangeEventHandler, useDeferredValue, useEffect, useRef, useState } from "react";
import DynamicField from "./DynamicField";
import StoreMapContext from "./contexts";
import { FieldStore, createStoreMap } from "./core/store";

const {storeMap: fieldStoreMap} = createStoreMap({
  "test-field-1": {
    isVisible: true
  }
})
const defaultText = `This is a demo, you can use & to use a component. For example: &DynamicField 
this way you can easily combine the field into the text. You can further refine the style
here by clicking the element.`

const DemoPageCreation = () => {
  const [text, setText] = useState()
  const deferredText = useDeferredValue(text)
  const textRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (textRef.current) {
      textRef.current.value = defaultText 
    }
  }, [])

  const handleTextChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    const val = e.target.value
    console.log("selection end:", e.target.selectionEnd)
    // console.log(e)
    const match = val.match(/&DynamicField/)
    console.log('match: ', match)
    const cropped = match ? val.slice(0, match.index) : val
    setText([cropped, match ? <DynamicField fieldKey="test-field-1" /> : null, match ? val.slice(match.index + match[0].length) : null])
    // const parsed = val.replace('&DynamicField', '')
  }

  return (
    <StoreMapContext.Provider value={fieldStoreMap}>
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", padding: "1rem"}}>
        <div>
          <textarea
            ref={textRef}
            style={{width: "700px", height: "100%", padding: "0.5rem"}}
            onChange={handleTextChange}
          />
        </div>
        <div>
          coming soon
          <pre>{deferredText}</pre>
        </div>
      </div>
    </StoreMapContext.Provider>
  )
};
export default DemoPageCreation;
