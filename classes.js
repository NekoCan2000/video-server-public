class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
Vec.prototype.toString = function() {
  return '(' + this.x + ',' + this.y + ')';
}

<<<<<<< HEAD
class Obj {
  constructor(pos, size) {
    this.pos = pos;
    this.size = size;
  }
}

class Video {
=======
class Video {

>>>>>>> 9899c9d98b2d6eb7e4397040219a4023e909f3e3
  constructor(pos, ID, capture) {
    this.size = new Vec(0,0);
    this.pos = pos;
    this.ID = ID;
    this.capture = capture;
    this.videoEnable = true;
    this.results = undefined;
    this.handsEnable = true;
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
/*
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
*/
    //
    //https://pisuke-code.com/javascript-class-this-in-callback/
    hands.onResults((results) => {
      this.results = results;
    });
  }
}

Video.prototype.toString = function() {
  return 'video ' + this.ID + '\n{ pos:' + this.pos + ' size:' + this.size + ' enable:' +
    this.videoEnable + ' stream:' + this.capture.elt.stream + ' }';
}

class Message {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
}
Message.prototype.toString = function() {
  return '[' + this.type + ' , ' + this.data + ']';
}
