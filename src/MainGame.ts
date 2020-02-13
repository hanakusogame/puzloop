import { MainScene } from "./MainScene";
declare function require(x: string): any;

//メインのゲーム画面
export class MainGame extends g.E {
	public reset: () => void;
	public setMode: (num: number) => void;

	constructor(scene: MainScene) {
		const tl = require("@akashic-extension/akashic-timeline");
		const timeline = new tl.Timeline(scene);
		const timeline2 = new tl.Timeline(scene);
		const sizeW = 500;
		const sizeH = 360;
		super({ scene: scene, x: 0, y: 0, width: sizeW, height: sizeH });

		const colorBg = new g.FilledRect({
			scene: scene,
			width: 640,
			height: 360,
			cssColor: "#303030",
			opacity: 0.8
		});
		this.append(colorBg);

		const bg = new g.Sprite({
			scene: scene,
			src: scene.assets["map"],
			opacity: 0.8
		});
		this.append(bg);

		const base = new g.E({
			scene: scene,
			x: 12, y: 12,
			width: 640,
			height: 480,
			touchable: true
		});
		this.append(base);

		const n = 24; // 32 個の四角で1つのうずを書く
		const m = 3;  // 3 回巻く
		const sizeX = 250;//半径
		const sizeY = 180;//半径

		const maps: Map[] = [];
		for (let h = 1; h < m; h++) {
			for (let i = 0; i < n; i++) {
				const theta = i * (2 * Math.PI / n);
				const rx = sizeX / (m * n) * i + sizeX / m * h;
				const ry = sizeY / (m * n) * i + sizeY / m * h;
				const x = Math.cos(theta) * rx + sizeX;
				const y = Math.sin(theta) * ry + sizeY;
				const rect = new Map({
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
		const collision = (bs: g.E, bd: g.E): boolean => {
			const distance = getDistance(bs, bd);
			return (distance <= bs.width * 0.85);
		};

		//距離を算出
		const getDistance = (bs: g.E, bd: g.E): number => {
			return Math.sqrt((bd.x - bs.x) * (bd.x - bs.x) + (bd.y - bs.y) * (bd.y - bs.y));
		};

		for (let i = 0; i < maps.length - 1; i++) {
			maps[i].distance = getDistance(maps[i], maps[i + 1]);
			maps[i].nextAngle = Math.atan2(maps[i + 1].y - maps[i].y, maps[i + 1].x - maps[i].x);
		}

		//次のボール表示用
		const ballNext = new Ball({
			scene: scene,
			src: scene.assets["ball"] as g.ImageAsset,
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
		const playerBase = new g.FrameSprite({
			scene: scene,
			src: scene.assets["player"] as g.ImageAsset,
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
		const guide: g.FilledRect = new g.FilledRect({
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
		let ballsPool: Ball[] = [];
		const balls: Ball[] = [];
		let player: Ball;
		for (let i = 0; i < 128; i++) {
			const spr = new Ball({
				scene: scene,
				src: scene.assets["ball"] as g.ImageAsset,
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
		const effects: g.FrameSprite[] = [];

		for (let i = 0; i < 4; i++) {
			const spr = new g.FrameSprite({
				scene: scene,
				src: scene.assets["effect"] as g.ImageAsset,
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
		const anchor = new g.FilledRect({
			scene: scene,
			width: 20,
			height: 20,
			cssColor: "yellow",
			anchorX: 0.5,
			anchorY: 0.5
		});
		anchor.hide();
		base.append(anchor);

		const anchor2 = new g.FilledRect({
			scene: scene,
			width: 20,
			height: 20,
			cssColor: "yellow",
			anchorX: 0.5,
			anchorY: 0.5
		});
		base.append(anchor2);

		//ミス表示
		const sprMiss = new g.Sprite({
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
		const baseRen = new g.E({
			scene: scene,
			x: 450,
			y: 180
		});
		base.append(baseRen);

		const sprRen = new g.Sprite({
			scene: scene,
			src: scene.assets["combo"],
			width: 108,
			height: 40,
			x: 50,
			y: 15
		});
		baseRen.append(sprRen);

		const labelLen = new g.Label({
			scene: scene,
			font: scene.numFontB,
			fontSize: 60,
			text: "0"
		});
		baseRen.append(labelLen);

		//コンボ
		const baseCombo = new g.E({
			scene: scene,
			x: 450,
			y: 240
		});
		base.append(baseCombo);

		const sprCombo = new g.Sprite({
			scene: scene,
			src: scene.assets["combo"],
			width: 108,
			height: 40,
			x: 50,
			y: 15,
			srcY: 40
		});
		baseCombo.append(sprCombo);

		const labelCombo = new g.Label({
			scene: scene,
			font: scene.numFontP,
			fontSize: 60,
			text: "0"
		});
		baseCombo.append(labelCombo);

		//スコアを先行して算出
		const setScore = (num: number) => {
			let startPos = num;
			let endPos = num;

			let cnt = 0;
			let rensaCnt = 0;
			let score = 0;

			while (true) {
				if (endPos === balls.length) break;
				const colorNum = balls[endPos].child.frameNumber;
				for (let j = endPos; j < balls.length; j++) {
					if (balls[j].child === undefined || balls[j].child.frameNumber !== colorNum) {
						endPos = j;
						break;
					} else if (balls.length - 1 === j) {
						endPos = balls.length;
					}
				}

				//同色の隣り合っているボールを探す
				for (let j = startPos; j >= 0; j--) {
					if (balls[j].child === undefined || balls[j].child.frameNumber !== colorNum) {
						startPos = j;
						break;
					}
				}

				const len = endPos - startPos - 1 - cnt;
				if (len >= 3) {
					rensaCnt++;
					score += ((len - 2) * 500) * rensaCnt * (1.0 + (0.1 * comboCnt));
					cnt += len;
				} else {
					break;
				}
			}

			if (score > 0) {
				scene.addScore(Math.floor(score), 500 * rensaCnt);
			}

		};

		//追加する
		const add = (ball: Ball) => {
			if (isStop) return;
			isStop = true;
			const num = balls.indexOf(ball);

			//一番最後を戻す
			const ballLast = balls[balls.length - 1].child;
			nextColorNum = ballLast.frameNumber;//次に出す時この色にするためバックアップ
			setPool(ballLast);

			//ずらす
			for (let i = balls.length - 2; i >= num; i--) {
				const bs = balls[i];
				const bd = balls[i + 1];
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

			timeline.create().wait(300).call(() => {
				clear(balls[num]);
			});
		};

		//消す
		const clear = (ball: Ball) => {

			const num = balls.indexOf(ball);
			let startPos = num;
			let endPos = num;

			if (balls.length >= 3) {
				//同色の隣り合っているボールを探す
				for (let j = num; j >= 0; j--) {
					if (balls[j].child === undefined) break;
					if (balls[j].child.frameNumber === ball.child.frameNumber) {
						startPos = j;
					} else {
						break;
					}
				}

				for (let j = num; j < balls.length; j++) {
					if (balls[j].child === undefined) break;
					if (balls[j].child.frameNumber === ball.child.frameNumber) {
						endPos = j;
					} else {
						break;
					}
				}
			}

			const len = endPos - startPos + 1;

			if (len >= 3) {

				//消す
				let cnt = 0;
				for (let j = startPos; j <= endPos; j++) {
					const b = balls[j].child;
					b.frameNumber += 6;
					b.modified();

					const effect = effects[cnt];
					effect.moveTo(b.x, b.y);
					effect.show();
					effect.modified();

					balls[j].child = undefined;

					timeline.create().wait(150).call(() => {
						setPool(b);
						effect.hide();
					});

					cnt++;
				}

				//先頭からきえる直前までのボールをずらす
				let top = len - 1;
				for (let j = startPos - 1; j >= 0; j--) {
					const bs = balls[j];
					const bd = balls[j + len];
					bd.child = bs.child;
					if (balls[j].child) {
						timeline.create(bd.child).wait(150).moveTo(bd.x, bd.y, 300);
					} else {
						top = j + len;
						break;
					}
				}

				for (let i = 0; i <= top; i++) {
					balls[i].child = undefined;
				}

				renCnt++;
				if (renCnt > 1) {
					baseRen.show();
					labelLen.text = "" + renCnt;
					labelLen.invalidate();
					timeline.create(baseRen).every((a: number, b: number) => {
						baseRen.opacity = b;
						baseRen.modified();
					}, 50);
				}

				timeline.create().wait(500).call(() => {
					if (endPos === balls.length - 1) {
						clear(balls[endPos]);
					} else {
						clear(balls[endPos + 1]);
					}
				});

				scene.playSound("se_clear");
			} else {

				showCombo();

				isStop = false;
				//プレイヤー作成
				setPlayer();
			}

		};

		const showCombo = () => {
			//コンボの表示
			if (renCnt > 0) {
				comboCnt++;
				if (comboCnt > 1) {
					baseCombo.show();
					labelCombo.text = "" + comboCnt;
					labelCombo.invalidate();
					timeline.create(baseCombo).every((a: number, b: number) => {
						baseCombo.opacity = b;
						baseCombo.modified();
					}, 50);
				}
			} else {
				comboCnt = 0;
			}

		};

		let arrColor = [0, 1, 2];

		//プレイヤー作成
		const setPlayer = () => {
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

			timeline.create(player).moveTo(235, 165, 120).call(() => {
				playerBase.frameNumber = 0;
				playerBase.modified();
				ballNext.show();
				isShot = true;
			});

		};

		//ボールをプールに戻す
		const setPool = (ball: Ball) => {
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
		const hitCrclCls = (ax: number, ay: number, bx: number, by: number, ox: number, oy: number, r: number): boolean => {

			//距離を求める
			const distance = (x1: number, y1: number, x2: number, y2: number): number => {
				return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
			};

			const line = { pt1: { x: ax, y: ay }, pt2: { x: bx, y: by } };
			const crcl = { x: ox, y: oy, r: r };
			//V : 線分始点から終点へのベクトル
			//C : 線分始点から円中心へのベクトル
			const V = { x: line.pt2.x - line.pt1.x, y: line.pt2.y - line.pt1.y };
			const C = { x: crcl.x - line.pt1.x, y: crcl.y - line.pt1.y };

			//二つのベクトルの内積を求める
			const n1: number = (V.y * C.y) + (V.x * C.x);

			if (n1 < 0) {
				//Cの長さが円の半径より小さい場合 : 交差している
				return (distance(line.pt1.x, line.pt1.y, crcl.x, crcl.y) < crcl.r) ? true : false;
			}

			const n2: number = (V.y * V.y) + (V.x * V.x);

			if (n1 > n2) {
				//線分の終点と円の中心の距離の二乗を求める
				const len: number = Math.pow(distance(line.pt2.x, line.pt2.y, crcl.x, crcl.y), 2);

				//円の半径の二乗よりも小さい場合 : 交差している
				return (len < Math.pow(crcl.r, 2)) ? true : false;

			} else {
				const n3: number = C.x * C.x + C.y * C.y;
				return (n3 - (n1 / n2) * n1 < Math.pow(crcl.r, 2)) ? true : false;
			}
		};

		const setBall = () => {
			const ball = ballsPool.shift();
			if (balls.length === 0) {
				//先頭は番兵とする
				ball.child = undefined;
			} else {
				ball.child = ballsPool.shift();

				let num = -1;
				if (balls.length > 2) {
					const i = balls.length - 1;
					const b1 = balls[i].child;
					const b2 = balls[i - 1].child;
					if (b1 && b2) {
						num = (b1.frameNumber === b2.frameNumber) ? b1.frameNumber : -1;
					}
				}
				while (true) {
					const fNum = (nextColorNum === -1) ? scene.random.get(0, 2) : nextColorNum;
					ball.child.frameNumber = fNum;
					nextColorNum = -1;
					if (ball.child.frameNumber !== num) break;
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

		const showAnchor = () => {
			//挿入ポイントを表示
			const xx = guide.x + Math.cos(angle + (Math.PI / 2)) * 25;
			const yy = guide.y + Math.sin(angle + (Math.PI / 2)) * 25;
			anchor.moveTo(xx + Math.cos(angle) * 250, yy + Math.sin(angle) * 250);
			anchor.modified();
			targetBall = undefined;
			anchor2.hide();
			for (let i = 1; i < balls.length; i++) {
				const ball = balls[i];
				if (ball.child === undefined) continue;
				const isHit = hitCrclCls(xx, yy, anchor.x, anchor.y, ball.x, ball.y, ball.width / 2);
				if (isHit) {
					const nextBall = balls[i - 1];
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

		let isMove = false;//プレイヤーの移動状態
		let isShot = false;//ボールを発射できるかどうか
		let angle = 0;//射出角度（ラジアン)
		let renCnt = 0;
		let comboCnt = 0;
		let targetBall: Ball;
		let nextColorNum = -1;
		//ゲームループ
		base.update.add(() => {
			if (!scene.isStart || isStop) return;

			//回っているボールの移動
			for (let i = 0; i < balls.length; i++) {
				const ball = balls[i];
				let speed = 3.3;
				if (ball.pos < maps.length - 2) {
					while (true) {
						const map = maps[ball.pos];
						if (ball.distance < map.distance) {
							ball.x += Math.cos(map.nextAngle) * speed;
							ball.y += Math.sin(map.nextAngle) * speed;
							ball.modified();
							ball.distance += speed;
							break;
						} else {
							ball.pos++;
							ball.x = maps[ball.pos].x;
							ball.y = maps[ball.pos].y;
							speed = ball.distance + speed - map.distance;
							ball.distance = 0;
						}
					}
				} else {
					//終点まで来た時の処理
					const b = balls[0];
					if (b.child) {
						miss();
						break;
					} else {
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

				if (!isMove) return;

				//画面端処理
				if (player.x < 0 || player.y < 0 || player.x > 550 || player.y > 480) {
					isMove = false;
					setPool(player);
					setPlayer();
				}
			} else {
				showAnchor();
			}

			//ボールを出す
			const ballLast = balls[balls.length - 1];
			if (balls.length === 0 || !collision(ballLast, maps[0])) {
				setBall();
			}
		});

		base.pointDown.add(e => {
			if (!scene.isStart) return;
			const x = guide.x;
			const y = guide.y;
			angle = Math.atan2(e.point.y - y, e.point.x - x);
			const degree = angle * 180 / Math.PI;
			guide.angle = degree;
			guide.modified();
			guide.show();
			showAnchor();
			if (isStop || !isShot) {
				guide.cssColor = "gray";
			} else {
				guide.cssColor = "yellow";
			}
			guide.modified();
		});

		base.pointMove.add(e => {
			if (!scene.isStart) return;
			const x = guide.x;
			const y = guide.y;
			angle = Math.atan2(e.point.y + e.startDelta.y - y, e.point.x + e.startDelta.x - x);
			const degree = angle * 180 / Math.PI;
			guide.angle = degree;
			guide.modified();
			if (isStop || !isShot) {
				guide.cssColor = "gray";
			} else {
				guide.cssColor = "yellow";
			}
			guide.modified();
		});

		base.pointUp.add(e => {
			showAnchor();
			guide.hide();
			anchor2.hide();
			if (!scene.isStart || isStop || !isShot) return;
			isShot = false;
			isMove = true;
		});

		//ミス
		const miss = () => {
			isStop = true;
			for (let j = 0; j < balls.length; j++) {
				const ball = balls[j];
				if (ball.child) {
					timeline.create().wait((j) * 50).call(() => {
						ball.child.frameNumber = 5;
						ball.child.modified();
					});
				}
			}
			timeline.create().wait(1000).call(() => {
				scene.playSound("se_miss");
				sprMiss.show();
			}).wait(1500).call(() => {
				this.reset();
			});
			scene.playSound("biri");
		};

		let isStop = false;
		//リセット
		this.reset = () => {
			isStop = false;

			for (let i = 0; i < balls.length; i++) {
				if (balls[i].child) {
					setPool(balls[i].child);
				}
				setPool(balls[i]);
			}
			balls.length = 0;

			if (player !== undefined) {
				setPool(player);
			}

			ballsPool = ballsPool.filter((x, i, self) => {
				return self.indexOf(x) === i;
			});

			ballsPool.forEach(e => e.hide());
			for (let i = 0; i < ballsPool.length; i++) {
				const ball = ballsPool[i];
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

			effects.forEach(e => e.hide());

			setPlayer();

		};

	}
}

class Ball extends g.FrameSprite {
	public tween: any;
	public pos: number;
	public distance: number;
	public child: Ball;

	public move() {
		if (this.child) {
			this.child.moveTo(this.x, this.y);
			this.child.modified();
		}
	}
}

class Map extends g.E {
	public distance: number;
	public nextAngle: number;
}
