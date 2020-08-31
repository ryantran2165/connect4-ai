import NeuralNetwork from "./neural-network";

class GeneticAlgorithm {
  constructor(
    populationSize,
    mutationRate,
    generations,
    inputSize,
    outputSize
  ) {
    this.populationSize = populationSize;
    this.mutationRate = mutationRate;
    this.generations = generations;

    this.curGeneration = 0;

    // Create initial population
    this.population = [];
    for (let i = 0; i < populationSize; i++) {
      this.population.push(new NeuralNetwork(inputSize, outputSize, i));
    }
  }

  *nextNetwork() {
    for (let network of this.population) {
      yield network;
    }
    yield null;
  }

  nextGeneration() {
    let fitnessSum = 0;
    for (const network of this.population) {
      fitnessSum += network.getFitness();
    }
    const avgFitness = fitnessSum / this.population.length;
    console.log("Average Fitness", avgFitness);

    if (this.curGeneration < this.generations) {
      console.log("Generation", this.curGeneration);

      // New population
      if (this.curGeneration > 0) {
        const newPopulation = [];

        for (let i = 0; i < this.populationSize; i++) {
          // Get two random networks with fitness as probability
          const network1 = this.getRandomNetwork();
          const network2 = this.getRandomNetwork();

          // Crossover and mutation
          let newNetwork = network1.crossover(network2);
          newNetwork.mutate(this.mutationRate);

          // Add to new population
          newPopulation.push(newNetwork);
        }

        // Set new population
        this.population = newPopulation;
      }

      this.curGeneration++;

      // Return a generator for the new generation
      return this.nextNetwork();
    }

    return null;
  }

  getRandomNetwork() {
    let i = 0;
    let rand = Math.random();
    let totalFitness = this.getTotalFitness();

    while (rand >= 0) {
      rand -= this.population[i].getFitness() / totalFitness;
      i++;
    }

    return this.population[i - 1];
  }

  getTotalFitness() {
    let totalFitness = 0;

    for (const network of this.population) {
      totalFitness += network.getFitness();
    }

    return totalFitness;
  }
}

export default GeneticAlgorithm;
