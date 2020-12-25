import {
  CONSECUTIVE_TO_WIN,
  ROWS,
  COLS,
  PLAYER_1,
  PLAYER_2,
} from "./constants";
import { checkDraw, getValidActions, getDropRow } from "./game";

/**
 * Minimax algorithm with alpha-beta pruning.
 * @param {Array} board The game board as a 2D array
 * @param {number} depth The minimax depth
 * @param {number} alpha Alpha for alpha-beta pruning
 * @param {number} beta Beta for alpha-beta pruning
 * @param {boolean} maximizingPlayer Whether this call is for the maximizing player
 * @param {number} player The starting (maximizing) player
 * @return {number} The minimax value
 */
export function minimax(board, depth, alpha, beta, maximizingPlayer, player) {
  // Reached desired depth or game over, return heuristic
  if (depth === 0 || isGameOver(board)) {
    return getHeuristic(board, player);
  }

  // Maximizing player
  if (maximizingPlayer) {
    let maxVal = Number.NEGATIVE_INFINITY;

    for (const col of getValidActions(board)) {
      const nextBoard = getNextBoard(board, col, player);
      const val = minimax(nextBoard, depth - 1, alpha, beta, false, player);

      maxVal = Math.max(maxVal, val);
      alpha = Math.max(alpha, val);

      if (alpha >= beta) {
        break;
      }
    }

    return maxVal;
  }

  // Minimizing player
  let minVal = Number.POSITIVE_INFINITY;

  for (const col of getValidActions(board)) {
    const nextBoard = getNextBoard(board, col, getOtherPlayer());
    const val = minimax(nextBoard, depth - 1, alpha, beta, true, player);

    minVal = Math.min(minVal, val);
    beta = Math.min(beta, val);

    if (beta <= alpha) {
      break;
    }
  }

  return minVal;
}

/**
 * Returns whether the game is over.
 * @param {Array} board The game board as a 2D array
 * @return {boolean} Whether the game is over
 */
function isGameOver(board) {
  return (
    countWindows(board, PLAYER_1, CONSECUTIVE_TO_WIN) > 0 ||
    countWindows(board, PLAYER_2, CONSECUTIVE_TO_WIN) > 0 ||
    checkDraw(board)
  );
}

/**
 * Returns the number of valid windows containing a target number of discs for a player.
 * @param {Array} board The game board as a 2D array
 * @param {number} player The player to count windows for
 * @param {number} targetCount The number of discs needed to count a window
 * @return {number} The number of valid windows containing a target number of discs for a player
 */
function countWindows(board, player, targetCount) {
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

/**
 * Returns the heuristic for the game board for the given player.
 * @param {Array} board The game board as a 2D array
 * @param {number} player The player to get the heuristic for
 * @return {number} the heuristic for the game board for the given player
 */
function getHeuristic(board, player) {
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
    weightedSum += 10 ** (2 * i + 1) * countWindows(board, player, i + 2);

    // Negative
    weightedSum -=
      10 ** (2 * i) * countWindows(board, getOtherPlayer(player), i + 2);
  }

  return weightedSum;
}

/**
 * Returns the other player to the given player.
 * @param {number} player The player
 * @return {number} the other player to the given player
 */
function getOtherPlayer(player) {
  return player === PLAYER_1 ? PLAYER_2 : PLAYER_1;
}

/**
 * Returns a new game board after dropping the disc in the given column.
 * @param {Array} board The game board as a 2D array
 * @param {number} col The column to drop the disc
 * @param {number} player The player
 * @return {Array} a new game board after dropping the disc in the given column
 */
export function getNextBoard(board, col, player) {
  // Deep copy the board
  const nextBoard = [];

  for (const row of board) {
    nextBoard.push([...row]);
  }

  // Set the disc
  const row = getDropRow(nextBoard, col);
  nextBoard[row][col] = player;

  return nextBoard;
}
