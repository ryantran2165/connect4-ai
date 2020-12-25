import * as tf from "@tensorflow/tfjs";
import { REPLAY_BUFFER_SIZE } from "./constants";

export class ReplayMemory {
  /**
   * Creates a new circular replay memory.
   */
  constructor() {
    this.index = 0;
    this.length = 0;
    this.buffer = [];
    this.bufferIndices = [];

    for (let i = 0; i < REPLAY_BUFFER_SIZE; i++) {
      this.buffer.push(null);

      // Buffer indices are only used for randomly sampling
      this.bufferIndices.push(i);
    }
  }

  /**
   * Adds a new experience to memory, replacing the oldest memory if max length is reached.
   * @param {Object} experience The new experience to add to memory
   */
  append(experience) {
    this.buffer[this.index] = experience;
    this.length = Math.min(this.length + 1, REPLAY_BUFFER_SIZE);
    this.index = (this.index + 1) % REPLAY_BUFFER_SIZE;
  }

  /**
   * Returns a random sample of memories.
   * @param {number} batchSize The number of samples to return
   * @return {Array} a random sample of memories.
   */
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
