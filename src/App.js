import React, { Component } from "react";
import Title from "./components/title";
import Description from "./components/description";
import Button from "./components/button";
import GithubCorner from "react-github-corner";
import Board from "./components/board";
import Select from "./components/select";
import RangeInput from "./components/range-input";
import Label from "./components/label";
import * as tf from "@tensorflow/tfjs";

const ROWS = 6;
const COLS = 7;
const CONSECUTIVE_TO_WIN = 4;
const OPTIONS = [
  "Player",
  "Very easy (random)",
  "Easy (1-step minimax)",
  "Normal (2-step minimax)",
  "(WIP) Hard (Q-learning)",
  "Very hard (4-step minimax)",
  "Extreme (6-step minimax)",
];
const AI_SPEED = 100;
const MINIMAX_DEPTH_1 = 1;
const MINIMAX_DEPTH_2 = 2;
const MINIMAX_DEPTH_4 = 4;
const MINIMAX_DEPTH_6 = 6;

const SIMULATE = false;
const P1 = 1;
const P2 = 1;
const MATCHES = 20;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      board: new Array(ROWS).fill(0).map(() => new Array(COLS).fill(0)),
      curPlayer: 1,
      winner: -1, // -1: game in progress, 0: draw, 1: player 1, 2: player 2
      p1: 0,
      p2: 0,
      aiSpeed: 0.2,
    };

    tf.setBackend("cpu");
  }

  componentDidMount() {
    if (SIMULATE) {
      this.matches = MATCHES;
      this.p1Wins = 0;
      this.p2Wins = 0;
      this.draws = 0;
      this.setState({ p1: P1, p2: P2 }, () => this.runAI());
    }
  }

  selectPlayer = (e, player) => {
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

  updateAISpeed = (e) => {
    this.setState(
      {
        aiSpeed: Number(e.target.value),
      },
      () => this.runAI()
    );
  };

  setNewGame = () => {
    // Reset board and choose random player to start
    this.setState(
      {
        board: new Array(ROWS).fill(0).map(() => new Array(COLS).fill(0)),
        curPlayer: 1,
        winner: -1,
      },
      () => this.runAI()
    );

    // Reset board button styles
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const button = document.getElementById(`button-${row}-${col}`);
        button.classList.remove("p1");
        button.classList.remove("p2");
        button.classList.remove("win");
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

    const row = this.getDropRow(this.state.board, col);

    // Column is full
    if (row === -1) {
      return;
    }

    // Add player class to button to change style
    const button = document.getElementById(`button-${row}-${col}`);
    button.classList.add(`p${this.state.curPlayer}`);

    // Copy board and drop disc
    const board = this.nextBoard(
      row,
      col,
      this.state.board,
      this.state.curPlayer
    );

    // Win
    let winner = -1;
    if (this.checkWin(board, row, col)) {
      winner = this.state.curPlayer;
    } else if (this.isBoardFull(board)) {
      // Draw
      winner = 0;
    }

    // Update board and current player
    this.setState(
      {
        board: board,
        curPlayer: (this.state.curPlayer % 2) + 1,
        winner: winner,
      },
      () => this.runAI()
    );
  };

  checkWin = (board, row, col) => {
    // 'win = checkWinHelper() || win' must be in that order or checkWinHelper() will not be called on all sliding windows
    let win = false;

    // Pivot on the placed disk
    for (let i = 0; i < CONSECUTIVE_TO_WIN; i++) {
      const leftBound = col - i;
      const rightBound = col + CONSECUTIVE_TO_WIN - i - 1;
      const topBound = row - i;
      const bottomBound = row + CONSECUTIVE_TO_WIN - i - 1;

      // Horizontal, right to left
      if (leftBound >= 0 && rightBound < COLS) {
        win =
          this.checkWinHelper(
            board,
            row,
            leftBound,
            false,
            true,
            false,
            false
          ) || win;
      }

      // Vertical, bottom to top
      if (topBound >= 0 && bottomBound < ROWS) {
        win =
          this.checkWinHelper(
            board,
            topBound,
            col,
            true,
            false,
            false,
            false
          ) || win;
      }

      // Negative Diagonal, bottom right to top left
      if (
        leftBound >= 0 &&
        rightBound < COLS &&
        topBound >= 0 &&
        bottomBound < ROWS
      ) {
        win =
          this.checkWinHelper(
            board,
            topBound,
            leftBound,
            true,
            true,
            false,
            false
          ) || win;
      }

      // Positive Diagonal, bottom left to top right
      const newLeftBound = col - CONSECUTIVE_TO_WIN + i + 1;
      const newRightBound = col + i;
      if (
        newLeftBound >= 0 &&
        newRightBound < COLS &&
        topBound >= 0 &&
        bottomBound < ROWS
      ) {
        win =
          this.checkWinHelper(
            board,
            topBound,
            newRightBound,
            true,
            true,
            false,
            true
          ) || win;
      }
    }

    return win;
  };

  checkWinHelper = (
    board,
    row,
    col,
    incrementRow,
    incrementCol,
    invertRow,
    invertCol
  ) => {
    // Check if all discs by player
    for (let offset = 0; offset < CONSECUTIVE_TO_WIN; offset++) {
      const r = row + (incrementRow ? (invertRow ? -offset : offset) : 0);
      const c = col + (incrementCol ? (invertCol ? -offset : offset) : 0);
      if (board[r][c] !== this.state.curPlayer) {
        return false;
      }
    }

    // Add win class to style button
    for (let offset = 0; offset < CONSECUTIVE_TO_WIN; offset++) {
      const r = row + (incrementRow ? (invertRow ? -offset : offset) : 0);
      const c = col + (incrementCol ? (invertCol ? -offset : offset) : 0);
      const button = document.getElementById(`button-${r}-${c}`);
      button.classList.add("win");
    }

    return true;
  };

  runAI = () => {
    // Only run AI if not game over
    if (this.state.winner !== -1) {
      if (SIMULATE) {
        if (this.state.winner === 1) {
          this.p1Wins++;
        } else if (this.state.winner === 2) {
          this.p2Wins++;
        } else {
          this.draws++;
        }

        this.matches--;

        if (this.matches === 0) {
          console.log(
            `P1: ${this.p1Wins} | P2: ${this.p2Wins} | Draws: ${this.draws}`
          );
        } else {
          this.setNewGame();
        }
      }

      return;
    }

    // Game not over
    clearTimeout(this.timer);
    this.timer = setTimeout(
      () => {
        if (this.state.curPlayer === 1 && this.state.p1 !== 0) {
          // Run AI for player 1
          if (this.state.p1 === 1) {
            this.randomAI();
          } else if (this.state.p1 === 2) {
            this.minimaxAI(MINIMAX_DEPTH_1);
          } else if (this.state.p1 === 3) {
            this.minimaxAI(MINIMAX_DEPTH_2);
          } else if (this.state.p1 === 4) {
            this.qLearningAI();
          } else if (this.state.p1 === 5) {
            this.minimaxAI(MINIMAX_DEPTH_4);
          } else if (this.state.p1 === 6) {
            this.minimaxAI(MINIMAX_DEPTH_6);
          }
        } else if (this.state.curPlayer === 2 && this.state.p2 !== 0) {
          // Run AI for player 2
          if (this.state.p2 === 1) {
            this.randomAI();
          } else if (this.state.p2 === 2) {
            this.minimaxAI(MINIMAX_DEPTH_1);
          } else if (this.state.p2 === 3) {
            this.minimaxAI(MINIMAX_DEPTH_2);
          } else if (this.state.p2 === 4) {
            this.qLearningAI();
          } else if (this.state.p2 === 5) {
            this.minimaxAI(MINIMAX_DEPTH_4);
          } else if (this.state.p2 === 6) {
            this.minimaxAI(MINIMAX_DEPTH_6);
          }
        }
      },
      SIMULATE ? 0 : AI_SPEED / this.state.aiSpeed
    );
  };

  randomAI() {
    const validMoves = this.getValidMoves(this.state.board);
    const [_, col] = validMoves[Math.floor(Math.random() * validMoves.length)];
    this.dropDisc(col);
  }

  minimaxAI(depth) {
    let maxVal = Number.NEGATIVE_INFINITY;
    let maxCols = [];
    for (const [validRow, validCol] of this.getValidMoves(this.state.board)) {
      const board = this.nextBoard(
        validRow,
        validCol,
        this.state.board,
        this.state.curPlayer
      );
      const val = this.minimax(
        board,
        depth - 1,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        false,
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
    }
    const randMaxCol = maxCols[Math.floor(Math.random() * maxCols.length)];
    this.dropDisc(randMaxCol);
  }

  minimax(board, depth, alpha, beta, maximizingPlayer, player) {
    // Game over when valid moves is empty
    if (depth === 0 || this.isGameOver(board)) {
      return this.getHeuristic(board, player);
    }

    if (maximizingPlayer) {
      let maxVal = Number.NEGATIVE_INFINITY;
      for (const [validRow, validCol] of this.getValidMoves(board)) {
        const nextBoard = this.nextBoard(validRow, validCol, board, player);
        const val = this.minimax(
          nextBoard,
          depth - 1,
          alpha,
          beta,
          false,
          player
        );
        maxVal = Math.max(maxVal, val);
        alpha = Math.max(alpha, val);
        if (alpha >= beta) {
          break;
        }
      }
      return maxVal;
    } else {
      let minVal = Number.POSITIVE_INFINITY;
      for (const [validRow, validCol] of this.getValidMoves(board)) {
        const nextBoard = this.nextBoard(
          validRow,
          validCol,
          board,
          (player % 2) + 1
        );
        const val = this.minimax(
          nextBoard,
          depth - 1,
          alpha,
          beta,
          true,
          player
        );
        minVal = Math.min(minVal, val);
        beta = Math.min(beta, val);
        if (beta <= alpha) {
          break;
        }
      }
      return minVal;
    }
  }

  qLearningAI() {}

  isGameOver(board) {
    return (
      this.countWindows(board, 1, CONSECUTIVE_TO_WIN) > 0 ||
      this.countWindows(board, 2, CONSECUTIVE_TO_WIN) > 0 ||
      this.isBoardFull(board)
    );
  }

  isBoardFull(board) {
    for (let col = 0; col < COLS; col++) {
      if (board[0][col] === 0) {
        return false;
      }
    }
    return true;
  }

  getHeuristic(board, player) {
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
        10 ** (2 * i + 1) * this.countWindows(board, player, i + 2);

      // Negative
      weightedSum -=
        10 ** (2 * i) * this.countWindows(board, (player % 2) + 1, i + 2);
    }

    return weightedSum;
  }

  countWindows(board, player, targetCount) {
    let count = 0;

    // Horizontal
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS - CONSECUTIVE_TO_WIN + 1; col++) {
        let playerCount = 0;
        let emptyCount = 0;

        // Count number of player discs and empty spots
        for (let i = 0; i < CONSECUTIVE_TO_WIN; i++) {
          const val = board[row][col + i];

          if (val === player) {
            playerCount++;
          } else if (val === 0) {
            emptyCount++;
          }
        }

        // Check if this window counts
        if (
          playerCount === targetCount &&
          emptyCount === CONSECUTIVE_TO_WIN - playerCount
        ) {
          count++;
        }
      }
    }

    // Vertical
    for (let row = 0; row < ROWS - CONSECUTIVE_TO_WIN + 1; row++) {
      for (let col = 0; col < COLS; col++) {
        let playerCount = 0;
        let emptyCount = 0;

        // Count number of player discs and empty spots
        for (let i = 0; i < CONSECUTIVE_TO_WIN; i++) {
          const val = board[row + i][col];

          if (val === player) {
            playerCount++;
          } else if (val === 0) {
            emptyCount++;
          }
        }

        // Check if this window counts
        if (
          playerCount === targetCount &&
          emptyCount === CONSECUTIVE_TO_WIN - playerCount
        ) {
          count++;
        }
      }
    }

    // Negative Diagonal
    for (let row = 0; row < ROWS - CONSECUTIVE_TO_WIN + 1; row++) {
      for (let col = 0; col < COLS - CONSECUTIVE_TO_WIN + 1; col++) {
        let playerCount = 0;
        let emptyCount = 0;

        // Count number of player discs and empty spots
        for (let i = 0; i < CONSECUTIVE_TO_WIN; i++) {
          const val = board[row + i][col + i];

          if (val === player) {
            playerCount++;
          } else if (val === 0) {
            emptyCount++;
          }
        }

        // Check if this window counts
        if (
          playerCount === targetCount &&
          emptyCount === CONSECUTIVE_TO_WIN - playerCount
        ) {
          count++;
        }
      }
    }

    // Positive Diagonal
    for (let row = 0; row < ROWS - CONSECUTIVE_TO_WIN + 1; row++) {
      for (let col = COLS - 1; col > CONSECUTIVE_TO_WIN - 2; col--) {
        let playerCount = 0;
        let emptyCount = 0;

        // Count number of player discs and empty spots
        for (let i = 0; i < CONSECUTIVE_TO_WIN; i++) {
          const val = board[row + i][col - i];

          if (val === player) {
            playerCount++;
          } else if (val === 0) {
            emptyCount++;
          }
        }

        // Check if this window counts
        if (
          playerCount === targetCount &&
          emptyCount === CONSECUTIVE_TO_WIN - playerCount
        ) {
          count++;
        }
      }
    }

    return count;
  }

  getValidMoves(board) {
    const validMoves = [];
    for (let col = 0; col < COLS; col++) {
      if (board[0][col] === 0) {
        const row = this.getDropRow(board, col);
        validMoves.push([row, col]);
      }
    }
    return validMoves;
  }

  getDropRow(board, col) {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === 0) {
        return row;
      }
    }
    return -1;
  }

  nextBoard(row, col, board, player) {
    // Deep copy the board
    const nextBoard = [];
    for (const row of board) {
      nextBoard.push(row.slice());
    }

    // Set the disc
    nextBoard[row][col] = player;

    return nextBoard;
  }

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
              onChange={(e) => this.selectPlayer(e, 1)}
            />
          </div>
          <div className="col col-auto pt-3">
            <h4>Player 2</h4>
            <Select
              options={OPTIONS}
              player={2}
              onChange={(e) => this.selectPlayer(e, 2)}
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
              onChange={this.updateAISpeed}
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
            <Button value="New Game" onClick={this.setNewGame} />
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
