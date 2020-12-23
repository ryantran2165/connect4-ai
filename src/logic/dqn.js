import * as tf from "@tensorflow/tfjs";
import { ROWS, COLS } from "./constants";

export function createDQN() {
  const model = tf.sequential();

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

  return model;
}

export function copyWeights(destNetwork, srcNetwork) {
  // https://github.com/tensorflow/tfjs/issues/1807:
  // Weight orders are inconsistent when the trainable attribute doesn't
  // match between two `LayersModel`s. The following is a workaround.
  // TODO(cais): Remove the workaround once the underlying issue is fixed.
  let originalDestNetworkTrainable;
  if (destNetwork.trainable !== srcNetwork.trainable) {
    originalDestNetworkTrainable = destNetwork.trainable;
    destNetwork.trainable = srcNetwork.trainable;
  }

  destNetwork.setWeights(srcNetwork.getWeights());

  // Weight orders are inconsistent when the trainable attribute doesn't
  // match between two `LayersModel`s. The following is a workaround.
  // TODO(cais): Remove the workaround once the underlying issue is fixed.
  // `originalDestNetworkTrainable` is null if and only if the `trainable`
  // properties of the two LayersModel instances are the same to begin
  // with, in which case nothing needs to be done below.
  if (originalDestNetworkTrainable != null) {
    destNetwork.trainable = originalDestNetworkTrainable;
  }
}
