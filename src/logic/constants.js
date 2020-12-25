// Game settings
export const CONSECUTIVE_TO_WIN = 4;
export const ROWS = 6;
export const COLS = 7;

// Game representation
export const GAME_IN_PROGRESS = 2;
export const PLAYER_1 = 1;
export const DRAW = 0;
export const PLAYER_2 = -1;

// Flag indicating whether to train or run the main app
export const TRAIN_Q_LEARNING = false;

// Flag indicating whether to resume training or start fresh
export const RESUME_TRAINING = true;

// Model url
export const MODEL_URL =
  "https://connect4-ai.storage.googleapis.com/connect4model.json";

// Rewards
export const LOSS_REWARD = -1;
export const DRAW_REWARD = 0;
export const WIN_REWARD = 1;
export const STEP_REWARD = 0;

// Q-learning hyperparameters
export const NUM_EPISODES = 1e3;
export const REPLAY_BUFFER_SIZE = 1e4;
export const BATCH_SIZE = 16;
export const GAMMA = 0.99;
export const LEARNING_RATE = 1e-3;
export const SYNC_EVERY_FRAMES = 1e3;

// Epsilon-greedy algorithm
export const EPSILON_INIT = 0.7;
export const EPSILON_FINAL = 0.01;
export const EPSILON_DECAY_FRAMES = 1e5;
export const EPSILON_INCREMENT =
  (EPSILON_FINAL - EPSILON_INIT) / EPSILON_DECAY_FRAMES;
