import * as tf from "@tensorflow/tfjs";
import { getStateTensor } from "./game";
import { createDQN } from "./dqn";
import { ReplayMemory } from "./replay-memory";
import {
  COLS,
  PLAYER_2,
  RESUME_TRAINING,
  MODEL_URL,
  BATCH_SIZE,
  GAMMA,
  EPSILON_INIT,
  EPSILON_FINAL,
  EPSILON_DECAY_FRAMES,
  EPSILON_INCREMENT,
} from "./constants";

export class Connect4Agent {
  /**
   * Creates an agent and resets the game.
   * @param {Object} game The Connect4Game instance
   */
  constructor(game) {
    this.game = game;
  }

  /**
   * Loads the agent.
   */
  async load() {
    this.frameCount = 0;

    if (RESUME_TRAINING) {
      this.onlineNetwork = await tf.loadLayersModel(MODEL_URL);
      this.targetNetwork = await tf.loadLayersModel(MODEL_URL);
    } else {
      this.onlineNetwork = createDQN();
      this.targetNetwork = createDQN();
    }
    this.targetNetwork.trainable = false; // Only update weights by copying from online network

    this.replayMemory = new ReplayMemory();
    this.reset();
  }

  /**
   * Resets the agent, which resets the game.
   */
  reset() {
    /*
     * PLAYER_1 is different from firstPlayer.
     * PLAYER_1 is the value of the disc we are optimizing the agent relative to.
     * firstPlayer is the player (either PLAYER_1 or PLAYER_2) that goes first.
     */
    let firstPlayer = this.game.reset();

    // Play one move by PLAYER_2 to make step() always start with PLAYER_1
    if (firstPlayer === PLAYER_2) {
      // Invert state doesn't matter because empty board anyway
      const action = this.getBestAction(true);

      this.game.step(action);
    }
  }

  /**
   * Steps the agent once, which steps both PLAYER_1 and PLAYER_2.
   * Returns an object containing the reward and a done flag.
   * @return {Object} an object containing the reward and a done flag
   */
  step() {
    // Calculate epsilon and update frame count
    this.epsilon =
      this.frameCount >= EPSILON_DECAY_FRAMES
        ? EPSILON_FINAL
        : EPSILON_INIT + EPSILON_INCREMENT * this.frameCount;
    this.frameCount++;

    /* PLAYER_1 */

    // Choose action by epsilon-greedy algorithm
    const action =
      Math.random() < this.epsilon
        ? this.getRandomAction()
        : this.getBestAction(false);

    // Get state before stepping game
    const state = this.game.getState();
    let reward, nextState, done;

    // Step game with chosen action
    ({ reward, nextState, done } = this.game.step(action));

    // Add experience to replay memory
    if (done) {
      this.replayMemory.append([state, action, reward, nextState, done]);

      this.reset();

      // Game is done, don't continue to PLAYER_2
      return { reward, done };
    }

    /* PLAYER_2 */

    // Always choose best action
    const action2 = this.getBestAction(true);

    // Step game with chosen action
    ({ reward, nextState, done } = this.game.step(action2));

    // PLAYER_2 is part of environment, only store experiences where PLAYER_1 has next turn
    this.replayMemory.append([state, action, reward, nextState, done]);

    if (done) {
      this.reset();
    }

    // Game not done, only used for calculating stats while training
    return { reward, done };
  }

  /**
   * Returns a random valid action (column).
   * @return {number} a random valid action (column)
   */
  getRandomAction() {
    // Only choose from valid actions
    const validActions = this.game.getValidActions();

    return validActions[Math.floor(Math.random() * validActions.length)];
  }

  /**
   * Returns the best action (column) according to the online network.
   * @param {boolean} invertState Whether to invert the state (player values on the game board invert)
   * @return {number} the best action (column) according to the online network
   */
  getBestAction(invertState) {
    // Clean memory
    return tf.tidy(() => {
      // Get correct state representation
      const state = invertState
        ? this.game.getInvertedState()
        : this.game.getState();
      const stateTensor = getStateTensor(state);

      // Get q-values for each action as an array
      const qs = Array.from(this.onlineNetwork.predict(stateTensor).dataSync());

      // Mask valid actions
      const validActions = this.game.getValidActions();
      const qActions = [];

      // Save q-action pairs
      qs.forEach((q, action) => {
        if (validActions.includes(action)) {
          qActions.push({ q, action });
        }
      });

      // Get best action by max q-value
      let maxQ = -Infinity;
      let bestAction = -1;

      qActions.forEach((qAction) => {
        if (qAction.q > maxQ) {
          maxQ = qAction.q;
          bestAction = qAction.action;
        }
      });

      return bestAction;
    });
  }

  /**
   * Trains the online network on a sample from the replay memory.
   * @param {Object} optimizer TensorFlowJS optimizer
   */
  trainOnReplayBatch(optimizer) {
    // Train on sample of replay buffer
    const batch = this.replayMemory.sample(BATCH_SIZE);

    // Custom loss function
    const lossFunction = () =>
      tf.tidy(() => {
        /* Get predicted q-values from online network */

        // Shape: [batch size, rows, cols, 1 channel]
        const stateTensor = getStateTensor(batch.map((example) => example[0]));

        // Shape: [batch size], action for each example
        const actionTensor = tf.tensor1d(
          batch.map((example) => example[1]),
          "int32"
        );

        // Shape: [batch size, cols], mask q-value for action taken only
        const actionMask = tf.oneHot(actionTensor, COLS);

        // Shape: [batch size], predicted q-value for each example
        const qs = this.onlineNetwork
          .apply(stateTensor) // Shape: [batch size, cols], I believe apply differs from predict
          .mul(actionMask) // Element-wise mul
          .sum(-1); // Collapse columns

        /* Get target q-values from target network */

        // Shape: [batch size], reward for each example
        const rewardTensor = tf.tensor1d(batch.map((example) => example[2]));

        // Shape: [batch size, rows, cols, 1 channel]
        const nextStateTensor = getStateTensor(
          batch.map((example) => example[3])
        );

        // Shape: [batch size], target max q-value for each example
        const nextMaxQTensor = this.targetNetwork
          .predict(nextStateTensor) // Shape: [batch size, cols]
          .max(-1); // Collapse columns

        // Shape: [batch size], don't want to receive rewards that come after the game has already ended
        const doneMask = tf
          .scalar(1)
          .sub(
            tf.tensor1d(batch.map((example) => example[4])).asType("float32")
          );

        // Always include immediate reward, but exclude rewards if done
        const targetQs = rewardTensor.add(
          nextMaxQTensor.mul(doneMask).mul(GAMMA) // Discounted reward
        );

        // MSE on target and predicted q-values
        return tf.losses.meanSquaredError(targetQs, qs);
      });

    // Gradients for online network
    const grads = tf.variableGrads(lossFunction);

    // Update weights for online network
    optimizer.applyGradients(grads.grads);

    // Clean memory
    tf.dispose(grads);
  }
}
