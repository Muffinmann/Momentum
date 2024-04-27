import { FactContextListener, Value } from "../types"

class FactContext{
  listeners: {key: string, cb: FactContextListener}[] = []
  constructor(){}
  onChange(key: string, cb: FactContextListener){
    this.listeners.push({key,cb})
  }
  notify(from: string, v:Value){
    this.listeners.forEach((listener) => {
      if (listener.key !== from) {
        listener.cb(from, v)
      }
    })
  }
}

export default FactContext