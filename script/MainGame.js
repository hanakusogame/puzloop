"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
//メインのゲーム画面
var MainGame = /** @class */ (function (_super) {
    __extends(MainGame, _super);
    function MainGame(scene) {
        var _this = this;
        var tl = require("@akashic-extension/akashic-timeline");
        var timeline = new tl.Timeline(scene);
        var timeline2 = new tl.Timeline(scene);
        var sizeW = 500;
        var sizeH = 360;
        _this = _super.call(this, { scene: scene, x: 0, y: 0, width: sizeW, height: sizeH }) || this;
        var colorBg = new g.FilledRect({
            scene: scene,
            width: 640,
            height: 360,
            cssColor: "#303030",
            opacity: 0.8
        });
        _this.append(colorBg);
        var bg = new g.Sprite({
            scene: scene,
            src: scene.assets["map"],
            opacity: 0.8
        });
        _this.append(bg);
        var base = new g.E({
            scene: scene,
            x: 12, y: 12,
            width: 640,
            height: 480,
            touchable: true
        });
        _this.append(base);
        var n = 24; // 32 個の四角で1つのうずを書く
        var m = 3; // 3 回巻く
        var sizeX = 250; //半径
        var sizeY = 180; //半径
        var maps = [];
        for (var h = 1; h < m; h++) {
            for (var i = 0; i < n; i++) {
                var theta = i * (2 * Math.PI / n);
                var rx = sizeX / (m * n) * i + sizeX / m * h;
                var ry = sizeY / (m * n) * i + sizeY / m * h;
                var x = Math.cos(theta) * rx + sizeX;
                var y = Math.sin(theta) * ry + sizeY;
                var rect = new Map({
                    scene: scene,
                    x: x,
                    y: y,
                    width: 3,
                    height: 3,
                    opacity: 0
                });
                base.append(rect);
                maps.unshift(rect);
            }
        }
        //円形の当たり判定
        var collision = function (bs, bd) {
            var distance = getDistance(bs, bd);
            return (distance <= bs.width * 0.85);
        };
        //距離を算出
        var getDistance = function (bs, bd) {
            return Math.sqrt((bd.x - bs.x) * (bd.x - bs.x) + (bd.y - bs.y) * (bd.y - bs.y));
        };
        for (var i = 0; i < maps.length - 1; i++) {
            maps[i].distance = getDistance(maps[i], maps[i + 1]);
            maps[i].nextAngle = Math.atan2(maps[i + 1].y - maps[i].y, maps[i + 1].x - maps[i].x);
        }
        //次のボール表示用
        var ballNext = new Ball({
            scene: scene,
            src: scene.assets["ball"],
            width: 60,
            height: 60,
            frames: [0, 1, 2],
            anchorY: 0.5,
            anchorX: 0.5,
            x: 235,
            y: 192
        });
        base.append(ballNext);
        //砲台の作成
        var playerBase = new g.FrameSprite({
            scene: scene,
            src: scene.assets["player"],
            x: 235,
            y: 175,
            width: 120,
            height: 100,
            anchorX: 0.5,
            anchorY: 0.5,
            frames: [0, 1]
        });
        base.append(playerBase);
        //ボールを飛ばす方向のガイド作成
        var guide = new g.FilledRect({
            scene: scene,
            x: 235,
            y: 165,
            width: 300,
            height: 20,
            cssColor: "yellow",
            opacity: 0.5,
            anchorX: 0,
            anchorY: 0.5,
            angle: 45
        });
        base.append(guide);
        //ボールの作成
        var ballsPool = [];
        var balls = [];
        var player;
        for (var i = 0; i < 128; i++) {
            var spr = new Ball({
                scene: scene,
                src: scene.assets["ball"],
                width: 60,
                height: 60,
                frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                anchorY: 0.5,
                anchorX: 0.5
            });
            base.append(spr);
            ballsPool.push(spr);
        }
        //エフェクト
        var effects = [];
        for (var i = 0; i < 4; i++) {
            var spr = new g.FrameSprite({
                scene: scene,
                src: scene.assets["effect"],
                width: 120,
                height: 120,
                frames: [0, 1, 2],
                anchorY: 0.5,
                anchorX: 0.5,
                interval: 120,
                opacity: 1
            });
            spr.start();
            effects.push(spr);
            base.append(spr);
        }
        //目印
        var anchor = new g.FilledRect({
            scene: scene,
            width: 20,
            height: 20,
            cssColor: "yellow",
            anchorX: 0.5,
            anchorY: 0.5
        });
        anchor.hide();
        base.append(anchor);
        var anchor2 = new g.FilledRect({
            scene: scene,
            width: 20,
            height: 20,
            cssColor: "yellow",
            anchorX: 0.5,
            anchorY: 0.5
        });
        base.append(anchor2);
        //ミス表示
        var sprMiss = new g.Sprite({
            scene: scene,
            src: scene.assets["clear"],
            width: 216,
            height: 80,
            srcY: 80,
            x: 130,
            y: 20
        });
        base.append(sprMiss);
        //連鎖
        var baseRen = new g.E({
            scene: scene,
            x: 450,
            y: 180
        });
        base.append(baseRen);
        var sprRen = new g.Sprite({
            scene: scene,
            src: scene.assets["combo"],
            width: 108,
            height: 40,
            x: 50,
            y: 15
        });
        baseRen.append(sprRen);
        var labelLen = new g.Label({
            scene: scene,
            font: scene.numFontB,
            fontSize: 60,
            text: "0"
        });
        baseRen.append(labelLen);
        //コンボ
        var baseCombo = new g.E({
            scene: scene,
            x: 450,
            y: 240
        });
        base.append(baseCombo);
        var sprCombo = new g.Sprite({
            scene: scene,
            src: scene.assets["combo"],
            width: 108,
            height: 40,
            x: 50,
            y: 15,
            srcY: 40
        });
        baseCombo.append(sprCombo);
        var labelCombo = new g.Label({
            scene: scene,
            font: scene.numFontP,
            fontSize: 60,
            text: "0"
        });
        baseCombo.append(labelCombo);
        //スコアを先行して算出
        var setScore = function (num) {
            var startPos = num;
            var endPos = num;
            var cnt = 0;
            var rensaCnt = 0;
            var score = 0;
            while (true) {
                if (endPos === balls.length)
                    break;
                var colorNum = balls[endPos].child.frameNumber;
                for (var j = endPos; j < balls.length; j++) {
                    if (balls[j].child === undefined || balls[j].child.frameNumber !== colorNum) {
                        endPos = j;
                        break;
                    }
                    else if (balls.length - 1 === j) {
                        endPos = balls.length;
                    }
                }
                //同色の隣り合っているボールを探す
                for (var j = startPos; j >= 0; j--) {
                    if (balls[j].child === undefined || balls[j].child.frameNumber !== colorNum) {
                        startPos = j;
                        break;
                    }
                }
                var len = endPos - startPos - 1 - cnt;
                if (len >= 3) {
                    rensaCnt++;
                    score += ((len - 2) * 500) * rensaCnt * (1.0 + (0.1 * comboCnt));
                    cnt += len;
                }
                else {
                    break;
                }
            }
            if (score > 0) {
                scene.addScore(Math.floor(score), 500 * rensaCnt);
            }
        };
        //追加する
        var add = function (ball) {
            if (isStop)
                return;
            isStop = true;
            var num = balls.indexOf(ball);
            //一番最後を戻す
            var ballLast = balls[balls.length - 1].child;
            nextColorNum = ballLast.frameNumber; //次に出す時この色にするためバックアップ
            setPool(ballLast);
            //ずらす
            for (var i = balls.length - 2; i >= num; i--) {
                var bs = balls[i];
                var bd = balls[i + 1];
                bd.child = bs.child;
                //bd.move();
                timeline.create(bd.child).moveTo(bd.x, bd.y, 200);
            }
            //挿入する
            balls[num].child = player;
            timeline.create(balls[num].child).moveTo(balls[num].x, balls[num].y, 100);
            //balls[num].move();
            renCnt = 0;
            scene.playSound("se_move");
            baseRen.hide();
            baseCombo.hide();
            setScore(num);
            timeline.create().wait(300).call(function () {
                clear(balls[num]);
            });
        };
        //消す
        var clear = function (ball) {
            var num = balls.indexOf(ball);
            var startPos = num;
            var endPos = num;
            if (balls.length >= 3) {
                //同色の隣り合っているボールを探す
                for (var j = num; j >= 0; j--) {
                    if (balls[j].child === undefined)
                        break;
                    if (balls[j].child.frameNumber === ball.child.frameNumber) {
                        startPos = j;
                    }
                    else {
                        break;
                    }
                }
                for (var j = num; j < balls.length; j++) {
                    if (balls[j].child === undefined)
                        break;
                    if (balls[j].child.frameNumber === ball.child.frameNumber) {
                        endPos = j;
                    }
                    else {
                        break;
                    }
                }
            }
            var len = endPos - startPos + 1;
            if (len >= 3) {
                //消す
                var cnt = 0;
                var _loop_1 = function (j) {
                    var b = balls[j].child;
                    b.frameNumber += 6;
                    b.modified();
                    var effect = effects[cnt];
                    effect.moveTo(b.x, b.y);
                    effect.show();
                    effect.modified();
                    balls[j].child = undefined;
                    timeline.create().wait(150).call(function () {
                        setPool(b);
                        effect.hide();
                    });
                    cnt++;
                };
                for (var j = startPos; j <= endPos; j++) {
                    _loop_1(j);
                }
                //先頭からきえる直前までのボールをずらす
                var top_1 = len - 1;
                for (var j = startPos - 1; j >= 0; j--) {
                    var bs = balls[j];
                    var bd = balls[j + len];
                    bd.child = bs.child;
                    if (balls[j].child) {
                        timeline.create(bd.child).wait(150).moveTo(bd.x, bd.y, 300);
                    }
                    else {
                        top_1 = j + len;
                        break;
                    }
                }
                for (var i = 0; i <= top_1; i++) {
                    balls[i].child = undefined;
                }
                renCnt++;
                if (renCnt > 1) {
                    baseRen.show();
                    labelLen.text = "" + renCnt;
                    labelLen.invalidate();
                    timeline.create(baseRen).every(function (a, b) {
                        baseRen.opacity = b;
                        baseRen.modified();
                    }, 50);
                }
                timeline.create().wait(500).call(function () {
                    if (endPos === balls.length - 1) {
                        clear(balls[endPos]);
                    }
                    else {
                        clear(balls[endPos + 1]);
                    }
                });
                scene.playSound("se_clear");
            }
            else {
                showCombo();
                isStop = false;
                //プレイヤー作成
                setPlayer();
            }
        };
        var showCombo = function () {
            //コンボの表示
            if (renCnt > 0) {
                comboCnt++;
                if (comboCnt > 1) {
                    baseCombo.show();
                    labelCombo.text = "" + comboCnt;
                    labelCombo.invalidate();
                    timeline.create(baseCombo).every(function (a, b) {
                        baseCombo.opacity = b;
                        baseCombo.modified();
                    }, 50);
                }
            }
            else {
                comboCnt = 0;
            }
        };
        var arrColor = [0, 1, 2];
        //プレイヤー作成
        var setPlayer = function () {
            player = ballsPool.shift();
            player.moveTo(235, 190);
            player.frameNumber = ballNext.frameNumber;
            player.modified();
            player.show();
            playerBase.frameNumber = 1;
            playerBase.modified();
            if (arrColor.length === 0) {
                arrColor = [0, 1, 2];
            }
            ballNext.frameNumber = arrColor.splice(scene.random.get(0, arrColor.length - 1), 1)[0];
            ballNext.modified();
            ballNext.hide();
            timeline.create(player).moveTo(235, 165, 120).call(function () {
                playerBase.frameNumber = 0;
                playerBase.modified();
                ballNext.show();
                isShot = true;
            });
        };
        //ボールをプールに戻す
        var setPool = function (ball) {
            ball.hide();
            ball.x = maps[0].x;
            ball.y = maps[0].y;
            ball.pos = 0;
            ball.child = undefined;
            ball.distance = 0;
            ball.opacity = 1.0;
            ball.modified();
            ballsPool.push(ball);
        };
        //線分と円の当たり判定(http://www.dango-itimi.com/blog/archives/2006/000858.html)ほぼコピペなので意味不明
        var hitCrclCls = function (ax, ay, bx, by, ox, oy, r) {
            //距離を求める
            var distance = function (x1, y1, x2, y2) {
                return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
            };
            var line = { pt1: { x: ax, y: ay }, pt2: { x: bx, y: by } };
            var crcl = { x: ox, y: oy, r: r };
            //V : 線分始点から終点へのベクトル
            //C : 線分始点から円中心へのベクトル
            var V = { x: line.pt2.x - line.pt1.x, y: line.pt2.y - line.pt1.y };
            var C = { x: crcl.x - line.pt1.x, y: crcl.y - line.pt1.y };
            //二つのベクトルの内積を求める
            var n1 = (V.y * C.y) + (V.x * C.x);
            if (n1 < 0) {
                //Cの長さが円の半径より小さい場合 : 交差している
                return (distance(line.pt1.x, line.pt1.y, crcl.x, crcl.y) < crcl.r) ? true : false;
            }
            var n2 = (V.y * V.y) + (V.x * V.x);
            if (n1 > n2) {
                //線分の終点と円の中心の距離の二乗を求める
                var len = Math.pow(distance(line.pt2.x, line.pt2.y, crcl.x, crcl.y), 2);
                //円の半径の二乗よりも小さい場合 : 交差している
                return (len < Math.pow(crcl.r, 2)) ? true : false;
            }
            else {
                var n3 = C.x * C.x + C.y * C.y;
                return (n3 - (n1 / n2) * n1 < Math.pow(crcl.r, 2)) ? true : false;
            }
        };
        var setBall = function () {
            var ball = ballsPool.shift();
            if (balls.length === 0) {
                //先頭は番兵とする
                ball.child = undefined;
            }
            else {
                ball.child = ballsPool.shift();
                var num = -1;
                if (balls.length > 2) {
                    var i = balls.length - 1;
                    var b1 = balls[i].child;
                    var b2 = balls[i - 1].child;
                    if (b1 && b2) {
                        num = (b1.frameNumber === b2.frameNumber) ? b1.frameNumber : -1;
                    }
                }
                while (true) {
                    var fNum = (nextColorNum === -1) ? scene.random.get(0, 2) : nextColorNum;
                    ball.child.frameNumber = fNum;
                    nextColorNum = -1;
                    if (ball.child.frameNumber !== num)
                        break;
                }
                ball.child.opacity = 1.0;
                ball.child.modified();
                ball.child.show();
            }
            ball.opacity = 0.0;
            ball.modified();
            ball.show();
            balls.push(ball);
        };
        var showAnchor = function () {
            //挿入ポイントを表示
            var xx = guide.x + Math.cos(angle + (Math.PI / 2)) * 25;
            var yy = guide.y + Math.sin(angle + (Math.PI / 2)) * 25;
            anchor.moveTo(xx + Math.cos(angle) * 250, yy + Math.sin(angle) * 250);
            anchor.modified();
            targetBall = undefined;
            anchor2.hide();
            for (var i = 1; i < balls.length; i++) {
                var ball = balls[i];
                if (ball.child === undefined)
                    continue;
                var isHit = hitCrclCls(xx, yy, anchor.x, anchor.y, ball.x, ball.y, ball.width / 2);
                if (isHit) {
                    var nextBall = balls[i - 1];
                    anchor2.moveTo((ball.x + nextBall.x) / 2, (ball.y + nextBall.y) / 2);
                    anchor2.modified();
                    if (!(guide.state & 1)) {
                        anchor2.show();
                    }
                    targetBall = ball;
                    break;
                }
            }
        };
        var isMove = false; //プレイヤーの移動状態
        var isShot = false; //ボールを発射できるかどうか
        var angle = 0; //射出角度（ラジアン)
        var renCnt = 0;
        var comboCnt = 0;
        var targetBall;
        var nextColorNum = -1;
        //ゲームループ
        base.update.add(function () {
            if (!scene.isStart || isStop)
                return;
            //回っているボールの移動
            for (var i = 0; i < balls.length; i++) {
                var ball = balls[i];
                var speed = 3.3;
                if (ball.pos < maps.length - 2) {
                    while (true) {
                        var map = maps[ball.pos];
                        if (ball.distance < map.distance) {
                            ball.x += Math.cos(map.nextAngle) * speed;
                            ball.y += Math.sin(map.nextAngle) * speed;
                            ball.modified();
                            ball.distance += speed;
                            break;
                        }
                        else {
                            ball.pos++;
                            ball.x = maps[ball.pos].x;
                            ball.y = maps[ball.pos].y;
                            speed = ball.distance + speed - map.distance;
                            ball.distance = 0;
                        }
                    }
                }
                else {
                    //終点まで来た時の処理
                    var b = balls[0];
                    if (b.child) {
                        miss();
                        break;
                    }
                    else {
                        balls.shift();
                        setPool(b);
                    }
                }
                //子の移動
                if (ball.child) {
                    ball.child.moveTo(ball.x, ball.y);
                    ball.child.modified();
                }
            }
            //発射したボールの移動
            if (isMove) {
                player.x += Math.cos(angle) * 30;
                player.y += Math.sin(angle) * 30;
                player.modified();
                if (targetBall !== undefined && targetBall.child !== undefined) {
                    if (getDistance(player, anchor2) < 40) {
                        add(targetBall);
                        isMove = false;
                    }
                }
                if (!isMove)
                    return;
                //画面端処理
                if (player.x < 0 || player.y < 0 || player.x > 550 || player.y > 480) {
                    isMove = false;
                    setPool(player);
                    setPlayer();
                }
            }
            else {
                showAnchor();
            }
            //ボールを出す
            var ballLast = balls[balls.length - 1];
            if (balls.length === 0 || !collision(ballLast, maps[0])) {
                setBall();
            }
        });
        base.pointDown.add(function (e) {
            if (!scene.isStart)
                return;
            var x = guide.x;
            var y = guide.y;
            angle = Math.atan2(e.point.y - y, e.point.x - x);
            var degree = angle * 180 / Math.PI;
            guide.angle = degree;
            guide.modified();
            guide.show();
            showAnchor();
            if (isStop || !isShot) {
                guide.cssColor = "gray";
            }
            else {
                guide.cssColor = "yellow";
            }
            guide.modified();
        });
        base.pointMove.add(function (e) {
            if (!scene.isStart)
                return;
            var x = guide.x;
            var y = guide.y;
            angle = Math.atan2(e.point.y + e.startDelta.y - y, e.point.x + e.startDelta.x - x);
            var degree = angle * 180 / Math.PI;
            guide.angle = degree;
            guide.modified();
            if (isStop || !isShot) {
                guide.cssColor = "gray";
            }
            else {
                guide.cssColor = "yellow";
            }
            guide.modified();
        });
        base.pointUp.add(function (e) {
            showAnchor();
            guide.hide();
            anchor2.hide();
            if (!scene.isStart || isStop || !isShot)
                return;
            isShot = false;
            isMove = true;
        });
        //ミス
        var miss = function () {
            isStop = true;
            var _loop_2 = function (j) {
                var ball = balls[j];
                if (ball.child) {
                    timeline.create().wait((j) * 50).call(function () {
                        ball.child.frameNumber = 5;
                        ball.child.modified();
                    });
                }
            };
            for (var j = 0; j < balls.length; j++) {
                _loop_2(j);
            }
            timeline.create().wait(1000).call(function () {
                scene.playSound("se_miss");
                sprMiss.show();
            }).wait(1500).call(function () {
                _this.reset();
            });
            scene.playSound("biri");
        };
        var isStop = false;
        //リセット
        _this.reset = function () {
            isStop = false;
            for (var i = 0; i < balls.length; i++) {
                if (balls[i].child) {
                    setPool(balls[i].child);
                }
                setPool(balls[i]);
            }
            balls.length = 0;
            if (player !== undefined) {
                setPool(player);
            }
            ballsPool = ballsPool.filter(function (x, i, self) {
                return self.indexOf(x) === i;
            });
            ballsPool.forEach(function (e) { return e.hide(); });
            for (var i = 0; i < ballsPool.length; i++) {
                var ball = ballsPool[i];
                ball.x = maps[0].x;
                ball.y = maps[0].y;
                ball.modified();
                ball.pos = 0;
                ball.opacity = 1.0;
                ball.distance = 0;
            }
            baseCombo.hide();
            baseRen.hide();
            sprMiss.hide();
            isMove = false;
            isShot = false;
            guide.hide();
            renCnt = 0;
            comboCnt = 0;
            anchor2.hide();
            nextColorNum = -1;
            effects.forEach(function (e) { return e.hide(); });
            setPlayer();
        };
        return _this;
    }
    return MainGame;
}(g.E));
exports.MainGame = MainGame;
var Ball = /** @class */ (function (_super) {
    __extends(Ball, _super);
    function Ball() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Ball.prototype.move = function () {
        if (this.child) {
            this.child.moveTo(this.x, this.y);
            this.child.modified();
        }
    };
    return Ball;
}(g.FrameSprite));
var Map = /** @class */ (function (_super) {
    __extends(Map, _super);
    function Map() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Map;
}(g.E));
