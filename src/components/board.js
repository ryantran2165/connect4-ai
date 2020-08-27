import React, { Component } from "react";

const ROWS = 6;
const COLS = 7;

class Board extends Component {
  constructor(props) {
    super(props);
    this.state = {
      board: new Array(ROWS).fill(0).map(() => new Array(COLS).fill(0)),
      curPlayer: 1,
    };
  }

  dropDisc = (row, col) => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.state.board[r][col] === 0) {
        // Copy board and drop disc
        const newBoard = this.state.board;
        newBoard[r][col] = this.state.curPlayer;

        // Update board and current player
        this.setState({
          board: newBoard,
          curPlayer: (this.state.curPlayer % 2) + 1,
        });

        // Add player class to button to change style
        const button = document.getElementById(`button-${r}-${col}`);
        button.classList.add(`p${this.state.curPlayer}`);

        break;
      }
    }
  };

  render() {
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
              onClick={() => this.dropDisc(r, c)}
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
  }
}

export default Board;
