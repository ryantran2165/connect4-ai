import * as tf from "@tensorflow/tfjs";
import { Connect4Game } from "./game";
import { Connect4Agent } from "./agent";
import { copyWeights } from "./dqn";
import {
  REPLAY_BUFFER_SIZE,
  LEARNING_RATE,
  NUM_EPISODES,
  SYNC_EVERY_FRAMES,
} from "./constants";

const AVERAGER_BUFFER_LENGTH = 100;

/**
 * Trains the agent!
 */
export async function train() {
  const game = new Connect4Game();
  const agent = new Connect4Agent(game);

  // Wait for agent to load before continuing
  await agent.load();

  // Fill replay buffer with initial experiences
  for (let i = 1; i <= REPLAY_BUFFER_SIZE; i++) {
    agent.step();

    if (i % (REPLAY_BUFFER_SIZE / 10) === 0) {
      console.log(`Initializing replay buffer: ${i}/${REPLAY_BUFFER_SIZE}`);
    }
  }

  const optimizer = tf.train.adam(LEARNING_RATE);

  // Stats
  let tPrev = new Date().getTime();
  let frameCountPrev = agent.frameCount;
  const averager = new Averager(AVERAGER_BUFFER_LENGTH);

  // Train for given number of episodes
  for (let episode = 1; episode <= NUM_EPISODES; episode++) {
    let done = false;

    while (!done) {
      // Update weights
      agent.trainOnReplayBatch(optimizer);

      // Step agent
      let reward;
      ({ reward, done } = agent.step());

      // Episode done
      if (done) {
        // Frames per second
        const t = new Date().getTime();
        const fps = ((agent.frameCount - frameCountPrev) / (t - tPrev)) * 1e3;
        tPrev = t;
        frameCountPrev = agent.frameCount;

        // Average reward
        averager.append(reward);
        const averageReward = averager.average();

        console.log(
          `Episode #${episode}: ` +
            `Frame count=${agent.frameCount} ` +
            `Average reward=${averageReward.toFixed(2)} ` +
            `Epsilon=${agent.epsilon.toFixed(3)} ` +
            `FPS=${fps.toFixed(1)}`
        );
      }

      // Sync weights for target network with online network
      if (agent.frameCount % SYNC_EVERY_FRAMES === 0) {
        copyWeights(agent.targetNetwork, agent.onlineNetwork);
      }
    }
  }

  // Download DQN on completion
  await agent.onlineNetwork.save("downloads://connect4model");
}

class Averager {
  /**
   * Creates an averager with the given length.
   * @param {number} bufferLength The number of elements to average
   */
  constructor(bufferLength) {
    this.buffer = [];

    // Initialize all with null
    for (let i = 0; i < bufferLength; i++) {
      this.buffer.push(null);
    }
  }

  /**
   * Removes the oldest value and adds the new value.
   * @param {number} x The new number
   */
  append(x) {
    this.buffer.shift();
    this.buffer.push(x);
  }

  /**
   * Returns the average of the buffer.
   * @return {number} the average of the buffer.
   */
  average() {
    return this.buffer.reduce((x, prev) => x + prev) / this.buffer.length;
  }
}
