import { ReactElement, ReactNode } from "react"

type Logic = object | boolean | string | number | Logic[]
type FieldDefinition = {
  key: string,
  unique: boolean, // context indenpendent
  inputType: 'text' | 'number' | 'radiogroup' | 'checkbox',
  // keepValue: boolean,  # Might be not necessary?
  rules: Partial<{
    isVisible: Logic,
    required: Logic,
    value: Logic
  }>
  page: string,
  pageSlot: string,
}

/**
 *  For creating field definitions. This is important because some properties like 'unique' should not be
 *  modified during the creation.
 */
type MetaFieldDefinition = {
  key: string,
  unique: boolean,
  inputType: 'text' | 'number' | 'radiogroup' | 'checkbox',
}

const demoFieldDef1: FieldDefinition = {
  key: 'demo-field-1',
  unique: true,
  inputType: 'text',
  rules: {
    isVisible: true,
    required: true,
  },
  page: 'demo-page-1',
  pageSlot: 'main/section-key-1',
}

const demoFieldDef2: FieldDefinition = {
  key: 'demo-field-2',
  unique: true,
  inputType: 'text',
  rules: {
    isVisible: true,
    required: {
      "if": [
        { "===": [{ var: "demo-field-1" }, "target"] },
        true,
        false
      ]
    }
  },
  page: 'demo-page-1',
  pageSlot: 'main/section-key-1',
}
const demoFieldDef3: FieldDefinition = {
  key: 'demo-field-3',
  unique: false,
  inputType: 'text',
  rules: {
    isVisible: true
  },
  page: 'demo-page-2',
  pageSlot: 'main/section-key-1',
}


const demoFieldDef4: FieldDefinition = {
  key: 'demo-field-1',
  unique: true,
  inputType: 'text',
  rules: {
    isVisible: true,
    required: false
  },
  page: 'demo-page-1',
  pageSlot: 'main/section-key-1',
}
const demoFieldDef5: FieldDefinition = {
  key: 'demo-field-3',
  unique: false,
  inputType: 'text',
  rules: {
    isVisible: true,
    required: true,
  },
  page: 'demo-page-2',
  pageSlot: 'main/section-key-1',
}
const productTypeA = {
  tags: ['UE', 'DFO'],
  displayName: 'PT-1',
  fieldDefs: [
    demoFieldDef1,
    demoFieldDef2,
    demoFieldDef3,
  ]
}

const productTypeB = {
  tags: ['UE', 'AFO'],
  displayName: 'PT-2',
  fieldDefs: [
    demoFieldDef4,
    demoFieldDef5,
  ]
}

type PageContent = ReactElement | ReactElement
type LayoutDescriptor = any

type PageSection = {
  key: string,
  displayName: string,
  layout: LayoutDescriptor,
  content: PageContent
}

type PageMain = {
  key: string,
  displayName: string,
  layout: LayoutDescriptor,
  sections: PageSection[]
}

type PageRegisterEntry = {
  path: string, // 'main/section-key-1/ 
  content: PageContent,
}

const createPageRegister = () => {
  const registry = new Map()

  return {
    add(entry: PageRegisterEntry) { },
    getAll() { },
  }
}


const createFieldDefManager = () => {
  const members = []
  return {
    add(def: FieldDefinition) {
      if (def.unique) {
        if (members.length === 0) {
          members.push(def)
        }
      } else {
        members.push(def)
      }
    }
  }
}
const createFieldRegister = () => {
  const registry = new Map()
  return {
    add(fDef: FieldDefinition) {
      const fieldKey = fDef.key
      if (!registry.has(fieldKey)) {
        const fieldDefManager = createFieldDefManager()
        fieldDefManager.add(fDef)
        registry.set(fieldKey, fieldDefManager)
      } else {
        const fieldDefManager = registry.get(fieldKey)
        fieldDefManager.add(fDef)
      }
    },
  }
}





const Demo = () => {
  return (
    <div>
      Coming soon...
    </div>
  )
};
export default Demo;
