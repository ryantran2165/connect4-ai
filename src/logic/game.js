import * as tf from "@tensorflow/tfjs";
import {
  CONSECUTIVE_TO_WIN,
  ROWS,
  COLS,
  LOSS_REWARD,
  DRAW_REWARD,
  WIN_REWARD,
  STEP_REWARD,
  PLAYER_1,
  PLAYER_2,
} from "./constants";

export class Connect4Game {
  reset() {
    this.board = new Array(ROWS).fill(0).map(() => new Array(COLS).fill(0));
    this.turn = Math.random() < 0.5 ? PLAYER_1 : PLAYER_2;

    // Return the player that went first
    return this.turn;
  }

  step(action) {
    // Action is the chosen column
    let dropRow = this.getDropRow(action);

    // Update board
    this.board[dropRow][action] = this.turn;

    // Save old turn to check for win
    const oldTurn = this.turn;

    // Update turn
    this.turn = this.turn === PLAYER_1 ? PLAYER_2 : PLAYER_1;

    // Draw does not care who caused the draw
    if (this.checkDraw()) {
      return { reward: DRAW_REWARD, nextState: this.getState(), done: true };
    }

    // Reward is relative to PLAYER_1, not the player that went first
    if (this.checkWin(dropRow, action, oldTurn)) {
      const reward = oldTurn === PLAYER_1 ? WIN_REWARD : LOSS_REWARD;

      return { reward, nextState: this.getState(), done: true };
    }

    // Game not over
    return { reward: STEP_REWARD, nextState: this.getState(), done: false };
  }

  getDropRow(action) {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (this.board[row][action] === 0) {
        return row;
      }
    }
  }

  checkWin = (row, col, turn) => {
    // Pivot on the placed disc
    for (let i = 0; i < CONSECUTIVE_TO_WIN; i++) {
      const leftBound = col - i;
      const rightBound = col + CONSECUTIVE_TO_WIN - i - 1;
      const topBound = row - i;
      const bottomBound = row + CONSECUTIVE_TO_WIN - i - 1;

      // Horizontal, right to left
      if (
        leftBound >= 0 &&
        rightBound < COLS &&
        this.checkWinHelper(row, leftBound, false, true, false, false, turn)
      ) {
        return true;
      }

      // Vertical, bottom to top
      if (
        topBound >= 0 &&
        bottomBound < ROWS &&
        this.checkWinHelper(topBound, col, true, false, false, false, turn)
      ) {
        return true;
      }

      // Negative Diagonal, bottom right to top left
      if (
        leftBound >= 0 &&
        rightBound < COLS &&
        topBound >= 0 &&
        bottomBound < ROWS &&
        this.checkWinHelper(topBound, leftBound, true, true, false, false, turn)
      ) {
        return true;
      }

      // Positive Diagonal, bottom left to top right
      const newLeftBound = col - CONSECUTIVE_TO_WIN + i + 1;
      const newRightBound = col + i;
      if (
        newLeftBound >= 0 &&
        newRightBound < COLS &&
        topBound >= 0 &&
        bottomBound < ROWS &&
        this.checkWinHelper(
          topBound,
          newRightBound,
          true,
          true,
          false,
          true,
          turn
        )
      ) {
        return true;
      }
    }

    return false;
  };

  checkWinHelper = (
    row,
    col,
    incrementRow,
    incrementCol,
    invertRow,
    invertCol,
    turn
  ) => {
    // Check if all discs by current turn player
    for (let offset = 0; offset < CONSECUTIVE_TO_WIN; offset++) {
      const r = row + (incrementRow ? (invertRow ? -offset : offset) : 0);
      const c = col + (incrementCol ? (invertCol ? -offset : offset) : 0);

      if (this.board[r][c] !== turn) {
        return false;
      }
    }

    return true;
  };

  checkDraw() {
    // Check if any top row is empty
    for (let col = 0; col < COLS; col++) {
      if (this.board[0][col] === 0) {
        return false;
      }
    }

    // All top row is full
    return true;
  }

  getState() {
    // Deep copy the board
    const boardCopy = [];

    for (const row of this.board) {
      boardCopy.push([...row]);
    }

    return boardCopy;
  }

  getInvertedState() {
    const boardCopy = this.getState();

    // Invert player discs, leave empty slots alone
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (boardCopy[r][c] === PLAYER_1) {
          boardCopy[r][c] = PLAYER_2;
        } else if (boardCopy[r][c] === PLAYER_2) {
          boardCopy[r][c] = PLAYER_1;
        }
      }
    }

    return boardCopy;
  }

  getValidActions() {
    const validActions = [];

    // Valid action is column with empty top row
    for (let col = 0; col < COLS; col++) {
      if (this.board[0][col] === 0) {
        validActions.push(col);
      }
    }

    return validActions;
  }
}

export function getValidActions(board) {
  const validActions = [];

  // Valid action is column with empty top row
  for (let col = 0; col < COLS; col++) {
    if (board[0][col] === 0) {
      validActions.push(col);
    }
  }

  return validActions;
}

export function getStateCopy(board) {
  // Deep copy the board
  const boardCopy = [];

  for (const row of board) {
    boardCopy.push([...row]);
  }

  return boardCopy;
}

export function getInvertedState(board) {
  const boardCopy = getStateCopy(board);

  // Invert player discs, leave empty slots alone
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (boardCopy[r][c] === PLAYER_1) {
        boardCopy[r][c] = PLAYER_2;
      } else if (boardCopy[r][c] === PLAYER_2) {
        boardCopy[r][c] = PLAYER_1;
      }
    }
  }

  return boardCopy;
}

export function getStateTensor(state) {
  // Convert to array if not already
  if (!Array.isArray(state)) {
    state = [state];
  }

  // Shape: [batch size, rows, cols, 1 channel]
  return tf.tensor(state).reshape([-1, ROWS, COLS, 1]);
}
