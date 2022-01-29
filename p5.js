//https://qiita.com/yusuke84/items/54dce88f9e896903e64f
let localVideo = null;
let others = [];
let dummys = [];
let draggingVideo = null;
let hideCapture = null;
let checkbox;
let handResults;
let blackimg;
let mathf;
let averagePing = 0;
let regularTime = new Timer(10);
let dragTimer = new Timer(0.5);

const MOVING = 'MOVING';
const RESIZE = 'RESIZE';
const ENAVID = 'ENAVID';
const HIGTOC = 'HIGTOC';
const HNDRES = 'HNDRES';
const REGULAR = 'REGULAR';//定期送信
const ISHIGH = 'ISHIGH';
const CATBAL = 'CATBAL';
const END = 'END';

function setupVideo(stream, peer) {
  let first = localVideo === null;
  if (first) {
    let capture = createVideo();
    //Canvas API https://developer.mozilla.org/ja/docs/Web/API/Canvas_API
    capture.hide();//canvas を使用した動画の操作 (en-US) https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Manipulating_video_using_canvas 
    let videoSize = new Vec(321, 242);

    //capture.elt.videowidth = videoSize.x;
    //capture.elt.videoheight = videoSize.y;
    capture.elt.autoplay = true;

    let pos = createVector(width / 2, width / 2);

    localVideo = new Video(pos, videoSize, peer.id, capture);

    let camera = new Camera(capture.elt, {
      onFrame: async () => {
        await hands.send({//手の映像を送信
          image: capture.elt
        });
      },
      width: videoSize.x,
      height: videoSize.y
    });
    camera.start();
    console.log("camera", camera);
    HighFiveInit();
    catchBallInit();
  }
  localVideo.capture.elt.srcObject = stream;
  ResizeAllVideos();
  console.log("localVideo:", localVideo);
}



function setup() {
  frameRate(30);
  imageMode(CENTER);
  rectMode(CENTER);
  ellipseMode(CENTER);
  mathf = new Mathf();
  //canvas作成
  createCanvas(windowWidth, windowHeight);
  window.onresize = function () {
    resizeCanvas(windowWidth, windowHeight);
  };
  checkbox = createCheckbox('', true);
  checkbox.changed(SwitchVideo);
  blackimg = loadImage('/image/nekocan.png');
  console.log('setup');
}

function addOtherVideo(otherStream) {
  console.log('add videos');
  console.log(otherStream);
  let capture = createVideo();
  capture.elt.autoplay = true;
  //capture.elt.srcObject = otherStream;
  capture.hide();
  let pos = createVector(windowWidth / 2, windowHeight / 2);
  for (let i = 0; i < others.length; i++) {
    pos.x + others[i].size.x;
  }
  let video = new Video(pos, new Vec(320, 240), otherStream.peerId, capture);
  video.capture.elt.srcObject = otherStream;
  others.push(video);
  ResizeAllVideos();
  console.log("addOtherVideo");
  console.log(video);
}

function removeOtherVideo(peerId) {
  let index = SearchOthers(peerId);
  if (index === -1) {
    return;
  }
  others.splice(index, 1);
  ResizeAllVideos();
}

function draw() {
  background(100);
  if (!regularTime.isWait) {
    regularTime.startTimer();
    //Send(REGULAR, new ReceiveMessage(Date.now()));
  }
  if (localVideo === null) return;

  if (!dragTimer.isWait) {
    dragTimer.startTimer();

    if (draggingVideo !== null) {
      Send(MOVING, new Vec(localVideo.pos.x / windowWidth, localVideo.pos.y / windowHeight));
    }
    if (localVideo.results) {
      //(今回手を認識している || 前回手を認識している)
      if (localVideo.results.multiHandLandmarks.length > 0 || (handResults && handResults.multiHandLandmarks.length > 0)) {
        Send(HNDRES, localVideo.results);
        handResults = localVideo.results;
      }
    }
  }
  if (localVideo) {
    img(localVideo);
    checkbox.position(localVideo.pos.x, checkbox.size().height / 2 + localVideo.pos.y + localVideo.size.y / 2);
    if (isDrawRect) {
      DrawHands(localVideo, localVideo, 1, 1);
    }
  }
  if (others.length + dummys.length > 0) {
    aveOthersHands = DrawAndCalcOthers();//他参加者のdrawと手の位置の平均値計算して返す
  }
  if (isHighFive) {
    HighFive();
  }

  catchBallUpdate();

}

function img(cap) {
  if (cap.videoEnable) {
    /*
    push()
    tra(cap);
    scale(-1,1);
    image(cap.capture, 0, 0, cap.size.x, cap.size.y);//鏡チャレンジ
    pop();*/
    image(cap.capture, cap.pos.x, cap.pos.y, cap.size.x, cap.size.y);//鏡なし 通常
    //image(cap.capture,cap.pos.x,cap.pos.y,cap.capture.width,cap.capture.height);
  } else {
    image(blackimg, cap.pos.x, cap.pos.y, blackimg.width, blackimg.height);
  }
  text(cap.ID, cap);
}

function DrawHands(inVideo, outVideo, recStroke, connStroke) {

  if (inVideo.results && inVideo.results.multiHandLandmarks) {
    let len = inVideo.results.multiHandLandmarks.length;
    for (let i = 0; i < len; i++) {
      let landmarks = inVideo.results.multiHandLandmarks[i];
      if (!landmarks) continue;
      let obj = new Obj(outVideo.pos, outVideo.size);
      let leftRight = getIndexLR(inVideo.results.multiHandedness[i]);
      let minMaxPos = inVideo.minMaxes[leftRight];
      DrawRect(obj, minMaxPos, recStroke);
      DrawConnectors(obj, landmarks, connStroke);
      DrawCenterMark(outVideo, minMaxPos, 2);

      noFill();
      stroke(255);
      strokeWeight(1);
      let cap = outVideo;
      text(inVideo.results.multiHandedness[i].label + ":" + Math.round(inVideo.results.multiHandedness[i].score * 1000) / 10 + "%", (cap.pos.x - cap.size.x / 2) + (cap.size.x * minMaxPos[0]), (cap.pos.y - cap.size.y / 2) + (cap.size.y * minMaxPos[3]) + 10);
    }
  }
}

function SwitchVideo() {
  localVideo.videoEnable = checkbox.checked();
  Send(ENAVID, checkbox.checked());
}

function mousePressed() {

  if (collide(mouseX, mouseY, localVideo)) {
    if (mouseButton === LEFT) {
      draggingVideo = localVideo;
    } else { //RIGHT
      let resize = localVideo.size;
      //resize.x *= 0.75;
      //resize.y *= 0.75;
      resize.set(resize.x * 0.75, resize.y * 0.75);
      if (resize.x < windowWidth / 20) {
        resize.set(localVideo.capture.width, localVideo.capture.height);
        //resize.x = localVideo.capture.width;
        //resize.y = localVideo.capture.height;
      }
      Send(RESIZE, resize);
    }
  } else { //マウスの位置は自分のビデオじゃない
    for (let i = 0; i < dummys.length; i++) { //ダミーをクリックしてる説
      if (collide(mouseX, mouseY, dummys[i])) {
        draggingVideo = dummys[i];
      }
    }
  }

  function collide(x, y, video) {
    return (abs(video.pos.x - x) < video.size.x / 2) && ((abs(video.pos.y - y) < video.size.y / 2));
  }
}

function mouseDragged() {
  if (draggingVideo !== null) {
    draggingVideo.pos = createVector(mouseX, mouseY);
  }
}

function mouseReleased() {
  mouseDragged();
  draggingVideo = null;
}

function ResizeAllVideos() {
  let i = 1;//自身の1
  for (; i * i <= others.length + dummys.length; i++);
  let size = getSize(localVideo, i);
  ResizeVideo(localVideo, size);
  for (i = 0; i < others.length; i++) {
    ResizeVideo(others[i], size);
  }
  for (i = 0; i < dummys.length; i++) {
    ResizeVideo(dummys[i], size);
  }

  function getSize(video, num) {
    let ratio = video.size.x / video.size.y;
    let x = (windowWidth * 0.5) / num;
    let y = x / ratio;
    return new Vec(x, y);
  }
}

function ReceivedMessage(peerID, msg) {
  console.log('receive:' + peerID + ':', msg);
  let index = SearchOthers(peerID);
  if (index === -1) {
    console.warn("not found peerID");
    return;
  }

  switch (msg.type) {
    case MOVING:
      moveVideo(index, msg.data);
      break;
    case RESIZE:
      ResizeOtherVideo(index, msg.data);
      break;
    case ENAVID:
      EnableOtherVideo(index, msg.data);
      break;
    case HNDRES:
      HandsOthersResults(index, msg.data);
      break;
    case REGULAR:
      ReceiveRegular(index, msg.data);
      break;
    case ISHIGH:
      ReceiveIsHighFive(index, msg.data);
      break;
    case CATBAL:
      ReceiveStartCatch(index, msg.data);
      break;
    default:
      console.warn('not format message:');
      console.warn(msg);
      break;

  }
}

function ResizeVideo(cap, size) {
  //cap.size.x = size.x;
  //cap.size.y = size.y;
  cap.size.set(size.x, size.y);
  //cap.capture.elt.videoWidth = size.x;
  //cap.capture.elt.videoHeight = size.y;
  //cap.size.x = cap.capture.width * 2;
  //cap.size.y = cap.capture.height * 2;
}

function SearchOthers(peerId) {
  for (let i = 0; i < others.length; i++) {
    if (others[i].ID === peerId) return i;
  }
  console.warn('not found:' + peerId);
  return -1;
}

function moveVideo(index, pos) {
  others[index].pos = createVector(pos.x * windowWidth, pos.y * windowHeight);
}

function ResizeOtherVideo(index, size) {
  ResizeVideo(others[index], size);
}

function EnableOtherVideo(index, enable) {
  others[index].videoEnable = enable;
}

function HandsOthersResults(index, results) {
  others[index].setResults(results);

}

function ReceiveRegular(index, receiveMessage) {
  if (receiveMessage.isGo) {
    receiveMessage.isGo = false;
    receiveMessage.remsg = Date.now();
    Send(REGULAR, receiveMessage);
  }
  else {
    others[index].ping = receiveMessage.remsg - receiveMessage.msg;
    let ave = localVideo.ping;
    for (let i = 0; i < others.length; i++)ave += others[i].ping;
    averagePing = ave / (others.length + 1);
    console.log(averagePing);
  }

}

function ReceiveIsHighFive(index, isHigh) {
  isHighFive = isHigh;
  document.getElementById("ChangeIsHighFive").checked = isHighFive;
}

function ReceiveStartCatch(index, fromAndTo) {
  if (fromAndTo === END) {
    selfBall = undefined;
    return;
  }
  let target;
  if (fromAndTo.target === localVideo.ID) {
    target = localVideo;
  } else {
    let targetI = SearchOthers(fromAndTo.target);
    if (targetI === -1) {
      return;
    }
    target = others[targetI];
  }

  if (selfBall) {
    selfBall.setTarget(target);
  } else {
    let from;
    if (fromAndTo.from === localVideo.ID) {
      from = localVideo;
    } else {
      let fromI = SearchOthers(fromAndTo.from);
      if (fromI === -1) {
        return;
      }
      from = others[fromI];
      selfBall = new Ball(from.pos, from);
      selfBall.setTarget(target);
    }
  }

}

function text(text, cap) {
  noFill();
  stroke(0);
  strokeWeight(1);
  text(text, cap.pos.x - cap.size.x / 2, cap.pos.y - cap.size.y / 2 - 10);
}






//他参加者のdrawと手の位置の平均値計算して返す
function DrawAndCalcOthers() {
  let aveMinMaxPos = [//四隅の平均値
    { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  ];
  let valueChanged = [false, false];
  let othersLen = others.length;
  for (let i = 0; i < othersLen; i++) {//他参加者を網羅するfor
    img(others[i]);
    if (isDrawRect) DrawHands(others[i], others[i], 0.7, 0.7);
    if (!others[i].results) continue;
    for (let j = 0; j < 2; j++) { //右手左手用のfor
      let minMax = others[i].minMaxes[i]
      if (!minMax) continue;
      aveMinMaxPos[j].minX += minMax.minX;
      aveMinMaxPos[j].minY += minMax.minY;
      aveMinMaxPos[j].maxX += minMax.maxX;
      aveMinMaxPos[j].maxY += minMax.maxY;
      valueChanged[j] = true;
    }
  }

  let aveLength = aveMinMaxPos.length;
  for (let i = 0; i < aveLength; i++) {
    if (valueChanged[i]) {
      aveMinMaxPos[i].minX /= othersLen;
      aveMinMaxPos[i].minY /= othersLen;
      aveMinMaxPos[i].maxX /= othersLen;
      aveMinMaxPos[i].maxY /= othersLen;
      if (isDrawRect) {
        DrawRect(localVideo, aveMinMaxPos[i], 1);
        DrawCenterMark(localVideo, aveMinMaxPos[i], 2);
      }
    } else {
      aveMinMaxPos[i] = undefined;
    }
  }
  return aveMinMaxPos;

  function groupAverage(others) {

  }
}

//左手は0右手は1　その他がありえたら-1を返す
function getIndexLR(handedness) {
  if (handedness.label === "Left") return 0;
  else if (handedness.label === "Right") return 1;
  else return -1;
}
//映像の左上を取得
function getLeftUpPos(video) {
  return createVector(video.pos.x - video.size.x / 2, video.pos.y - video.size.y / 2);
}
function getRightUpPos(video) {
  return createVector(video.pos.x + video.size.x / 2, video.pos.y - video.size.y / 2);
}

function tranScale(video, scaleX, scaleY) {
  let pos = getLeftUpPos(video);
  translate(pos.x * scaleX, pos.y * scaleY);
}

function tra(video) {
  let pos = getLeftUpPos(video);
  translate(pos.x, pos.y);
}

function Line(video, pax, pay, pbx, pby) {
  line(pax * video.size.x, pay * video.size.y, pbx * video.size.x, pby * video.size.y);
}

function DrawRect(video, pos, weight) {
  DrawRectC(video, pos, weight, color(0, 255, 0));
}
function DrawRectC(video, pos, weight, color) {
  strokeWeight(weight);
  stroke(color);
  push();
  tra(video);
  //pos{minX, maxX, minY, maxY}
  Line(video, pos.minX, pos.minY, pos.minX, pos.maxY);
  Line(video, pos.minX, pos.maxY, pos.maxX, pos.maxY);
  Line(video, pos.maxX, pos.maxY, pos.maxX, pos.minY);
  Line(video, pos.maxX, pos.minY, pos.minX, pos.minY);
  pop();
}

function DrawCenterMark(video, pos, weight) {
  return DrawCenterMarkC(video, pos, weight, color(255, 0, 0));
}
function DrawCenterMarkC(video, pos, weight, color) {
  let center = getCenterMark(video, pos);
  stroke(color);
  strokeWeight(weight);
  noFill();
  ellipse(center.pos.x, center.pos.y, center.size.x, center.size.y);
  return center;
}
function getCenterMarks(video, minMaxPoses) {
  let marks = [undefined, undefined];
  for (let i = 0; i < 2; i++) {
    if (!minMaxPoses[i]) continue;
    marks[i] = getCenterMark(video, minMaxPoses[i]);
  }
  return marks;
}
function getCenterMark(video, minMaxPos) {
  //minMaxPos{minX, maxX, minY, maxY}
  let size = min(minMaxPos.maxX - minMaxPos.minX, minMaxPos.maxY - minMaxPos.minY) * 0.3 * max(video.size.x, video.size.y);
  let lu = getLeftUpPos(video);
  let pos = createVector(lu.x + ((minMaxPos.minX + minMaxPos.maxX) * 0.5) * video.size.x, lu.y + ((minMaxPos.minY + minMaxPos.maxY) * 0.5) * video.size.y);

  return new Obj(pos, createVector(size, size));
}


//https://google.github.io/mediapipe/solutions/hands#javascript-solution-api
function DrawConnectors(video, marks, weight) {
  function LineMarks(a, b) {
    Line(video, marks[a].x, marks[a].y, marks[b].x, marks[b].y);
  }
  strokeWeight(weight);
  stroke(0, 0, 255);
  push();
  tra(video);
  //LineMarks(,);
  LineMarks(0, 1);
  LineMarks(1, 2);
  LineMarks(2, 3);
  LineMarks(3, 4);

  LineMarks(0, 5);
  LineMarks(5, 9);
  LineMarks(9, 13);
  LineMarks(13, 17);
  LineMarks(17, 0);

  LineMarks(5, 6);
  LineMarks(6, 7);
  LineMarks(7, 8);

  LineMarks(9, 10);
  LineMarks(10, 11);
  LineMarks(11, 12);

  LineMarks(13, 14);
  LineMarks(14, 15);
  LineMarks(15, 16);

  LineMarks(17, 18);
  LineMarks(18, 19);
  LineMarks(19, 20);
  pop();
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}
