import FieldContext from "./FieldContext";


const Demo = () => {

  return (
    <div>
      <h1> Demo </h1>
      <div style={{display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1fr 1fr'}}>
        <FieldContext />  
        <FieldContext />  
        <FieldContext />  
      </div>
    </div>
  )
};
export default Demo;
