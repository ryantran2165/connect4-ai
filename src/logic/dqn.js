import * as tf from "@tensorflow/tfjs";
import { ROWS, COLS } from "./constants";

const MODEL = 0;

/**
 * Returns the TensorFlowJS DQN model.
 * @return the TensorFlowJS DQN model
 */
export function createDQN() {
  const model = tf.sequential();

  switch (MODEL) {
    case 0:
      model.add(
        tf.layers.conv2d({
          inputShape: [ROWS, COLS, 1], // 1 channel depth
          kernelSize: 4,
          filters: 8,
          strides: 1,
          activation: "relu",
        })
      );
      model.add(
        tf.layers.conv2d({
          kernelSize: 2,
          filters: 16,
          strides: 1,
          activation: "relu",
        })
      );
      model.add(tf.layers.flatten());
      model.add(tf.layers.dense({ units: 64, activation: "relu" }));
      model.add(tf.layers.dense({ units: COLS })); // Outputs are actions (columns)
      break;
    case 1:
      model.add(
        tf.layers.conv2d({
          inputShape: [ROWS, COLS, 1], // 1 channel depth
          kernelSize: 4,
          filters: 32,
          strides: 1,
          activation: "relu",
        })
      );
      model.add(tf.layers.flatten());
      model.add(tf.layers.dense({ units: 32, activation: "relu" }));
      model.add(tf.layers.dropout({ rate: 0.2 }));
      model.add(tf.layers.dense({ units: 32, activation: "relu" }));
      model.add(tf.layers.dropout({ rate: 0.2 }));
      model.add(tf.layers.dense({ units: COLS })); // Outputs are actions (columns)
      break;
    default:
      break;
  }

  return model;
}

/**
 * Copies the weights from the source network to the destination network.
 * @param {Object} destNetwork Destination network
 * @param {Object} srcNetwork Source network
 */
export function copyWeights(destNetwork, srcNetwork) {
  // There's a bug where the 'trainable' setting has to be the same
  let originalDestNetworkTrainable;
  if (destNetwork.trainable !== srcNetwork.trainable) {
    originalDestNetworkTrainable = destNetwork.trainable;
    destNetwork.trainable = srcNetwork.trainable;
  }

  destNetwork.setWeights(srcNetwork.getWeights());

  // Reset to original 'trainable' setting if needed
  if (originalDestNetworkTrainable != null) {
    destNetwork.trainable = originalDestNetworkTrainable;
  }
}
