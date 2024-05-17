// TODO
const CARET_MOVEMENT = /arrow(up|down|left|right)/i
const MODIFIER = /control|shift/i
const DELETE = /backspace|delete/i
const EXCLUDE = /arrow(up|down|left|right)|control|shift|backspace|delete/i
class Editor{
  lines: Line[]
  caretPosition: number | [number, number] = [0, 0]
  constructor(lines: Line[] = []){
    this.lines = lines
  }
  setCaret(s: number, e: number){
    this.caretPosition = [s, e]
  }
  onKeyUp(e: KeyboardEvent<HTMLTextAreaElement>){
    const keystroke = e.key
    const target = e.target as HTMLTextAreaElement
    if (CARET_MOVEMENT.test(keystroke)) {
      const selectionStart = target.selectionStart
      const selectionEnd = target.selectionEnd
      if (selectionEnd === selectionStart) {
        this.caretPosition = selectionEnd
      } else {
      this.caretPosition = [selectionStart, selectionEnd] 
      }
    }
  }
  onPointerMove(e){}

  get actionHandler(){
    return {
      onKeyUp: this.onKeyUp.bind(this),
      onPointerMove: this.onPointerMove.bind(this)
    }
  }
}


class Line {
  id: number
  tokens: Token[] = []
  _next: Line | null = null
  _previous: Line | null = null
  constructor(id: number, tokens: Token[]) {
    this.id = id
    this.tokens = tokens
  }
  get next() {
    return this._next
  }
  set next(n: Line | null) {
    this._next = n
  }

  get previous() {
    return this._previous
  }
  set previous(p: Line | null) {
    this._previous = p
  }
  get start() {
    const first = this.tokens[0]
    if (first === undefined) {
      return undefined
    }
    if ('position' in first) {
      return first.position
    } else {
      return first.start
    }
  }
  get end() {
    const last = this.tokens[this.tokens.length - 1]
    if (last === undefined) {
      return undefined
    }

    if ('position' in last) {
      return last.position
    } else {
      return last.end
    }
  }

  // break(index: number){
    // TODO break the line into two
  // }
  // insertChar(index:number, value: string){
    // TODO insert character
  // }
  // deleteChar(index: number) {
    // TODO delete character
  // }
}