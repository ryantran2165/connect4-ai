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
const IN_A_ROW = 4;
const OPTIONS = [
  "Player",
  "Easy (random)",
  "Normal (shallow minimax)",
  "Hard (neuroevolution)",
  "Crazy (deep minimax)",
];
const AI_SPEED = 100;

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
        } else if (this.state.p1 === 3) {
        } else if (this.state.p1 === 4) {
        }
      } else if (this.state.curPlayer === 2 && this.state.p2 !== 0) {
        // Run AI for player 2
        if (this.state.p2 === 1) {
          this.randomAI();
        } else if (this.state.p2 === 2) {
        } else if (this.state.p2 === 3) {
        } else if (this.state.p2 === 4) {
        }
      }
    }, AI_SPEED / this.state.aiSpeed);
  };

  randomAI() {
    const validCols = [];
    for (let c = 0; c < COLS; c++) {
      if (this.state.board[0][c] === 0) {
        validCols.push(c);
      }
    }
    const col = validCols[Math.floor(Math.random() * validCols.length)];
    this.dropDisc(col);
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
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const button = document.getElementById(`button-${r}-${c}`);
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

    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.state.board[r][col] === 0) {
        // Add player class to button to change style
        const button = document.getElementById(`button-${r}-${col}`);
        button.classList.add(`p${this.state.curPlayer}`);

        // Copy board and drop disc
        const newBoard = this.state.board;
        newBoard[r][col] = this.state.curPlayer;

        // Save current player to check win
        const player = this.state.curPlayer;

        // Update board and current player
        this.setState(
          {
            board: newBoard,
            curPlayer: (this.state.curPlayer % 2) + 1,
            movesRemaining: this.state.movesRemaining - 1,
          },
          () => {
            // Check win after setting updated board
            if (this.checkWin(r, col, player)) {
              this.setState({ winner: player });
            } else if (this.state.movesRemaining === 0) {
              // Draw
              this.setState({ winner: 0 });
            } else {
              this.runAI();
            }
          }
        );

        break;
      }
    }
  };

  checkWin = (row, col, player) => {
    let win = false;

    // Pivot on the placed disk
    for (let i = 0; i < IN_A_ROW; i++) {
      const leftBound = col - i;
      const rightBound = col + IN_A_ROW - i - 1;
      const topBound = row - i;
      const bottomBound = row + IN_A_ROW - i - 1;

      // Horizontal, right to left
      if (leftBound >= 0 && rightBound < COLS) {
        win =
          win ||
          this.checkWinHelper(
            row,
            leftBound,
            false,
            true,
            false,
            false,
            player
          );
      }

      // Vertical, bottom to top
      if (topBound >= 0 && bottomBound < ROWS) {
        win =
          win ||
          this.checkWinHelper(topBound, col, true, false, false, false, player);
      }

      // Negative Diagonal, bottom right to top left
      if (
        leftBound >= 0 &&
        rightBound < COLS &&
        topBound >= 0 &&
        bottomBound < ROWS
      ) {
        win =
          win ||
          this.checkWinHelper(
            topBound,
            leftBound,
            true,
            true,
            false,
            false,
            player
          );
      }

      // Positive Diagonal, bottom left to top right
      const newLeftBound = col - IN_A_ROW + i + 1;
      const newRightBound = col + i;
      if (
        newLeftBound >= 0 &&
        newRightBound < COLS &&
        topBound >= 0 &&
        bottomBound < ROWS
      ) {
        win =
          win ||
          this.checkWinHelper(
            topBound,
            newRightBound,
            true,
            true,
            false,
            true,
            player
          );
      }
    }

    return win;
  };

  checkWinHelper = (r, c, incR, incC, invertR, invertC, player) => {
    // Check if all discs by player
    for (let j = 0; j < IN_A_ROW; j++) {
      if (
        this.state.board[r + (incR ? (invertR ? -j : j) : 0)][
          c + (incC ? (invertC ? -j : j) : 0)
        ] !== player
      ) {
        return false;
      }
    }

    // Add win class to style button
    for (let j = 0; j < IN_A_ROW; j++) {
      const button = document.getElementById(
        `button-${r + (incR ? (invertR ? -j : j) : 0)}-${
          c + (incC ? (invertC ? -j : j) : 0)
        }`
      );
      if (!button.classList.contains("win")) {
        button.classList.add("win");
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
