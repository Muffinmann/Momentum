import { ChangeEventHandler, ComponentProps, useDeferredValue, useEffect, useRef, useState } from "react";
import DynamicField from "./DynamicField";
import StoreMapContext from "./contexts";
import { createStoreMap } from "./core/store";
import monaco from "./core/Editor";

const {storeMap: fieldStoreMap} = createStoreMap({
  "test-field-1": {
    isVisible: true
  }
})
const defaultText = `This is a demo, you can use \& to use a component. For example: &DynamicField[fieldKey="test-field-1"] 
this way you can easily combine the field into the text. You can further refine the style
here by clicking the element.`

const LINEFEED = /\n/
const LETTERS = /^[a-z]$/i
const WHITESPACE = /\s/
const ESCAPE = /\\/
const PUNCTUATION = /[,.:;]/

export const tokenize = (text: string) => {
  let ptr = 0;
  const tokens = []

  while (ptr < text.length) {
    let char = text[ptr]

    if (LINEFEED.test(char)) {
      tokens.push({
        type: 'linefeed', value: char, position: ptr
      })

      char = text[++ptr]
      continue;
    }

    if (PUNCTUATION.test(char)) {
      tokens.push({
        type: 'punctuation', value: char, position: ptr
      })

      char = text[++ptr]
      continue;
    }

    if (ESCAPE.test(char)) {
      let escaped = ''
      const start = ptr
      char = text[++ptr]
      while(LETTERS.test(char)){
        escaped += char
        char = text[++ptr]
      }
      const end = ptr
      tokens.push({type: 'escape', value: escaped, start, end})
      continue
    }

    if (char === '&') {
      let componentRefName = ''
      const start = ptr
      char = text[++ptr]
      if (WHITESPACE.test(char)){
        tokens.push({type: 'punctuation', value: "&", position: ptr})
        continue
      }

      while (LETTERS.test(char)){
        componentRefName += char;
        char = text[++ptr]
      }

      const props = []
      if (char === '[') {
        // try to extract KV properties
        const KEY_VALUE_PAIR = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
        const buffer = []

        char = text[++ptr] // skip "["

        while (char !== ']' && ptr < text.length) {
          buffer.push(char)
          char = text[++ptr]
        }

        if (char === ']' && buffer.length) {
          // process buffer
          let bufferPtr = 0
          let bufferChar = buffer[bufferPtr]
          while (bufferPtr < buffer.length) {
            let key=''
            while (bufferChar !== '=' && bufferPtr < buffer.length) {
              key += bufferChar
              bufferChar = buffer[++bufferPtr]
            }

            let value=''
            bufferChar = buffer[++bufferPtr] // skip the equal sign
            while (!WHITESPACE.test(bufferChar) && bufferPtr < buffer.length) {
              value += bufferChar
              bufferChar = buffer[++bufferPtr]
            }
            bufferChar = buffer[++bufferPtr] // skip white space
            let parsed 
            try {
              parsed = JSON.parse(value)
            } catch(e){
              parsed = value
            }
            props.push([key.trim(), parsed.trim()])
          }

          tokens.push({type: 'componentRefName', value: componentRefName, start, end: ptr, props: Object.fromEntries(props)})
          continue
        } 

        tokens.push({type: 'word', value: componentRefName.concat(...buffer), start, end: ptr })
        continue
      } else {
        tokens.push({type: 'componentRefName', value: componentRefName, start, end: ptr, props: {}})
      }
    }

    if (LETTERS.test(char)) {
      let word = ''
      const start = ptr
      while (LETTERS.test(char)) {
        word += char
        char = text[++ptr]
      }
      const end = ptr
      tokens.push({type: 'word', value: word, start, end})
      continue;
    }

    if (WHITESPACE.test(char)) {
      tokens.push({type: 'whitespace', value: ' ', position: ptr})
      char = text[++ptr]
      continue;
    }
    console.log("unknown token: %s", char)
    char = text[++ptr]
  }

  return tokens
}


type Token = {
  type: string, value: string, start: number, end: number
} | {
  type: string, value: string, position: number
}



export const Editor = ({onChange}: {onChange: (v:string)=>void}) => {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef(null);

  useEffect(() => {
    if (monacoEl.current) {
      if (editor) {
        return;
      }

      const standaloneEditor = monaco.editor.create(monacoEl.current!, {
        value: [
          "This is a demo, you can use & to use a component. For example: &DemoInput[value=\"test-field-1\"] ",
          "this way you can easily combine the field into the text. You can further refine the style",
          "here by clicking the element.",
        ].join('\n'),
        language: 'mySpecialLanguage',
        theme: 'myCoolTheme'
      });

      standaloneEditor.addCommand(monaco.KeyCode.F9, function () {
        alert("F9 pressed!");
      });

      standaloneEditor.onDidChangeModelContent((e) => {
        console.log('model content change', e)
        if (onChange){
          onChange( standaloneEditor.getValue())
        }
      })
      standaloneEditor.onDidChangeModel((e) => {
        console.log('model change', e)
      })

      setEditor(standaloneEditor)

      return () => standaloneEditor?.dispose();
    }

  }, []);

  return <div style={{width: "700px", height: "100vh"}} ref={monacoEl}></div>;
};


const DemoInput = (props: ComponentProps<'input'>) => <input {...props} />
const componentRefNameRegister = {
  'DemoInput': DemoInput,
  'DynamicField': (props: ComponentProps<typeof DynamicField>) => {
    if (props.fieldKey === 'test-field-1'){
      return <DynamicField {...props}/>
    }
    return null
  }
}


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
    const tokens = tokenize(val)
    const renderContent = tokens.map((token) => {
      if (token.type === 'componentRefName') {
        if (token.value in componentRefNameRegister) {
          return componentRefNameRegister[token.value](token.props)
        }
      }
      return token.value
    })
    setText(renderContent)
  }


  return (
    <StoreMapContext.Provider value={fieldStoreMap}>
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", padding: "1rem"}}>
        <div>
          <pre>
            coming soon:
            Edit section for field rules.
          </pre>

        </div>
        <div style={{position: "relative", width: "700px"}}>
          <Editor onChange={(v) => handleTextChange({target: {value: v}})} />
        </div>
        <div>
          <pre style={{maxHeight: "80dvh", overflowY: "auto"}}>{deferredText}</pre>
        </div>
      </div>
    </StoreMapContext.Provider>
  )
};
export default DemoPageCreation;
