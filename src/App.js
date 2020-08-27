import React, { Component } from "react";
import Title from "./components/title";
import Description from "./components/description";
import Button from "./components/button";
import GithubCorner from "react-github-corner";
import Board from "./components/board";

class App extends Component {
  handleNewGame = () => {};

  render() {
    return (
      <div className="App container-fluid text-center pt-5">
        <div className="row">
          <div className="col">
            <Title text="Connect 4 AI" />
          </div>
        </div>
        <div className="row">
          <div className="col">
            <Description
              text={
                "Choose an AI difficulty (or vs player) and play Connect 4!"
              }
            />
          </div>
        </div>
        <div className="row justify-content-center pt-3">
          <div className="col">
            <select>
              <option>Player</option>
              <option>Easy (random)</option>
              <option>Normal (shallow minimax)</option>
              <option>Hard (neuroevolution)</option>
              <option>Crazy (deep minimax)</option>
            </select>
          </div>
        </div>
        <div className="row justify-content-center pt-3">
          <div className="col">
            <Button value="New Game" onClick={this.handleNewGame} />
          </div>
        </div>
        <div className="row justify-content-center pt-5">
          <div className="col col-auto">
            <Board />
          </div>
        </div>
        <GithubCorner
          href="https://github.com/ryantran2165/connect4-ai"
          bannerColor="#222"
          octoColor="#7fffd4"
          target="_blank"
        />
      </div>
    );
  }
}

export default App;
