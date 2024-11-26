function initGame() {
  const newGameButton = document.querySelector("#new-game-button")
  const continueGameButton = document.querySelector("#continue-game-button")

  const widthInput = document.querySelector(".params__width > input");
  const heightInput = document.querySelector(".params__height > input");
  const speedInput = document.querySelector(".params__speed > input");

  const menuElement = document.querySelector(".menu");
  const gameElement = document.querySelector(".game");

  const moveUp = "up";
  const moveDown = "down";
  const moveRight = "right";
  const moveLeft = "left";


  const snakeClass = {
    head: "snake__head",
    body: "snake__body",
  }
  const appleClass = "apple";

  showScore();
  let game;

  newGameButton.addEventListener("click", () => {
    console.info("starting game");

    if (checkAndShakeInvalidInputs()) {
      return
    }

    const speed = invertSpeed(speedInput)

    game = new Game(
      gameElement,
      heightInput.value,
      widthInput.value,
      true,
      speed);
    gameWait(game);

  });

  continueGameButton.onclick = () => {
    console.info("continue game");
    if (typeof game == "undefined") {
      return
    }
    gameWait(game)

  }

  document.querySelector("#reset-game-button").onclick = () => {
    console.info("reset stats");
    saveHighScore(0);
    showScore();
  };



  class Point {
    constructor(x, y) {
      return { x, y }
    }
  }

  class Game {

    constructor(gameBlock, height, width, withBorders, speed) {
      this.nextMove = moveUp;
      this.score = 0;

      this.height = height;
      this.width = width;
      this.withBorders = withBorders;
      this.speed = speed;

      this.table = this.makeTable(gameBlock);
      this.snake = this.makeSnake();
      this.apple = this.makeApple(this.snake);
    }

    start() {
      return new Promise((resolve, reject) => {
        let removeStop;
        let ticker;

        const stop = () => {
          clearInterval(ticker);
          removeStop();
          reject(this.score);
        }

        removeStop = () => {
          document.removeEventListener("keyup", e => this.moveListener(e, stop));
        }

        ticker = setInterval(
          () => {
            this.step(score => {
              resolve(score);
              stop();
            })
          },
          this.speed);

        document.addEventListener("keyup", e => this.moveListener(e, stop));

      })
    }

    step(resolve) {

      if (this.isBump()) {
        resolve(this.score);
        return
      }


      if (this.nextIsApple()) {
        this.eatApple();
        this.grow();
        return
      }

      this.moveNext();

      console.log(`next move ${this.nextMove}`);
    }

    isBump() {
      const head = this.snake.at(0)
      const next = this.nextCoord(head)

      if (containPoint(next, this.snake)) {
        console.log(`bumping head x=${head.x} y=${head.y}, next x=${next.x} y=${next.y}`)
        return true
      }

      return false
    }

    nextIsApple() {
      const head = this.snake.at(0)
      const next = this.nextCoord(head)

      return equalCoord(next, this.apple)
    }

    eatApple() {
      removePointClass(this.table, this.apple, appleClass);

      this.score += 1;
      showScore(this.score);

      this.apple = this.makeApple(this.snake);
      addPointClass(this.table, this.apple, appleClass);
    }

    grow() {
      const head = this.snake.at(0);
      removePointClass(this.table, head, snakeClass.head);
      addPointClass(this.table, head, snakeClass.body);

      let next = this.nextCoord(head);

      this.snake.unshift(next);
      addPointClass(this.table, next, snakeClass.head);
    }

    moveNext() {
      this.grow()

      const tail = this.snake.pop();
      removePointClass(this.table, tail, snakeClass.body);
    }

    moveListener(e, stop) {
      switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
          if (this.nextMove == moveDown) {
            return
          }
          this.nextMove = moveUp;
          break;
        case "arrowdown":
        case "s":
          if (this.nextMove == moveUp) {
            return
          }
          this.nextMove = moveDown;
          break;
        case "arrowleft":
        case "a":
          if (this.nextMove == moveRight) {
            return
          }
          this.nextMove = moveLeft;
          break;
        case "arrowright":
        case "d":
          if (this.nextMove == moveLeft) {
            return
          }
          this.nextMove = moveRight;
          break;
        case "escape":
          stop();
      }
    }

    makeTable(gameBlock) {
      gameBlock.replaceChildren([]);

      const table = [];
      console.debug(`fill Table width=${this.width} height=${this.height}`)

      for (let y = 0; y < this.height; y++) {

        const line = [];

        for (let x = 0; x < this.width; x++) {

          const point = document.createElement("div");
          point.classList.add("game__point");

          line.push(point);
        }
        table.push(line);
      }

      table.forEach((line) => {
        const gameLine = document.createElement("div");

        gameLine.append(...line);
        gameLine.classList.add("game__line");

        gameBlock.append(gameLine);
      })

      return table;
    }

    nextCoord(coord) {
      coord = new Point(coord.x, coord.y);

      switch (this.nextMove) {

        case moveUp:
          if (coord.y == 0) {
            coord.y = this.height
          }
          coord.y--;
          break

        case moveDown:
          if (coord.y == this.height - 1) {
            coord.y = -1;
          }
          coord.y++;
          break;

        case moveLeft:
          if (coord.x == 0) {
            coord.x = this.width
          }
          coord.x--;
          break;

        case moveRight:
          if (coord.x == this.width - 1) {
            coord.x = -1;
          }
          coord.x++;
          break;

      }

      return coord;
    }

    makeSnake() {
      const head = genRandCoord(this.width, this.height - 1);

      const tail = new Point(head.x, head.y + 1);

      addPointClass(this.table, head, snakeClass.head)
      addPointClass(this.table, tail, snakeClass.body)

      console.debug("makeSnake");

      return [head, tail]
    }

    makeApple(badPoints) {
      let apple = genRandCoord(this.width, this.height);

      do {
        apple = genRandCoord(this.width, this.height)
      } while (containPoint(apple, badPoints));

      console.debug(`makeApple x=${apple.x} y=${apple.y}`)

      addPointClass(this.table, apple, appleClass);

      return apple
    }
  }

  function containPoint(point, points) {

    for (p of points) {

      if (equalCoord(p, point)) {
        return true
      }

    }

    return false
  }

  function equalCoord(p1, p2) {
    return (p1.x == p2.x) && (p1.y == p2.y)
  }

  function genRandCoord(maxX, maxY) {

    randomInteger = (min, max) => {
      let rand = min + Math.random() * (max - min);
      return Math.floor(rand);
    }

    const x = randomInteger(0, maxX);
    const y = randomInteger(0, maxY);

    return new Point(x, y);
  }

  function addPointClass(table, coord, className) {
    table[coord.y][coord.x].classList.add(className)
  }

  function removePointClass(table, coord, className) {
    table[coord.y][coord.x].classList.remove(className)
  }

  function saveScore(score) {
    const record = getHighScore();
    if (record > score) {
      console.log("record is bigger then score");
      return
    }
    saveHighScore(score);

    console.log(`score: ${score} saved`);
  }

  function getHighScore() {
    return +localStorage.getItem("highscore")
  }

  function saveHighScore(score) {
    localStorage.setItem("highscore", +score);
  }


  function showScore(score = 0) {
    const scoreElement = document.querySelector(".score");
    const hs = getHighScore();
    msg = `Highscore: ${hs}`
    if (score > 0) {
      msg += `\tCurrent score:${score}`;
    }
    scoreElement.textContent = msg;
  }

  function gameWait(game) {
    menuElement.style.display = "none";
    gameElement.style.display = "flex";

    const promise = game.start();

    promise
      .then((score) => {
        saveScore(score);
        showScore();
      })
      .catch(saveScore)
      .finally(() => {
        gameElement.style.display = "none";
        menuElement.style.display = "flex";
      })
  }

  function invertSpeed(speedInput) {
    return speedInput.max - speedInput.value + +speedInput.min
  }

  function checkAndShakeInvalidInputs() {
    let hasInvalid = false;

    const inputs = document.querySelectorAll(".input_num:invalid");

    for (const input of inputs) {
      console.log(`${input.name} is invalid`)
      hasInvalid = true;
      input.classList.add("apply-shake");
      input.addEventListener("animationend", (e) => {
        input.classList.remove("apply-shake");
      })
    }
    return hasInvalid;
  }


}



document.addEventListener("DOMContentLoaded", initGame);
