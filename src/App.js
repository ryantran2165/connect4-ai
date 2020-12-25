import React, { Component } from "react";
import Button from "./components/button";
import GithubCorner from "react-github-corner";
import Board from "./components/board";
import { train } from "./logic/train";
import { Connect4Game, getStateTensor } from "./logic/game";
import {
  ROWS,
  COLS,
  GAME_IN_PROGRESS,
  PLAYER_1,
  DRAW,
  PLAYER_2,
  TRAIN_Q_LEARNING,
  MODEL_URL,
} from "./logic/constants";
import { minimax, getNextBoard } from "./logic/minimax";
import * as tf from "@tensorflow/tfjs";

const OPTIONS = [
  "Player",
  "Rookie (random)",
  "Easy (1-step minimax)",
  "Normal (deep Q-learning)",
  "Hard (2-step minimax)",
  "Expert (4-step minimax)",
  "Extreme (6-step minimax)",
];
const MAX_AI_SPEED_SECONDS = 0.01;
const MINIMAX_DEPTH_1 = 1;
const MINIMAX_DEPTH_2 = 2;
const MINIMAX_DEPTH_4 = 4;
const MINIMAX_DEPTH_6 = 6;

const MODE_PLAYER = 0;
const MODE_ROOKIE = 1;
const MODE_EASY = 2;
const MODE_NORMAL = 3;
const MODE_HARD = 4;
const MODE_EXPERT = 5;
const MODE_EXTREME = 6;

const SIMULATE = false;
const P1_MODE = MODE_NORMAL;
const P2_MODE = MODE_EASY;
const NUM_SIMULATE = 100;

class App extends Component {
  constructor(props) {
    super(props);

    // Instantiate game instance
    this.game = new Connect4Game();

    this.state = {
      board: this.game.getState(),
      turn: PLAYER_1,
      winner: GAME_IN_PROGRESS,
      p1Mode: MODE_PLAYER,
      p2Mode: MODE_PLAYER,
      aiSpeed: 0.02,
    };
  }

  componentDidMount() {
    if (TRAIN_Q_LEARNING) {
      train();
    } else {
      this.loadModel();
    }
  }

  /**
   * Loads the Q-learning model.
   */
  async loadModel() {
    this.model = await tf.loadLayersModel(MODEL_URL);

    if (SIMULATE) {
      this.numSimulate = NUM_SIMULATE;
      this.p1Wins = 0;
      this.p2Wins = 0;
      this.draws = 0;
      this.setState({ p1Mode: P1_MODE, p2Mode: P2_MODE }, this.runAI);
    }
  }

  /**
   * Changes the player mode.
   * @param {Object} e The event containing the new player
   * @param {number} player The player to change
   */
  handleOnChangePlayer = (e, player) => {
    const newPlayer = e.target.selectedIndex;

    this.setState(
      player === PLAYER_1 ? { p1Mode: newPlayer } : { p2Mode: newPlayer },
      this.runAI
    );
  };

  /**
   * Changes the AI speed.
   * @param {Object} e The event containing the new AI speed
   */
  handleOnChangeAISpeed = (e) => {
    const aiSpeed = Number(e.target.value);

    this.setState({ aiSpeed }, this.runAI);
  };

  /**
   * Starts a new game.
   */
  handleOnClickNewGame = () => {
    this.game.reset();

    this.setState(
      {
        board: this.game.getState(),
        turn: PLAYER_1,
        winner: GAME_IN_PROGRESS,
      },
      this.runAI
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

  /**
   * Handles user clicks on the board.
   * @param {number} action The action (column) clicked by the user
   */
  handleOnClickBoard = (action) => {
    // Don't allow if game over
    if (this.state.winner !== GAME_IN_PROGRESS) {
      return;
    }

    // Don't allow if AI's turn
    if (
      (this.state.turn === PLAYER_1 && this.state.p1Mode !== MODE_PLAYER) ||
      (this.state.turn === PLAYER_2 && this.state.p2Mode !== MODE_PLAYER)
    ) {
      return;
    }

    const validActions = this.game.getValidActions();

    // Don't allow if not valid action
    if (!validActions.includes(action)) {
      return;
    }

    this.step(action);
  };

  /**
   * Steps the game with the given action.
   * @param {number} action The action (column) to step the game with.
   */
  step = (action) => {
    // Take step, get new board, turn, winner, and drop row
    const { board, turn, winner, dropRow } = this.game.step(action);

    // Update button style
    const button = document.getElementById(`button-${dropRow}-${action}`);

    // this.state.turn has not changed yet
    button.classList.add(`p${this.getPlayerNumber()}`);

    // Update state
    this.setState({ board, turn, winner }, this.runAI);
  };

  /**
   * Returns the string representing the current turn player.
   * @return {string} the string representing the current turn player
   */
  getPlayerNumber() {
    return this.state.turn === PLAYER_1 ? "1" : "2";
  }

  /**
   * Runs the AI at the set AI speed.
   */
  runAI = () => {
    clearTimeout(this.timer);

    // Only run AI if not game over
    if (this.state.winner !== GAME_IN_PROGRESS) {
      if (SIMULATE) {
        if (this.state.winner === PLAYER_1) {
          this.p1Wins++;
        } else if (this.state.winner === PLAYER_2) {
          this.p2Wins++;
        } else {
          this.draws++;
        }

        this.numSimulate--;

        if (this.numSimulate === 0) {
          console.log(
            `P1: ${this.p1Wins} | P2: ${this.p2Wins} | Draws: ${this.draws}`
          );
        } else {
          this.handleOnClickNewGame();
        }
      }

      return;
    }

    // Game not over
    this.timer = setTimeout(
      () => {
        if (this.state.turn === PLAYER_1 && this.state.p1Mode !== MODE_PLAYER) {
          // Run AI for player 1
          if (this.state.p1Mode === MODE_ROOKIE) {
            this.randomAI();
          } else if (this.state.p1Mode === MODE_EASY) {
            this.minimaxAI(MINIMAX_DEPTH_1);
          } else if (this.state.p1Mode === MODE_NORMAL) {
            this.qLearningAI();
          } else if (this.state.p1Mode === MODE_HARD) {
            this.minimaxAI(MINIMAX_DEPTH_2);
          } else if (this.state.p1Mode === MODE_EXPERT) {
            this.minimaxAI(MINIMAX_DEPTH_4);
          } else if (this.state.p1Mode === MODE_EXTREME) {
            this.minimaxAI(MINIMAX_DEPTH_6);
          }
        } else if (
          this.state.turn === PLAYER_2 &&
          this.state.p2Mode !== MODE_PLAYER
        ) {
          // Run AI for player 2
          if (this.state.p2Mode === MODE_ROOKIE) {
            this.randomAI();
          } else if (this.state.p2Mode === MODE_EASY) {
            this.minimaxAI(MINIMAX_DEPTH_1);
          } else if (this.state.p2Mode === MODE_NORMAL) {
            this.qLearningAI();
          } else if (this.state.p2Mode === MODE_HARD) {
            this.minimaxAI(MINIMAX_DEPTH_2);
          } else if (this.state.p2Mode === MODE_EXPERT) {
            this.minimaxAI(MINIMAX_DEPTH_4);
          } else if (this.state.p2Mode === MODE_EXTREME) {
            this.minimaxAI(MINIMAX_DEPTH_6);
          }
        }
      },
      SIMULATE ? 0 : (1000 * MAX_AI_SPEED_SECONDS) / this.state.aiSpeed
    );
  };

  /**
   * Steps the game using a random AI.
   */
  randomAI() {
    const validActions = this.game.getValidActions();
    const action =
      validActions[Math.floor(Math.random() * validActions.length)];

    this.step(action);
  }

  /**
   * Steps the game using a minimax AI.
   * @param {number} depth The minimax depth
   */
  minimaxAI(depth) {
    let maxVal = Number.NEGATIVE_INFINITY;
    let maxCols = [];

    for (const col of this.game.getValidActions()) {
      const board = getNextBoard(this.state.board, col, this.state.turn);

      const val = minimax(
        board,
        depth - 1,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        false,
        this.state.turn
      );

      if (val > maxVal) {
        // New max, reset maxCols
        maxVal = val;
        maxCols = [col];
      } else if (val === maxVal) {
        // Same max, add to array of possible choices
        maxCols.push(col);
      }
    }

    // Random action from max cols
    const action = maxCols[Math.floor(Math.random() * maxCols.length)];

    this.step(action);
  }

  /**
   * Steps the game using a Q-learning AI.
   */
  qLearningAI() {
    // Clean memory
    tf.tidy(() => {
      // Get correct state representation
      const state =
        this.state.turn === PLAYER_1
          ? this.game.getState()
          : this.game.getInvertedState();
      const stateTensor = getStateTensor(state);

      // Get q-values for each action as an array
      const qs = Array.from(this.model.predict(stateTensor).dataSync());

      // Mask valid actions
      const validActions = this.game.getValidActions();
      const qActions = [];

      // Save q-action pairs
      qs.forEach((q, action) => {
        if (validActions.includes(action)) {
          qActions.push({ q, action });
        }
      });

      // Get action by max q-value
      let maxQ = -Infinity;
      let action = -1;

      qActions.forEach((qAction) => {
        if (qAction.q > maxQ) {
          maxQ = qAction.q;
          action = qAction.action;
        }
      });

      this.step(action);
    });
  }

  render() {
    let turnOrWinnerText;

    if (this.state.winner !== GAME_IN_PROGRESS) {
      if (this.state.winner === DRAW) {
        turnOrWinnerText = "Draw";
      } else {
        turnOrWinnerText = `Player ${
          this.state.winner === PLAYER_1 ? "1" : "2"
        } wins`;
      }
    } else {
      turnOrWinnerText = `Player ${
        this.state.turn === PLAYER_1 ? "1" : "2"
      } turn`;
    }

    return (
      <div className="App container-fluid text-center pt-5">
        <div className="row">
          <div className="col">
            <h1 className="font-weight-bold">Connect 4 AI</h1>
            <h5>Play versus Player/AI or watch AI play against AI.</h5>
            <div className="row justify-content-center">
              <div className="col col-auto pt-3">
                <h4>Player 1</h4>
                <select
                  onChange={(e) => this.handleOnChangePlayer(e, PLAYER_1)}
                >
                  {OPTIONS.map((option) => {
                    return <option key={`p1-${option}`}>{option}</option>;
                  })}
                </select>
              </div>
              <div className="col col-auto pt-3">
                <h4>Player 2</h4>
                <select
                  onChange={(e) => this.handleOnChangePlayer(e, PLAYER_2)}
                >
                  {OPTIONS.map((option) => {
                    return <option key={`p2-${option}`}>{option}</option>;
                  })}
                </select>
              </div>
            </div>
            <div className="row justify-content-center pt-3">
              <div className="col col-10 col-sm-8 col-md-6 col-lg-4 col-xl-2">
                <input
                  type="range"
                  min={0.01}
                  max={1}
                  step={0.01}
                  defaultValue={this.state.aiSpeed}
                  onChange={this.handleOnChangeAISpeed}
                />
              </div>
            </div>
            <h5>AI speed: {this.state.aiSpeed}</h5>
            <div className="mt-3">
              <Button value="New Game" onClick={this.handleOnClickNewGame} />
            </div>
            <h4 className="mt-5">{turnOrWinnerText}</h4>
            <div className="row justify-content-center pt-3">
              <div className="col col-auto">
                <Board
                  ROWS={ROWS}
                  COLS={COLS}
                  onClick={this.handleOnClickBoard}
                />
              </div>
            </div>
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
