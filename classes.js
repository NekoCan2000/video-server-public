class Mathf {
  constructor() {
    this.sin = [];
    this.cos = [];
    for (let i = 0; i < 360; i++) {
      this.sin.push(sin(i));
      this.cos.push(cos(i));
    }
    this.sin.push(this.sin[0]);
    this.cos.push(this.cos[0]);
  }
}

class ReceiveMessage {
  constructor(msg) {
    this.isGo = true;
    this.msg = msg;
    this.remsg;
  }
}

class Vec {
  constructor(x, y) {
    this.set(x, y);
  }
  set(x, y) {
    this.x = x;
    this.y = y;
  }
  copy() {
    return new Vec(this.x, this.y);
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
    this.a = a ? a : 255;
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
  constructor(pos, size, ID, capture) {
    super(pos, size);
    this.ID = ID;
    this.capture = capture;
    this.videoEnable = true;
    this.results = undefined;
    this.handsEnable = true;
    this.highFive = [false, false];
    this.ping = 1;
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
    this.enbale = true;
  }
}

class EffectsManager {
  constructor(color) {
    this.color = color;
    this.effects = [];
    this.force = createVector(0, 0.5);
    this.speed = 10;
    this.size = 5;
  }
  addEffect(circle) {

    let theta = int(random(360));
    let effect;
    let dire = createVector(mathf.cos[theta], mathf.sin[theta]);
    dire.mult(this.speed);
    dire.y *= -1;//上向きはマイナス
    effect = new Effect(circle.pos, this.size, dire, this.color);
    effect.pos = circle.pos.add(effect.dire);
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

      effect.dire.add(this.force);//自由落下
      //effect.color.a -= this.speed * 2;//フェードアウト
      effect.pos.add(effect.dire);
      if (this.out(effect)) {
        this.effects.splice(i, 1);//i番目1個取り出す
        continue;
      }
      fill(effect.color.getColor());
      //ellipse(effect.pos.x, effect.pos.y, this.size, this.size);
      rect(effect.pos.x, effect.pos.y, this.size, this.size);
      i++;
    }// while end }

  }
  out(effect) {
    return effect.pos.x - this.size < 0 || effect.pos.x + this.size > width ||//X画面外
      effect.pos.y - this.size < 0 || effect.pos.y + this.size > height ||//Y画面外
      effect.color.a <= 0;//透明になった
  }
  update2() {
    noStroke();
    let i = 0;
    let disableRange = 0;
    let disableRangeBoolean = true;//連続でenableがfalse
    while (i < this.effects.length) {
      let effect = this.effects[i];
      if (!effect.enbale) {
        if (disableRangeBoolean) {
          disableRange++;
        }
        i++;
        continue;
      } else disableRangeBoolean = false;
      effect.dire.add(this.force);//自由落下
      //effect.color.a -= this.speed * 2;//フェードアウト
      effect.pos.add(effect.dire);
      if (this.out(effect)) {
        effect.enbale = false;
      } else {
        fill(effect.color.getColor());
        rect(effect.pos.x, effect.pos.y, this.size, this.size);
      }
      i++;
    }//while end }
    if (min(this.effects.length, 10) <= disableRange) {
      this.effects.splice(0, disableRange);
    }
  }
}

class Timer {
  constructor(second) {
    this.waitTime = second;
    this.isWait = false;
  }
  startTimer() {
    this.isWait = true;
    setTimeout(() => {
      this.isWait = false;
    }, this.waitTime * 1000);
  }
}

class Ball extends Obj {
  constructor(pos, size, target) {
    super(pos, size);
    this.isCatch = false;//目標にいるかどうか
    this.from;//出発
    this.target = target;//目標
    this.amt = 0;//線形補間の割合
    this.dist;//距離
  }
  update() {
    this.pos = p5.Vector.lerp(this.from.pos, this.target.pos, this.amt);
    //ボールの表示
    noStroke();
    fill(255);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);

    if (this.amt >= 1) {
      this.isCatch = false;
    } else {
      this.amt += 100 / this.dist / getFrameRate();
    }
  }
  setTarget(target) {
    this.isCatch = true;
    this.amt = 0;
    this.from = this.target;
    this.target = target;
    this.dist = dist(this.from.pos.x,this.from.pos.y,this.target.pos.x,this.target.pos.y);
  }
}

class BallManager {
  constructor(endFunc) {
    this.member;//参加者
    this.ball;//動くの
    this.endFunc = endFunc;//終了時の処理
  }
  start() {
    //配列の早いコピーらしい
    //https://qiita.com/takahiro_itazuri/items/882d019f1d8215d1cb67#:~:text=let%20arr2%20%3D%20%5B...arr1%5D%3B
    this.member = [...others].concat(dummys);
    this.ball = new Ball(localVideo.pos.copy(), 20, localVideo);
    this.selectTarget();
  }
  update() {
    this.ball.update();
    //ボールが到達
    if (!this.ball.isCatch) {
      this.selectTarget();
    }
  }
  //次の目標地点設定
  selectTarget() {
    let next;
    //もう渡ってない人がいない
    if (this.member.length === 0) {
      if(this.ball.target === localVideo){ //ラストの目標が自分なら1周
        this.endFunc();
        return;//キャッチボール終了
      } 
      next = localVideo;//ラスト自分
    } else {
      let index = randomInt(this.member.length);
      next = this.member[index];
      this.member.splice(index, 1);
    }

    this.ball.setTarget(next);
  }
}
