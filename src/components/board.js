import React from "react";

const Board = ({ ROWS, COLS, onClick }) => {
  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    const cols = [];
    for (let c = 0; c < COLS; c++) {
      const col = (
        <td key={r + "-" + c}>
          <button
            type="button"
            className="board-button"
            id={`button-${r}-${c}`}
            onClick={() => onClick(c)}
          ></button>
        </td>
      );
      cols.push(col);
    }
    const row = <tr key={r}>{cols}</tr>;
    rows.push(row);
  }
  return (
    <div className="table-responsive">
      <table className="table">
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
};

export default Board;
