import { ChangeEventHandler } from "react";

const RadioInput = ({name, onChange, options}: {
  name: string,
  // value: string,
  options: {name: string, value: string}[],
  onChange: ChangeEventHandler<HTMLInputElement>
}) => {
  return options.map((opt) => (
    <label key={opt.value}>
      {opt.name}
      <input type="radio" name={name} value={opt.value} onChange={onChange}/>
    </label>
  ))
}

export default RadioInput;