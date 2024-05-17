import { ChangeEventHandler, ComponentProps, KeyboardEvent, KeyboardEventHandler, useDeferredValue, useEffect, useRef, useState } from "react";
import DynamicField from "./DynamicField";
import StoreMapContext from "./contexts";
import { FieldStore, createStoreMap } from "./core/store";

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
      while (LETTERS.test(char)){
        componentRefName += char;
        char = text[++ptr]
      }
      const props = []
      if (char === '[') {
        char = text[++ptr]

        while (char !== ']'){
          let key=''
          while (char !== '=') {
            key += char
            char = text[++ptr]
          }

          let value=''
          char = text[++ptr] // skip the equal sign
          while (!WHITESPACE.test(char) && char !== ']') {
            value += char
            char = text[++ptr]
          }
          props.push([key.trim(), JSON.parse(value.trim())])
        }
        char = text[++ptr] // skip "]"
      }
      const end = ptr;
      tokens.push({type: 'componentRefName', value: componentRefName, start, end, props: Object.fromEntries(props)})
      continue
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

console.log(tokenize(defaultText))

type Token = {
  type: string, value: string, start: number, end: number
} | {
  type: string, value: string, position: number
}



// const parseLines = (tokens: Token[]) => {
//   let currentLine = null
//   let first
// //  const lines: Line[] = []
//  let lineCount = 1;
//  let stack: Token[] = [];
//  for (const token of tokens) {
//     if (token.type === 'linefeed') {
//       const newLine = new Line(lineCount, stack)
//       if (currentLine !== null) {
//         currentLine.next = newLine
//         newLine.previous = currentLine
//       } else {
//         currentLine = newLine
//         first = currentLine
//       }

//       stack = []
//       lineCount += 1
//       currentLine = newLine
//       continue
//     }
//     stack.push(token)
//  }
// //  for (let i=0; i<lines.length -2; i++) {
// //   const current = lines[i]
// //   const next = lines[i+1]
// //   current.next = next
// //   next.previous = current
// //  }
//   return first
// }
// console.log(parseLines(tokenize(defaultText)))

const componentRefNameRegister = {
  'DynamicField': (props: ComponentProps<typeof DynamicField>) => <DynamicField {...props}/>
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
    // console.log("selection end:", e.target.selectionEnd, e)
    // console.log(e)
    // const match = val.match(/&DynamicField/)
    // console.log('match: ', match)
    // const cropped = match ? val.slice(0, match.index) : val
    // setText([cropped, match ? <DynamicField fieldKey="test-field-1" /> : null, match ? val.slice(match.index + match[0].length) : null])
    // const parsed = val.replace('&DynamicField', '')
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

  const handleKeydown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    // console.log('key down', e)
    console.log(e.code+' key down \u2193',e.target.selectionStart, e.target.selectionEnd, e)
  }
  return (
    <StoreMapContext.Provider value={fieldStoreMap}>
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", padding: "1rem"}}>
        <div>
          <textarea
            ref={textRef}
            style={{width: "700px", height: "100%", padding: "0.5rem"}}
            onChange={handleTextChange}
            onKeyDown={handleKeydown}
            onKeyUp={(e) => {console.log(e.code+' key up \u2191',  e.target.selectionStart, e.target.selectionEnd, e)}}
            // onPointerMove={(e) => console.log('pointer move: ', e,e.target.selectionStart, e.target.selectionEnd)}
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
