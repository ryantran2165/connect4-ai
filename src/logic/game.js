import * as tf from "@tensorflow/tfjs";
import {
  CONSECUTIVE_TO_WIN,
  ROWS,
  COLS,
  GAME_IN_PROGRESS,
  PLAYER_1,
  DRAW,
  PLAYER_2,
  TRAIN_Q_LEARNING,
  LOSS_REWARD,
  DRAW_REWARD,
  WIN_REWARD,
  STEP_REWARD,
} from "./constants";

export class Connect4Game {
  /**
   * Resets the game on creation.
   */
  constructor() {
    this.reset();
  }

  /**
   * Resets the game, which is the board and the turn.
   * @return {number} (if TRAIN_Q_LEARNING) the player that goes first
   */
  reset() {
    this.board = new Array(ROWS).fill(0).map(() => new Array(COLS).fill(0));

    if (TRAIN_Q_LEARNING) {
      this.turn = Math.random() < 0.5 ? PLAYER_1 : PLAYER_2;

      // Return the player that went first
      return this.turn;
    }

    // If not training, PLAYER_1 always starts
    this.turn = PLAYER_1;
  }

  /**
   * Steps the game with the given action (column).
   * @param {number} action The action to step the game with
   * @return {Object} (if TRAIN_Q_LEARNING) the reward, next state, and done flag; otherwise the new board, turn, winner, and drop row
   */
  step(action) {
    // Action is the chosen column
    let dropRow = this.getDropRow(action);

    // Update board
    this.board[dropRow][action] = this.turn;

    // Save old turn to check for win
    const oldTurn = this.turn;

    // Update turn
    this.turn = this.turn === PLAYER_1 ? PLAYER_2 : PLAYER_1;

    if (this.checkDraw()) {
      if (TRAIN_Q_LEARNING) {
        // Draw does not care who caused the draw
        return { reward: DRAW_REWARD, nextState: this.getState(), done: true };
      }

      return { board: this.getState(), turn: this.turn, winner: DRAW, dropRow };
    }

    if (this.checkWin(dropRow, action, oldTurn)) {
      if (TRAIN_Q_LEARNING) {
        // Reward is relative to PLAYER_1, not the player that went first
        const reward = oldTurn === PLAYER_1 ? WIN_REWARD : LOSS_REWARD;

        return { reward, nextState: this.getState(), done: true };
      }

      return {
        board: this.getState(),
        turn: this.turn,
        winner: oldTurn,
        dropRow,
      };
    }

    if (TRAIN_Q_LEARNING) {
      // Game not over
      return { reward: STEP_REWARD, nextState: this.getState(), done: false };
    }

    return {
      board: this.getState(),
      turn: this.turn,
      winner: GAME_IN_PROGRESS,
      dropRow,
    };
  }

  /**
   * Returns a copy of the board.
   * @return {Array} a copy of the board.
   */
  getState() {
    // Deep copy the board
    const boardCopy = [];

    for (const row of this.board) {
      boardCopy.push([...row]);
    }

    return boardCopy;
  }

  /**
   * Returns a copy of the board with inverted player values.
   * @return {Array} a copy of the board with inverted player values
   */
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

  /**
   * Returns whether the game is a draw.
   * @return {boolean} whether the game is a draw
   */
  checkDraw() {
    return checkDraw(this.board);
  }

  /**
   * Returns whether the game is won by the turn player's piece at the row and column.
   * @param {number} row The row to check
   * @param {number} col The column to check
   * @param {number} turn The player to check
   * @return {boolean} whether the game is won by the turn player's piece at the row and column
   */
  checkWin = (row, col, turn) => {
    /*
     * Only if !TRAIN_Q_LEARNING.
     * win = checkWinHelper() || win must be in that order,
     * otherwise checkWinHelper() will not be called on all sliding windows,
     * and not all wins will be shown by the button styles.
     */
    let win = false;

    // Pivot on the placed disc
    for (let i = 0; i < CONSECUTIVE_TO_WIN; i++) {
      const leftBound = col - i;
      const rightBound = col + CONSECUTIVE_TO_WIN - i - 1;
      const topBound = row - i;
      const bottomBound = row + CONSECUTIVE_TO_WIN - i - 1;

      // Horizontal, right to left
      if (leftBound >= 0 && rightBound < COLS) {
        win =
          this.checkWinHelper(
            row,
            leftBound,
            false,
            true,
            false,
            false,
            turn
          ) || win;

        if (win && TRAIN_Q_LEARNING) {
          return true;
        }
      }

      // Vertical, bottom to top
      if (topBound >= 0 && bottomBound < ROWS) {
        win =
          this.checkWinHelper(topBound, col, true, false, false, false, turn) ||
          win;

        if (win && TRAIN_Q_LEARNING) {
          return true;
        }
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
            topBound,
            leftBound,
            true,
            true,
            false,
            false,
            turn
          ) || win;

        if (win && TRAIN_Q_LEARNING) {
          return true;
        }
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
            topBound,
            newRightBound,
            true,
            true,
            false,
            true,
            turn
          ) || win;

        if (win && TRAIN_Q_LEARNING) {
          return true;
        }
      }
    }

    return win;
  };

  /**
   * Returns whether this portion of the board contains a win by the current turn player.
   * @param {number} row The row to check
   * @param {number} col The column to check
   * @param {boolean} incrementRow Whether to increment the row
   * @param {boolean} incrementCol Whether to increment the column
   * @param {boolean} invertRow Whether to invert the increment direction for row
   * @param {boolean} invertCol Whether to invert the increment direction for column
   * @param {number} turn The current player
   * @return {boolean} Whether this portion of the board contains a win by the current turn player
   */
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

    // Add win class to style button
    for (let offset = 0; offset < CONSECUTIVE_TO_WIN; offset++) {
      const r = row + (incrementRow ? (invertRow ? -offset : offset) : 0);
      const c = col + (incrementCol ? (invertCol ? -offset : offset) : 0);
      const button = document.getElementById(`button-${r}-${c}`);

      button.classList.add("win");
    }

    return true;
  };

  /**
   * Returns an array of valid actions for this state.
   * @return {Array} an array of valid actions for this state
   */
  getValidActions() {
    return getValidActions(this.board);
  }

  /**
   * Returns the lowest row for the given action (column).
   * @param {number} action The action (column) to take
   * @return {number} the lowest row for the given action (column)
   */
  getDropRow(action) {
    return getDropRow(this.board, action);
  }
}

/**
 * Returns whether the board is a draw.
 * @param {Array} board The game board as a 2D array
 * @return {boolean} whether the board is a draw
 */
export function checkDraw(board) {
  // Check if any top row is empty
  for (let col = 0; col < COLS; col++) {
    if (board[0][col] === 0) {
      return false;
    }
  }

  // All top row is full
  return true;
}

/**
 * Returns an array of valid actions for the board.
 * @param {Array} board The game board as a 2D array
 * @return {Array} an array of valid actions for the board
 */
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

/**
 * Returns the lowest row for the given action (column).
 * @param {Array} board The game board as a 2D array
 * @param {number} action The action (column) taken
 * @return {number} the lowest row for the given action (column)
 */
export function getDropRow(board, action) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][action] === 0) {
      return row;
    }
  }

  // Invalid action, column is full
  return -1;
}

/**
 * Returns a TensorFlowJS Tensor of shape [batch size, rows, cols, 1 channel].
 * @param {Array} state One or many game states, which are each 2D arrays
 * @return {Object} a TensorFlowJS Tensor of shape [batch size, rows, cols, 1 channel]
 */
export function getStateTensor(state) {
  // Convert to array if not already
  if (!Array.isArray(state)) {
    state = [state];
  }

  // Shape: [batch size, rows, cols, 1 channel]
  return tf.tensor(state).reshape([-1, ROWS, COLS, 1]);
}
