import * as tf from "@tensorflow/tfjs";

class NeuralNetwork {
  constructor(inputSize, outputSize, index) {
    this.inputSize = inputSize;
    this.outputSize = outputSize;
    this.index = index;
    this.fitness = 0;

    this.model = this.createModel(inputSize, outputSize);

    // console.log(tf.memory());
  }

  createModel(inputSize, outputSize) {
    const model = tf.sequential();

    const input = tf.layers.inputLayer({
      inputShape: [inputSize],
    });
    const hidden = tf.layers.dense({
      units: 30,
      activation: "sigmoid",
    });
    const output = tf.layers.dense({
      units: outputSize,
      activation: "softmax",
    });

    model.add(input);
    model.add(hidden);
    model.add(output);

    return model;
  }

  predict(inputArr) {
    return tf.tidy(() => {
      const inputTensor = tf.tensor2d([inputArr]);
      const outputTensor = this.model.predict(inputTensor);
      const outputArr = outputTensor.dataSync();
      return outputArr;
    });
  }

  crossover(other, useAvg = true) {
    // return this.fitness > other.fitness ? this.copy() : other.copy();

    return tf.tidy(() => {
      const newNetwork = new NeuralNetwork(
        this.inputSize,
        this.outputSize,
        this.index
      );
      const weights = this.model.getWeights();
      const otherWeights = other.model.getWeights();
      const newWeights = [];

      // Go through each weight matrix/vector
      for (let i = 0; i < weights.length; i++) {
        const tensor = weights[i];
        const otherTensor = otherWeights[i];
        const values = tensor.dataSync();
        const otherValues = otherTensor.dataSync();
        const shape = weights[i].shape;
        const newValues = [];

        // Go through each value in the tensor
        for (let j = 0; j < values.length; j++) {
          if (useAvg) {
            newValues.push((values[j] + otherValues[j]) / 2);
          } else {
            // 50/50 for which weight/gene is selected
            if (Math.random() < 0.5) {
              newValues.push(values[j]);
            } else {
              newValues.push(otherValues[j]);
            }
          }
        }

        // Reshape array to tensor and add to new weights
        const newTensor = tf.tensor(newValues, shape);
        newWeights.push(newTensor);
      }

      // Set new network's weights
      newNetwork.model.setWeights(newWeights);

      return newNetwork;
    });
  }

  mutate(rate) {
    tf.tidy(() => {
      const weights = this.model.getWeights();
      const newWeights = [];

      // Go through each weight matrix/vector
      for (let i = 0; i < weights.length; i++) {
        const tensor = weights[i];
        const values = tensor.dataSync();
        const shape = weights[i].shape;
        const newValues = [];

        // Go through each value in the tensor
        for (let j = 0; j < values.length; j++) {
          // Mutate based on rate
          if (Math.random() < rate) {
            const tweak = (Math.random() * 2 - 1) * 0.01;
            newValues.push(values[j] + tweak);
          } else {
            newValues.push(values[j]);
          }
        }

        // Reshape array to tensor and add to new weights
        const newTensor = tf.tensor(newValues, shape);
        newWeights.push(newTensor);
      }

      // Set new weights
      this.model.setWeights(newWeights);
    });
  }

  copy() {
    return tf.tidy(() => {
      // Weights is an array of tensors
      const weights = this.model.getWeights();
      const copiedWeights = weights.map((weight) => weight.clone());

      const copy = new NeuralNetwork(
        this.inputSize,
        this.outputSize,
        this.index
      );
      copy.model.setWeights(copiedWeights);
      return copy;
    });
  }

  setFitness(fitness) {
    this.fitness = fitness;
  }

  getFitness() {
    return this.fitness;
  }

  save() {}

  dispose() {
    this.model.dispose();
  }
}

export default NeuralNetwork;
