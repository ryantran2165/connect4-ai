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

export async function test() {}

export async function train() {
  const game = new Connect4Game();
  const agent = new Connect4Agent(game);

  // Fill replay buffer with initial experiences
  for (let i = 0; i < REPLAY_BUFFER_SIZE; i++) {
    agent.playStep();
  }

  const optimizer = tf.train.adam(LEARNING_RATE);

  // Stats
  let tPrev = new Date().getTime();
  let frameCountPrev = agent.frameCount;
  let bestAverageReward = -Infinity;
  const averager = new Averager(AVERAGER_BUFFER_LENGTH);

  // Train for given number of episodes
  for (let i = 0; i < NUM_EPISODES; i++) {
    while (true) {
      // Update weights
      agent.trainOnReplayBatch(optimizer);

      // Step agent
      const { reward, done } = agent.playStep();

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
          `Frame #${agent.frameCount}: ` +
            `Average reward=${averageReward.toFixed(2)} ` +
            `Epsilon=${agent.epsilon.toFixed(3)} ` +
            `FPS=${fps.toFixed(1)}`
        );

        // New best average, save DQN to cloud
        if (averageReward > bestAverageReward) {
          bestAverageReward = averageReward;

          await agent.onlineNetwork.save("");
          console.log(`Saved DQN with average reward=${bestAverageReward}`);
        }
      }

      // Sync weights for target network with online network
      if (agent.frameCount % SYNC_EVERY_FRAMES === 0) {
        copyWeights(agent.targetNetwork, agent.onlineNetwork);
      }
    }
  }
}

class Averager {
  constructor(bufferLength) {
    this.buffer = [];

    for (let i = 0; i < bufferLength; i++) {
      this.buffer.push(null);
    }
  }

  append(x) {
    this.buffer.shift();
    this.buffer.push(x);
  }

  average() {
    return this.buffer.reduce((x, prev) => x + prev) / this.buffer.length;
  }
}
