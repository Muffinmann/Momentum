import { ChangeEventHandler } from "react";

const RadioInput = ({name, value, onChange, options}: {
  name: string,
  value: string | undefined,
  options: {name: string, value: string}[],
  onChange: ChangeEventHandler<HTMLInputElement>
}) => {
  return options.map((opt) => (
    <label key={opt.value} style={{margin: "0.5rem 0.5rem"}}>
      {opt.name}
      <input 
        type="radio" 
        name={name}
        value={opt.value}
        onChange={onChange}
        {...(value === undefined ? {} : {checked: value === opt.value})}
      />
    </label>
  ))
}

export default RadioInput;