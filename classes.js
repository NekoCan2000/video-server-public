class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
Vec.prototype.toString = function () {
  return '(' + this.x + ',' + this.y + ')';
}

class Obj {
  constructor(pos, size) {
    this.pos = pos;
    this.size = size;
  }
}

class Color {
  constructor(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  getColor() {
    return color(this.r, this.g, this.b, this.a);
  }
  set(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
}

class Video extends Obj {
  constructor(pos, ID, capture) {
    super(pos, new Vec(0, 0));
    this.ID = ID;
    this.capture = capture;
    this.videoEnable = true;
    this.results = undefined;
    this.handsEnable = true;
    /*
        let hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });
        hands.setOptions({
          maxNumHands: 2,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
    
        let camera = new Camera(capture.elt, {
          onFrame: async () => {
            await hands.send({
              image: capture.elt
            });
          },
          width: capture.width,
          height: capture.height
        });
        camera.start();
    
        //ラムダ式じゃないとthis.が使えない
        //https://pisuke-code.com/javascript-class-this-in-callback/
        hands.onResults((results) => {
          this.results = results;
        });
        */
  }
}

Video.prototype.toString = function () {
  return 'video ' + this.ID + '\n{ pos:' + this.pos + ' size:' + this.size + ' enable:' +
    this.videoEnable + ' stream:' + this.capture.elt.stream + ' }';
}

class Message {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
}
Message.prototype.toString = function () {
  return '[' + this.type + ' , ' + this.data + ']';
}
class Effect extends Obj {
  constructor(pos, size, dire, color) {
    super(pos, size);
    this.dire = dire;
    this.color = color;
  }
}

class EffectsManager {
  constructor(video) {
    this.video = video;
    this.effects = [];
    this.pool = [];
    this.force = createVector(0, 1.0);
    this.speed = 10;
    this.size = 10;
  }
  addEffect(minMax) {
    let ram = Math.random();
    let theta = Math.random();
    let pos;
    let dire;
    //ue kara tokeimawarini hen no pos
    if (ram < 0.25) {//ue no hen
      dire = createVector(Math.cos(Math.PI * theta), Math.sin(Math.PI * theta));
      pos = createVector(minMax[0] + ((minMax[1] - minMax[0]) * theta), minMax[2]);
    }
    else if (ram < 0.25) {//migi no hen
      dire = createVector(Math.cos(Math.PI * theta / 2), Math.sin(Math.PI * theta / 2));
      pos = createVector(minMax[1], minMax[2] + ((minMax[3] - minMax[2]) * theta));
    }
    else if (ram < 0.75) {//sita no hen
      dire = createVector(Math.cos(Math.PI * theta), Math.sin(Math.PI * theta));
      pos = createVector(minMax[0] + ((minMax[1] - minMax[0]) * theta), minMax[3]);
    }
    else {//hidari no hen
      dire = createVector(Math.cos(Math.PI - Math.PI * theta / 2), Math.sin(Math.PI - Math.PI * theta / 2));
      pos = createVector(minMax[0], minMax[2] + ((minMax[3] - minMax[2]) * theta));
    }
    dire.mult(this.speed);
    dire.y *= -1;//ue muki ha minus
    pos.x *= this.video.size.x;
    pos.y *= this.video.size.y;
    pos.add(getLeftUpPos(this.video));
    let effect;
    if (this.pool.length > 0) {
      effect = this.pool.pop();
      effect.pos = pos;
      effect.size = dire;
      effect.color.a = 255;
    }
    else effect = new Effect(pos, this.size * theta, dire, new Color(225, 225, 0, 255));
    this.effects.push(effect);
  }
  update() {
    noStroke();
    let i = 0;
    while (i < this.effects.length) {
      let effect = this.effects[i];
      if (!effect) {
        i++;
        continue;
      }

      effect.size.add(this.force);//jiyu rakka
      effect.color.a -= this.speed;//fade out
      effect.pos.add(effect.size);
      if (effect.pos.x - this.size < 0 || effect.pos.x + this.size > width ||
        effect.pos.y - this.size < 0 || effect.pos.y + this.size > height ||
        effect.color.a <= 0) {
        this.pool.push(this.effects[i]);
        this.effects.splice(i, 1);//i banme 1 ko toridasi
        continue;
      }
      fill(effect.color.getColor());
      ellipse(effect.pos.x, effect.pos.y, this.size, this.size);
      i++;
    }

  }
}