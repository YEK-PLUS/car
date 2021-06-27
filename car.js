/* global Image, requestAnimationFrame, io */

// Physics

const maxPower = 0.075;
const maxReverse = 0.0375;
const powerFactor = 0.001;
const reverseFactor = 0.0005;

const drag = 0.95;
const angularDrag = 0.95;
const turnSpeed = 0.002;
let gg = false;
// Key codes

const arrowKeys = {
  up: 38,
  down: 40,
  left: 37,
  right: 39,
};
const wasdKeys = {
  up: 87,
  down: 83,
  left: 65,
  right: 68,
};

const keyActive = (key) => {
  return keysDown[arrowKeys[key]] || keysDown[wasdKeys[key]] || false;
};

let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;

const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d");

const scene = document.getElementsByClassName("scene")[0];

const localCar = {
  el: document.getElementsByClassName("car")[0],
  x: windowWidth / 2,
  y: windowHeight / 2,
  xVelocity: 0,
  yVelocity: 0,
  power: 0,
  reverse: 0,
  angle: 0,
  angularVelocity: 0,
  isThrottling: false,
  isReversing: false,
};

const cars = [localCar];
const carsById = {};

const keysDown = {
  38: true,
  87: true,
};

let needResize;
let resizing;

//wasd arrow keys handler
window.addEventListener("keydown", (e) => {
  keysDown[e.which] = true;
});

window.addEventListener("keyup", (e) => {
  keysDown[e.which] = false;
});
//wasd arrow keys handler

const touching = {
  up: 0,
  down: 0,
  left: 0,
  right: 0,
};
const gameover = () => {
  //oyun bitti
  localCar.x = windowWidth / 2;
  localCar.y = windowHeight / 2;
  localCar.xVelocity = 0;
  localCar.yVelocity = 0;
  localCar.power = 0;
  localCar.reverse = 0;
  localCar.angle = 0;
  localCar.angularVelocity = 0;
  gg = true;
};

function updateCar(car, i) {
  if (car.isThrottling) {
    car.power += powerFactor * car.isThrottling;
  } else {
    car.power -= powerFactor;
  }
  if (car.isReversing) {
    car.reverse += reverseFactor;
  } else {
    car.reverse -= reverseFactor;
  }

  car.power = Math.max(0, Math.min(maxPower, car.power));
  car.reverse = Math.max(0, Math.min(maxReverse, car.reverse));

  const direction = car.power > car.reverse ? 1 : -1;

  if (car.isTurningLeft) {
    car.angularVelocity -= direction * turnSpeed * car.isTurningLeft;
  }
  if (car.isTurningRight) {
    car.angularVelocity += direction * turnSpeed * car.isTurningRight;
  }

  car.xVelocity += Math.sin(car.angle) * (car.power - car.reverse);
  car.yVelocity += Math.cos(car.angle) * (car.power - car.reverse);

  car.x += car.xVelocity;
  car.y -= car.yVelocity;
  car.xVelocity *= drag;
  car.yVelocity *= drag;
  car.angle += car.angularVelocity;
  car.angularVelocity *= angularDrag;
}

function update() {
  cars.forEach(updateCar);
}

let lastTime;
let acc = 0;
const step = 1 / 120;

setInterval(() => {
  if (gg) return false;
  const canTurn = localCar.power > 0.0025 || localCar.reverse;

  if (touching.active) {
    const throttle = Math.round(touching.up * 10) / 10;
    const reverse = Math.round(touching.down * 10) / 10;

    if (
      localCar.isThrottling !== throttle ||
      localCar.isReversing !== reverse
    ) {
      localCar.isThrottling = throttle;
      localCar.isReversing = reverse;
    }
    const turnLeft = canTurn && Math.round(touching.left * 10) / 10;
    const turnRight = canTurn && Math.round(touching.right * 10) / 10;

    if (localCar.isTurningLeft !== turnLeft) {
      localCar.isTurningLeft = turnLeft;
    }
    if (localCar.isTurningRight !== turnRight) {
      localCar.isTurningRight = turnRight;
    }
  } else {
    const pressingUp = keyActive("up");
    const pressingDown = keyActive("down");

    if (
      localCar.isThrottling !== pressingUp ||
      localCar.isReversing !== pressingDown
    ) {
      localCar.isThrottling = pressingUp;
      localCar.isReversing = pressingDown;
    }

    const turnLeft = canTurn && keyActive("left");
    const turnRight = canTurn && keyActive("right");

    if (localCar.isTurningLeft !== turnLeft) {
      localCar.isTurningLeft = turnLeft;
    }
    if (localCar.isTurningRight !== turnRight) {
      localCar.isTurningRight = turnRight;
    }
  }

  if (localCar.x > windowWidth) {
    gameover();
  } else if (localCar.x < 0) {
    gameover();
  }

  if (localCar.y > windowHeight) {
    gameover();
  } else if (localCar.y < 0) {
    gameover();
  }

  const ms = Date.now();
  if (lastTime) {
    acc += (ms - lastTime) / 1000;

    while (acc > step) {
      update();

      acc -= step;
    }
  }

  lastTime = ms;
}, 1000 / 60);

function randomizeCarColour(el) {
  const colour = `hsl(${Math.floor(Math.random() * 16 * 16)}, 75%, 50%)`;

  el.style.background = colour;
}

function renderCar(car) {
  const { x, y, angle, power, reverse, angularVelocity } = car;

  car.el.style.transform = `translate(${x}px, ${y}px) rotate(${
    (angle * 180) / Math.PI
  }deg)`;

  if (power > 0.0025 || reverse) {
    if (
      (maxReverse === reverse || maxPower === power) &&
      Math.abs(angularVelocity) < 0.002
    ) {
      return;
    }
    ctx.fillRect(
      x -
        Math.cos(angle + (3 * Math.PI) / 2) * 3 +
        Math.cos(angle + (2 * Math.PI) / 2) * 3,
      y -
        Math.sin(angle + (3 * Math.PI) / 2) * 3 +
        Math.sin(angle + (2 * Math.PI) / 2) * 3,
      1,
      1
    );
    ctx.fillRect(
      x -
        Math.cos(angle + (3 * Math.PI) / 2) * 3 +
        Math.cos(angle + (4 * Math.PI) / 2) * 3,
      y -
        Math.sin(angle + (3 * Math.PI) / 2) * 3 +
        Math.sin(angle + (4 * Math.PI) / 2) * 3,
      1,
      1
    );
  }
}

function render(ms) {
  requestAnimationFrame(render);

  if (needResize || resizing) {
    needResize = false;

    if (!resizing) {
      resizing = true;

      const prevImage = new Image();
      prevImage.src = canvas.toDataURL();

      prevImage.onload = () => {
        resizing = false;

        canvas.width = windowWidth;
        canvas.height = windowHeight;

        ctx.fillStyle = "rgba(63, 63, 63, 0.25)";

        ctx.drawImage(prevImage, 0, 0);
      };
    }
  }

  cars.forEach(renderCar);
}

requestAnimationFrame(render);

function resize() {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;

  needResize = true;
}

resize();

window.addEventListener("resize", resize);

setInterval(() => {
  ctx.fillStyle = "rgba(255, 255, 255, .05)";
  ctx.fillRect(0, 0, windowWidth, windowHeight);
  ctx.fillStyle = "rgba(63, 63, 63, 0.25)";
}, 30000);
