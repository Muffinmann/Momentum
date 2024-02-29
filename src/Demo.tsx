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
  rules: undefined | object,
}

/**
 * 1. unqiue field, rule props need to be merged among all contexts, only one value possible.
 * 2. non-unique field,  rule props and value varies in different context.
 * 3. field with same key can appear in different pages, or appear multiple times in the same page.
 */
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

const v2ProductType1 = {
  tags: ['UE', 'DFO'],
  displayName: 'DFO',
  pages: ['demo-page-key-1', 'demo-page-key-2'],
  pageFields: {
    'demo-page-key-1/section-key-1': ['demo-field-1', 'demo-field-2'],
    'demo-page-key-2/section-key-1': ['demo-field-3'],
  },
  fields: [
    demoFieldDef1,
    demoFieldDef2,
    demoFieldDef3,
  ]
}

const v2ProductType2 = {
  tags: ['UE', 'AFO'],
  displayName: 'AFO',
  pages: ['demo-page-key-1', 'demo-page-key-2', 'demo-page-key-3'],
  pageFields: {
    'demo-page-key-1/section-key-1': ['demo-field-1', 'demo-field-2'],
    'demo-page-key-2/section-key-1': ['demo-field-4'],
  },
  fields: [
    demoFieldDef1,
    demoFieldDef2,
    demoFieldDef3,
  ]
}

const v3ProductType = {
  tags: ['UE', 'AFO'],
  displayName: 'AFO',
  dir: 'ot/ue',
  pages: ['demo-page-key-1', 'demo-page-key-2', 'demo-page-key-3'], // fields are pre-defined in each page
  fieldRules: {
    demoFieldDef1: {
      isVisible: true
    },
    demoFieldDef2: {
      required: { "if": [{ "===": [{ "var": "field-1" }, "target"] }, true, false] }
    },
    demoFieldDef3: {},
  }
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


const createFieldRegister = () => {
  const records = new Map()
  const uniqueDefs = new Set()
  return {
    add(fDef: FieldDefinition, pId: string) {
      const key = fDef.key
      if (!records.has(key)) {
        records.set(key, [])
        if (fDef.unique) {
          uniqueDefs.add(key)
        }
      }
      records.get(key).push({
        pId,
        def: fDef
      })

    },
    get(key: string) {
      if (uniqueDefs.has(key)) {
        const defs = records.get(key)
        return {
          type: 'unique',
          ruleMergeMethods: {
            isVisible: (rs) => rs.some(Boolean),
            required: (rs) => rs.some(Boolean),
            value: (rs) => rs[0],
          },
          def: {
            ...defs[0],
            rules: {
              isVisible: defs.map((def) => def.rules.isVisible),
              required: defs.map((def) => def.rules.required),
              value: defs.map((def) => def.rules.value),
            }
          }
        }
      }
    }
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
