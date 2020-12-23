import * as tf from "@tensorflow/tfjs";
import { REPLAY_BUFFER_SIZE } from "./constants";

export class ReplayMemory {
  constructor() {
    this.index = 0;
    this.length = 0;
    this.buffer = [];
    this.bufferIndices = [];

    for (let i = 0; i < REPLAY_BUFFER_SIZE; i++) {
      this.buffer.push(null);
      this.bufferIndices.push(i);
    }
  }

  append(experience) {
    this.buffer[this.index] = experience;
    this.length = Math.min(this.length + 1, REPLAY_BUFFER_SIZE);
    this.index = (this.index + 1) % REPLAY_BUFFER_SIZE;
  }

  sample(batchSize) {
    if (batchSize > REPLAY_BUFFER_SIZE) {
      throw new Error(
        `batchSize ${batchSize} exceeds buffer length ${REPLAY_BUFFER_SIZE}`
      );
    }

    tf.util.shuffle(this.bufferIndices);

    const out = [];

    for (let i = 0; i < batchSize; i++) {
      out.push(this.buffer[this.bufferIndices[i]]);
    }

    return out;
  }
}
