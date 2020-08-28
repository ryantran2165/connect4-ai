import React from "react";

const Select = ({ options, player, onChange }) => {
  return (
    <select onChange={onChange}>
      {options.map((option) => {
        return <option key={`p${player}-${option}`}>{option}</option>;
      })}
    </select>
  );
};

export default Select;
