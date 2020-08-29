import React, { Component } from "react";
import Title from "./components/title";
import Description from "./components/description";
import Button from "./components/button";
import GithubCorner from "react-github-corner";
import Board from "./components/board";
import Select from "./components/select";
import RangeInput from "./components/range-input";
import Label from "./components/label";

const ROWS = 6;
const COLS = 7;
const CONSECUTIVE_TO_WIN = 4;
const OPTIONS = [
  "Player",
  "Easy (random)",
  "Normal (shallow minimax)",
  "Hard (neuroevolution)",
  "Crazy (deep minimax)",
];
const AI_SPEED = 100;
const MINIMAX_NORMAL_DEPTH = 1;
const MINIMAX_CRAZY_DEPTH = 5;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      board: new Array(ROWS).fill(0).map(() => new Array(COLS).fill(0)),
      curPlayer: 1 + Math.floor(2 * Math.random()),
      winner: -1, // -1: game in progress, 0: draw, 1: player 1, 2: player 2
      p1: 0, // 0: player, 1: easy, 2: normal, 3: hard, 4: crazy
      p2: 0,
      movesRemaining: ROWS * COLS,
      aiSpeed: 0.2,
    };
  }

  runAI = () => {
    // Only run AI if not game over
    if (this.state.winner !== -1) {
      return;
    }

    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.state.curPlayer === 1 && this.state.p1 !== 0) {
        // Run AI for player 1
        if (this.state.p1 === 1) {
          this.randomAI();
        } else if (this.state.p1 === 2) {
          this.minimaxAI(MINIMAX_NORMAL_DEPTH);
        } else if (this.state.p1 === 3) {
        } else if (this.state.p1 === 4) {
        }
      } else if (this.state.curPlayer === 2 && this.state.p2 !== 0) {
        // Run AI for player 2
        if (this.state.p2 === 1) {
          this.randomAI();
        } else if (this.state.p2 === 2) {
          this.minimaxAI(MINIMAX_NORMAL_DEPTH);
        } else if (this.state.p2 === 3) {
        } else if (this.state.p2 === 4) {
        }
      }
    }, AI_SPEED / this.state.aiSpeed);
  };

  randomAI() {
    const validMoves = this.getValidMoves(this.state.board);
    const [_, col] = validMoves[Math.floor(Math.random() * validMoves.length)];
    this.dropDisc(col);
  }

  minimaxAI(depth) {
    let maxVal = Number.NEGATIVE_INFINITY;
    let maxCols = [];
    let vals = [];
    for (let [validRow, validCol] of this.getValidMoves(this.state.board)) {
      const val = this.minimax(
        this.state.board,
        validCol,
        depth,
        true,
        this.state.curPlayer
      );
      if (val > maxVal) {
        // New max value
        maxVal = val;

        // New max columns array
        maxCols = [validCol];
      } else if (val === maxVal) {
        // Same max value, add to array of possible choices
        maxCols.push(validCol);
      }
      vals.push(val);
    }
    console.log(vals);
    const randMaxCol = maxCols[Math.floor(Math.random() * maxCols.length)];
    this.dropDisc(randMaxCol);
  }

  minimax(board, col, depth, maximizingPlayer, player) {
    // Game over when valid moves is empty
    if (depth === 0 || this.getValidMoves(board).length === 0) {
      const heuristic = this.heuristic(board, col, player);
      // console.log(heuristic);
      return heuristic;
    }

    if (maximizingPlayer) {
      let maxVal = Number.NEGATIVE_INFINITY;
      for (let [validRow, validCol] of this.getValidMoves(board)) {
        const boardCopy = this.copyBoard(validRow, validCol, board, player);
        const val = this.minimax(boardCopy, validCol, depth - 1, false, player);
        maxVal = Math.max(maxVal, val);
      }
      return maxVal;
    } else {
      let minVal = Number.POSITIVE_INFINITY;
      for (let [validRow, validCol] of this.getValidMoves(board)) {
        const boardCopy = this.copyBoard(
          validRow,
          validCol,
          board,
          (player % 2) + 1
        );
        const val = this.minimax(boardCopy, validCol, depth - 1, true, player);
        minVal = Math.min(minVal, val);
      }
      return minVal;
    }
  }

  heuristic(board, col, player) {
    const row = this.getDropRow(col);
    let weightedSum = 0;

    // Weights increase alternatingly
    /*
        p1_4: 1e5
        p1_3: 1e3
        p1_2: 1e1
        p2_2: -1e0
        p2_3: -1e2
        p2_4: -1e4
     */
    for (let i = 0; i < CONSECUTIVE_TO_WIN - 1; i++) {
      // Positive
      weightedSum +=
        10 ** (2 * i + 1) *
        this.countConsecutive(board, row, col, player, i + 2, false);

      // Negative
      // weightedSum -=
      //   10 ** (2 * i) *
      //   this.countConsecutive(board, row, col, (player % 2) + 1, i + 2, false);
    }

    return weightedSum;
  }

  getValidMoves(board) {
    const validMoves = [];
    for (let col = 0; col < COLS; col++) {
      if (board[0][col] === 0) {
        const row = this.getDropRow(col);
        validMoves.push([row, col]);
      }
    }
    return validMoves;
  }

  copyBoard(row, col, board, player) {
    // Deep copy the board
    const boardCopy = [];
    for (let row of board) {
      boardCopy.push(row.slice());
    }

    // Set the disc
    boardCopy[row][col] = player;

    return boardCopy;
  }

  handleSelectChange = (e, player) => {
    if (player === 1) {
      this.setState(
        {
          p1: e.target.selectedIndex,
        },
        () => this.runAI()
      );
    } else if (player === 2) {
      this.setState(
        {
          p2: e.target.selectedIndex,
        },
        () => this.runAI()
      );
    }
  };

  handleNewGame = () => {
    // Reset board and choose random player to start
    this.setState(
      {
        board: new Array(ROWS).fill(0).map(() => new Array(COLS).fill(0)),
        curPlayer: 1 + Math.floor(2 * Math.random()),
        winner: -1,
        movesRemaining: ROWS * COLS,
      },
      () => this.runAI()
    );

    // Reset board button styles
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const button = document.getElementById(`button-${row}-${col}`);
        if (button.classList.contains("p1")) {
          button.classList.remove("p1");
        }
        if (button.classList.contains("p2")) {
          button.classList.remove("p2");
        }
        if (button.classList.contains("win")) {
          button.classList.remove("win");
        }
      }
    }
  };

  handlePlayerClick = (col) => {
    // Don't allow player to drop disc when AI's turn
    if (
      (this.state.curPlayer === 1 && this.state.p1 === 0) ||
      (this.state.curPlayer === 2 && this.state.p2 === 0)
    ) {
      this.dropDisc(col);
    }
  };

  dropDisc = (col) => {
    // Don't allow drop if game over
    if (this.state.winner !== -1) {
      return;
    }

    const row = this.getDropRow(col);

    // Column is full
    if (row === -1) {
      return;
    }

    // Add player class to button to change style
    const button = document.getElementById(`button-${row}-${col}`);
    button.classList.add(`p${this.state.curPlayer}`);

    // Copy board and drop disc
    const board = this.copyBoard(
      row,
      col,
      this.state.board,
      this.state.curPlayer
    );

    // Win
    let winner = -1;
    if (
      this.countConsecutive(
        board,
        row,
        col,
        this.state.curPlayer,
        CONSECUTIVE_TO_WIN,
        true
      ) > 0
    ) {
      winner = this.state.curPlayer;
    } else if (this.state.movesRemaining === 1) {
      // Draw
      winner = 0;
    }

    // Update board and current player
    this.setState(
      {
        board: board,
        curPlayer: (this.state.curPlayer % 2) + 1,
        movesRemaining: this.state.movesRemaining - 1,
        winner: winner,
      },
      () => this.runAI()
    );
  };

  getDropRow(col) {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (this.state.board[row][col] === 0) {
        return row;
      }
    }
    return -1;
  }

  countConsecutive = (board, row, col, player, consecutive, addWinClass) => {
    let consecutiveCount = 0;

    // Pivot on the placed disk
    for (let i = 0; i < consecutive; i++) {
      const leftBound = col - i;
      const rightBound = col + consecutive - i - 1;
      const topBound = row - i;
      const bottomBound = row + consecutive - i - 1;

      // Horizontal, right to left
      if (leftBound >= 0 && rightBound < COLS) {
        if (
          this.checkConsecutive(
            board,
            row,
            leftBound,
            false,
            true,
            false,
            false,
            player,
            consecutive,
            addWinClass
          )
        ) {
          consecutiveCount++;
        }
      }

      // Vertical, bottom to top
      if (topBound >= 0 && bottomBound < ROWS) {
        if (
          this.checkConsecutive(
            board,
            topBound,
            col,
            true,
            false,
            false,
            false,
            player,
            consecutive,
            addWinClass
          )
        ) {
          consecutiveCount++;
        }
      }

      // Negative Diagonal, bottom right to top left
      if (
        leftBound >= 0 &&
        rightBound < COLS &&
        topBound >= 0 &&
        bottomBound < ROWS
      ) {
        if (
          this.checkConsecutive(
            board,
            topBound,
            leftBound,
            true,
            true,
            false,
            false,
            player,
            consecutive,
            addWinClass
          )
        ) {
          consecutiveCount++;
        }
      }

      // Positive Diagonal, bottom left to top right
      const newLeftBound = col - consecutive + i + 1;
      const newRightBound = col + i;
      if (
        newLeftBound >= 0 &&
        newRightBound < COLS &&
        topBound >= 0 &&
        bottomBound < ROWS
      ) {
        if (
          this.checkConsecutive(
            board,
            topBound,
            newRightBound,
            true,
            true,
            false,
            true,
            player,
            consecutive,
            addWinClass
          )
        ) {
          consecutiveCount++;
        }
      }
    }

    return consecutiveCount;
  };

  checkConsecutive = (
    board,
    row,
    col,
    incrementRow,
    incrementCol,
    invertRow,
    invertCol,
    player,
    consecutive,
    addWinClass
  ) => {
    // Check if all discs by player
    for (let offset = 0; offset < consecutive; offset++) {
      const r = row + (incrementRow ? (invertRow ? -offset : offset) : 0);
      const c = col + (incrementCol ? (invertCol ? -offset : offset) : 0);
      if (board[r][c] !== player) {
        return false;
      }
    }

    // Add win class to style button
    if (addWinClass) {
      for (let offset = 0; offset < consecutive; offset++) {
        const r = row + (incrementRow ? (invertRow ? -offset : offset) : 0);
        const c = col + (incrementCol ? (invertCol ? -offset : offset) : 0);
        const button = document.getElementById(`button-${r}-${c}`);
        if (!button.classList.contains("win")) {
          button.classList.add("win");
        }
      }
    }

    return true;
  };

  updateState = (e) => {
    this.setState(
      {
        [e.target.id]: e.target.value,
      },
      () => this.runAI()
    );
  };

  render() {
    let turnText;
    if (this.state.winner !== -1) {
      if (this.state.winner === 0) {
        turnText = "Draw";
      } else {
        turnText = `Player ${this.state.winner} wins`;
      }
    } else {
      turnText = `Player ${this.state.curPlayer} turn`;
    }

    return (
      <div className="App container-fluid text-center pt-5">
        <div className="row">
          <div className="col">
            <Title text="Connect 4 AI" />
          </div>
        </div>
        <div className="row">
          <div className="col">
            <Description
              text={"Play versus Player/AI or watch AI play against AI."}
            />
          </div>
        </div>
        <div className="row justify-content-center">
          <div className="col col-auto pt-3">
            <h4>Player 1</h4>
            <Select
              options={OPTIONS}
              player={1}
              onChange={(e) => this.handleSelectChange(e, 1)}
            />
          </div>
          <div className="col col-auto pt-3">
            <h4>Player 2</h4>
            <Select
              options={OPTIONS}
              player={2}
              onChange={(e) => this.handleSelectChange(e, 2)}
            />
          </div>
        </div>
        <div className="row justify-content-center pt-3">
          <div className="col col-10 col-sm-8 col-md-6 col-lg-4 col-xl-2">
            <RangeInput
              min={0.01}
              max={1}
              step={0.01}
              defaultValue={this.state.aiSpeed}
              id="aiSpeed"
              onChange={this.updateState}
            />
          </div>
        </div>
        <div className="row">
          <div className="col">
            <Label text="AI speed" value={this.state.aiSpeed} />
          </div>
        </div>
        <div className="row justify-content-center pt-3">
          <div className="col">
            <Button value="New Game" onClick={this.handleNewGame} />
          </div>
        </div>
        <div className="row justify-content-center">
          <div className="col col-auto pt-5">
            <h4>{turnText}</h4>
          </div>
        </div>
        <div className="row justify-content-center pt-3">
          <div className="col col-auto">
            <Board ROWS={ROWS} COLS={COLS} onClick={this.handlePlayerClick} />
          </div>
        </div>
        <GithubCorner
          href="https://github.com/ryantran2165/connect4-ai"
          bannerColor="#222"
          octoColor="#7fffd4"
          target="_blank"
        />
      </div>
    );
  }
}

export default App;
