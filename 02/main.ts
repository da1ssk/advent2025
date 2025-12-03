// --- 型定義 ---
interface State {
  theta1: number // 腕角度 (rad)
  omega1: number // 腕角速度 (rad/s)
  theta2: number // クラブ角度 (rad, 絶対座標)
  omega2: number // クラブ角速度 (rad/s)
}

interface SwingParams {
  t1_mag: number // 肩トルク
  t1_dur: number // 肩継続時間
  t2_mag: number // 手首トルク
  t2_delay: number // 手首開始遅延
  t2_dur: number // 手首継続時間
}

// --- 定数 (物理パラメータ: 2-DOF) ---
const G = 9.81 // 重力 (m/s²)
const L1 = 0.55 // 腕の長さ: 肩→手首 (m)
const L2 = 0.95 // クラブの長さ: 手首→ヘッド (m) - 7番アイアン
const M1 = 4.5 // 腕+手の質量 (kg)
const M2 = 0.35 // クラブの実効質量 (kg)
const DT = 0.0005 // シミュレーションステップ (s) - 高速スイング用に細かく
const MAX_TIME = 1.0 // 最大シミュレーション時間 (s)

// --- ボール ---
const BALL_RADIUS = 0.021 // ゴルフボール半径 (m)
const BALL_X_OFFSET = 0.05 // ボールのX位置オフセット (m) - 少し前方
const BALL_COR = 0.78 // 反発係数 (coefficient of restitution)
const BALL_MASS = 0.0459 // ゴルフボール質量 (kg)
const LOFT_ANGLE = 34 * (Math.PI / 180) // 7番アイアンのロフト角 (rad)
const M_TO_YD = 1.09361 // メートルからヤードへの変換

// ヤード変換ヘルパー
const toYards = (meters: number) => meters * M_TO_YD

// --- 関節制約 ---
const MAX_SHOULDER_ANGLE = 2 * Math.PI // 肩: 360度まで
// 手首の非対称制約 (解剖学的にフリップは制限される)
const MAX_WRIST_LAG = Math.PI * 0.5 // ラグ方向: 約90度まで (コック)
const MAX_WRIST_RELEASE = Math.PI * 0.15 // リリース方向: 約27度まで

// --- パラメータ設定 ---
interface ParamConfig {
  t1_mag: { min: number; max: number; default: number }
  t1_dur: { min: number; max: number; default: number }
  t2_mag: { min: number; max: number; default: number }
  t2_delay: { min: number; max: number; default: number }
  t2_dur: { min: number; max: number; default: number }
}

const CONFIG: ParamConfig = {
  t1_mag: { min: 30, max: 150, default: 70 },
  t1_dur: { min: 0.2, max: 0.5, default: 0.35 },
  t2_mag: { min: -50, max: 80, default: 20 },
  t2_delay: { min: 0.0, max: 0.35, default: 0.1 },
  t2_dur: { min: 0.05, max: 0.3, default: 0.15 },
}

// --- ボール軌道 ---
interface BallPoint {
  x: number // 水平位置 (m)
  y: number // 垂直位置 (m)
}

// --- シミュレーション結果 ---
interface SimResult {
  history: State[]
  maxSpeed: number
  impactSpeed: number // インパクト時のヘッドスピード
  hitBall: boolean // ボールに当たったか
  ballTrajectory: BallPoint[] // ボール軌道
  ballDistance: number // 総飛距離 (m) - キャリー + ラン
  carryDistance: number // キャリー距離 (m) - 飛翔距離のみ
  attackAngle: number // アタック角 (度)
  launchAngle: number // 打ち出し角 (度)
  shaftLean: number // シャフトリーン (度) - 正=ハンドファースト
}

// --- 物理エンジン (二重振り子) ---
class PhysicsEngine {
  // 運動方程式 (加速度を計算)
  static computeAccelerations(
    s: State,
    torque1: number,
    torque2: number
  ): { alpha1: number; alpha2: number } {
    const { theta1, theta2, omega1, omega2 } = s
    const dtheta = theta1 - theta2

    // 質量行列 M (2x2)
    const m11 = (M1 + M2) * L1 * L1
    const m12 = M2 * L1 * L2 * Math.cos(dtheta)
    const m21 = M2 * L1 * L2 * Math.cos(dtheta)
    const m22 = M2 * L2 * L2

    // 右辺ベクトル (コリオリ、遠心力、重力、トルク)
    const f1 =
      M2 * L1 * L2 * omega2 * omega2 * Math.sin(dtheta) -
      (M1 + M2) * G * L1 * Math.sin(theta1) +
      torque1

    const f2 =
      -M2 * L1 * L2 * omega1 * omega1 * Math.sin(dtheta) -
      M2 * G * L2 * Math.sin(theta2) +
      torque2

    // 2x2行列の逆行列で解く
    const det = m11 * m22 - m12 * m21
    if (Math.abs(det) < 1e-10) {
      return { alpha1: 0, alpha2: 0 }
    }

    const alpha1 = (m22 * f1 - m12 * f2) / det
    const alpha2 = (m11 * f2 - m21 * f1) / det

    return { alpha1, alpha2 }
  }

  // ルンゲ=クッタ法 (RK4)
  static rk4(s: State, t1: number, t2: number): State {
    const evaluate = (init: State, dt: number, d_s: Partial<State>) => {
      const state: State = {
        theta1: init.theta1 + (d_s.theta1 || 0) * dt,
        omega1: init.omega1 + (d_s.omega1 || 0) * dt,
        theta2: init.theta2 + (d_s.theta2 || 0) * dt,
        omega2: init.omega2 + (d_s.omega2 || 0) * dt,
      }
      const acc = this.computeAccelerations(state, t1, t2)
      return {
        d_theta1: state.omega1,
        d_omega1: acc.alpha1,
        d_theta2: state.omega2,
        d_omega2: acc.alpha2,
      }
    }

    const k1 = evaluate(s, 0, {})
    const k2 = evaluate(s, DT * 0.5, {
      theta1: k1.d_theta1,
      omega1: k1.d_omega1,
      theta2: k1.d_theta2,
      omega2: k1.d_omega2,
    })
    const k3 = evaluate(s, DT * 0.5, {
      theta1: k2.d_theta1,
      omega1: k2.d_omega1,
      theta2: k2.d_theta2,
      omega2: k2.d_omega2,
    })
    const k4 = evaluate(s, DT, {
      theta1: k3.d_theta1,
      omega1: k3.d_omega1,
      theta2: k3.d_theta2,
      omega2: k3.d_omega2,
    })

    return {
      theta1:
        s.theta1 +
        (DT / 6) *
          (k1.d_theta1 + 2 * k2.d_theta1 + 2 * k3.d_theta1 + k4.d_theta1),
      omega1:
        s.omega1 +
        (DT / 6) *
          (k1.d_omega1 + 2 * k2.d_omega1 + 2 * k3.d_omega1 + k4.d_omega1),
      theta2:
        s.theta2 +
        (DT / 6) *
          (k1.d_theta2 + 2 * k2.d_theta2 + 2 * k3.d_theta2 + k4.d_theta2),
      omega2:
        s.omega2 +
        (DT / 6) *
          (k1.d_omega2 + 2 * k2.d_omega2 + 2 * k3.d_omega2 + k4.d_omega2),
    }
  }
}

// --- メインアプリ ---
class GolfApp {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  speedDisplay: HTMLElement
  logArea: HTMLElement
  phaseSlider: HTMLInputElement
  phaseDisplay: HTMLElement
  currentHistory: State[] = []
  currentTrajectory: BallPoint[] = []
  isAnimating: boolean = false

  // ボール位置 (物理座標、肩を原点として)
  ballX: number = BALL_X_OFFSET
  ballY: number = L1 + L2 // 床の高さ (肩からの距離)

  constructor() {
    this.canvas = document.getElementById("simCanvas") as HTMLCanvasElement
    this.ctx = this.canvas.getContext("2d")!
    this.speedDisplay = document.getElementById("speedDisplay")!
    this.logArea = document.getElementById("logArea")!
    this.phaseSlider = document.getElementById(
      "phaseSlider"
    ) as HTMLInputElement
    this.phaseDisplay = document.getElementById("val_phaseSlider")!

    // 初期描画 (トップの位置 - シミュレーションと同じ)
    const armAngle = -Math.PI / 1.5 // -120度
    const wristCock = -Math.PI / 4 // 45度コック
    this.drawState({
      theta1: armAngle,
      omega1: 0,
      theta2: armAngle + wristCock, // 45度ラグ
      omega2: 0,
    })
    this.bindEvents()
  }

  bindEvents() {
    document
      .getElementById("btnSimulate")
      ?.addEventListener("click", () => this.runManual())
    document
      .getElementById("btnOptimize")
      ?.addEventListener("click", () => this.runOptimization())

    // スライダーの値表示更新
    const inputs = document.querySelectorAll('input[type="range"]')
    inputs.forEach((input) => {
      input.addEventListener("input", (e: any) => {
        document.getElementById(`val_${e.target.id}`)!.textContent =
          e.target.value
      })
    })

    // フェーズスライダーのイベント
    this.phaseSlider.addEventListener("input", () => {
      if (this.currentHistory.length === 0) return
      this.isAnimating = false
      const index = Math.floor(
        (parseInt(this.phaseSlider.value) / 100) *
          (this.currentHistory.length - 1)
      )
      const state = this.currentHistory[index]
      if (state) {
        this.drawState(state)
      }
      const percent = Math.round(
        (index / (this.currentHistory.length - 1)) * 100
      )
      this.phaseDisplay.textContent = `${percent}%`
    })
  }

  // パラメータ取得
  getParams(): SwingParams {
    return {
      t1_mag: parseFloat(
        (document.getElementById("t1_mag") as HTMLInputElement).value
      ),
      t1_dur: parseFloat(
        (document.getElementById("t1_dur") as HTMLInputElement).value
      ),
      t2_mag: parseFloat(
        (document.getElementById("t2_mag") as HTMLInputElement).value
      ),
      t2_delay: parseFloat(
        (document.getElementById("t2_delay") as HTMLInputElement).value
      ),
      t2_dur: parseFloat(
        (document.getElementById("t2_dur") as HTMLInputElement).value
      ),
    }
  }

  // クラブヘッド位置を計算
  getHeadPosition(s: State): { x: number; y: number } {
    const x1 = L1 * Math.sin(s.theta1)
    const y1 = L1 * Math.cos(s.theta1)
    const x2 = x1 + L2 * Math.sin(s.theta2)
    const y2 = y1 + L2 * Math.cos(s.theta2)
    return { x: x2, y: y2 }
  }

  // ボール軌道を計算 (放物運動 + アタック角 + シャフトリーン考慮)
  calculateBallTrajectory(
    impactVx: number,
    impactVy: number,
    shaftLean: number // degrees, positive = hands ahead
  ): {
    trajectory: BallPoint[]
    distance: number
    carryDistance: number
    attackAngle: number
    launchAngle: number
  } {
    const trajectory: BallPoint[] = []

    // クラブヘッドスピード
    const clubSpeed = Math.sqrt(impactVx * impactVx + impactVy * impactVy)

    // アタック角 (Attack Angle): クラブの進行方向の角度
    // 座標系: X=右(正), Y=下(正) なので、atan2(-vy, vx) で水平からの角度
    // 正 = 上向き(アッパーブロー), 負 = 下向き(ダウンブロー)
    const attackAngle = Math.atan2(-impactVy, impactVx)

    // シャフトリーンによるダイナミックロフトの変化
    // ハンドファースト(正のlean)はロフトを減らす (de-loft)
    // 1度のシャフトリーンで約0.7度のロフト減少
    const shaftLeanRad = shaftLean * (Math.PI / 180)
    const dynamicLoft = Math.max(0.1, LOFT_ANGLE - shaftLeanRad * 0.7)

    // 打ち出し角: ダイナミックロフトとアタック角の組み合わせ
    const launchAngle = 0.85 * dynamicLoft + 0.15 * attackAngle

    // 反発係数 (COR) を使った物理的なボール速度計算
    // Ball Speed = Club Speed × (1 + COR) × M_club / (M_club + M_ball)
    const clubHeadMass = 0.3 // kg (7アイアンヘッド質量)
    const baseSmashFactor =
      ((1 + BALL_COR) * clubHeadMass) / (clubHeadMass + BALL_MASS)
    // baseSmashFactor ≈ 1.53 だが、エネルギーロスで実効値は低い

    // ハンドファーストボーナス: 理想的なハンドファースト(10-15度)で効率UP
    const idealLean = 12 // degrees
    const leanDeviation = Math.abs(shaftLean - idealLean)
    const leanBonus = Math.max(-0.15, 0.05 - leanDeviation * 0.005)

    // アタック角ペナルティ
    const attackAngleDeg = attackAngle * (180 / Math.PI)
    let attackPenalty = 1.0
    if (attackAngleDeg < -10) {
      attackPenalty = Math.max(0.6, 1 - Math.abs(attackAngleDeg + 10) * 0.03)
    } else if (attackAngleDeg > 5) {
      attackPenalty = Math.max(0.75, 1 - (attackAngleDeg - 5) * 0.02)
    }

    // 実効スマッシュファクター (エネルギーロス考慮)
    const smashFactor = baseSmashFactor * 0.95 * (1 + leanBonus) * attackPenalty

    // ボール速度を現実的な範囲に制限
    // 7アイアン: ロングヒッターで最大68m/s (152mph)
    const maxBallSpeed = 68 // m/s
    const ballSpeed = Math.min(clubSpeed * smashFactor, maxBallSpeed)

    // ボール初速度 (水平・垂直)
    let bvx = ballSpeed * Math.cos(launchAngle)
    let bvy = -ballSpeed * Math.sin(launchAngle) // 上向きが負

    // ボール初期位置
    let bx = this.ballX
    let by = this.ballY

    // 放物運動シミュレーション (現実的な空気抵抗)
    const ballDt = 0.02
    const dragCoeff = 0.008 // ゴルフボールの空気抵抗
    let carryDistance = 0
    let landingVx = 0
    let landingVy = 0

    for (let bt = 0; bt < 10; bt += ballDt) {
      trajectory.push({ x: bx, y: by })

      // 空気抵抗 (速度の2乗に比例)
      const speed = Math.sqrt(bvx * bvx + bvy * bvy)
      const drag = dragCoeff * speed

      // 位置更新
      bx += bvx * ballDt
      by += bvy * ballDt

      // 速度更新 (重力 + 空気抵抗)
      bvx -= drag * bvx * ballDt
      bvy += G * ballDt - drag * bvy * ballDt

      // 地面に着いたらキャリー終了
      if (by >= this.ballY) {
        carryDistance = bx - this.ballX
        landingVx = bvx
        landingVy = bvy
        by = this.ballY // 地面に固定
        break
      }
    }

    // ラン（転がり）の計算
    // 着地角度が急なほどランは少ない、浅いほど多い
    const landingAngle = Math.atan2(landingVy, landingVx) // 着地角度 (rad)
    const landingAngleDeg = landingAngle * (180 / Math.PI)
    const landingSpeed = Math.sqrt(
      landingVx * landingVx + landingVy * landingVy
    )

    // ラン係数: 着地角度45度で係数0.3、20度で0.6、60度で0.1
    // 7アイアンは通常キャリーの10-20%程度のラン
    const runCoeff = Math.max(0.05, Math.min(0.5, 0.6 - landingAngleDeg * 0.01))
    const runDistance = carryDistance * runCoeff

    // ラン軌道を追加（地面上を転がる）
    const runSteps = 20
    const runStepDist = runDistance / runSteps
    for (let i = 1; i <= runSteps; i++) {
      trajectory.push({
        x: this.ballX + carryDistance + runStepDist * i,
        y: this.ballY,
      })
    }

    const totalDistance = carryDistance + runDistance

    return {
      trajectory,
      distance: totalDistance,
      carryDistance,
      attackAngle: attackAngle * (180 / Math.PI), // 度数に変換
      launchAngle: launchAngle * (180 / Math.PI),
    }
  }

  // シミュレーション実行
  simulate(params: SwingParams): SimResult {
    // 初期状態: トップオブスイング
    // 腕は-120度、手首は45度コック
    const armAngle = -Math.PI / 1.5 // 腕: -120度
    const wristCock = -Math.PI / 4 // 45度コック (現実的なラグ)
    let state: State = {
      theta1: armAngle,
      omega1: 0,
      theta2: armAngle + wristCock, // クラブ: 45度ラグ
      omega2: 0,
    }

    const history: State[] = []
    let maxSpeed = 0
    let impactSpeed = 0
    let impactVx = 0
    let impactVy = 0
    let impactShaftLean = 0
    let hitBall = false
    let hitGround = false // ダフリ判定
    let t = 0
    const STOP_ANGLE = Math.PI / 3 // 60度を過ぎたら停止 (フォロースルー)
    const HIT_RADIUS = BALL_RADIUS + 0.08 // 当たり判定 (ヘッド半径含む、プロスイング用に広め)

    while (t < MAX_TIME && state.theta1 < STOP_ANGLE) {
      // トルク計算 (パルス制御)
      let tau1 = 0
      let tau2 = 0

      if (t >= 0 && t < params.t1_dur) tau1 = params.t1_mag
      if (t >= params.t2_delay && t < params.t2_delay + params.t2_dur)
        tau2 = params.t2_mag

      // 状態更新
      state = PhysicsEngine.rk4(state, tau1, tau2)

      // 関節制約を適用
      // 1. 肩: 360度 (2π) を超えない
      if (state.theta1 > MAX_SHOULDER_ANGLE) {
        state.theta1 = MAX_SHOULDER_ANGLE
        state.omega1 = Math.min(0, state.omega1)
      } else if (state.theta1 < -MAX_SHOULDER_ANGLE) {
        state.theta1 = -MAX_SHOULDER_ANGLE
        state.omega1 = Math.max(0, state.omega1)
      }

      // 2. 手首: 非対称制約 (フリップは解剖学的に制限される)
      // relativeWrist > 0: クラブが手より前 (フリップ/リリース) → 厳しく制限
      // relativeWrist < 0: クラブが手より後ろ (ラグ/コック) → 緩く制限
      const relativeWrist = state.theta2 - state.theta1
      if (relativeWrist > MAX_WRIST_RELEASE) {
        // フリップを制限 (手首は前に曲がりにくい)
        state.theta2 = state.theta1 + MAX_WRIST_RELEASE
        state.omega2 = Math.min(state.omega1, state.omega2)
      } else if (relativeWrist < -MAX_WRIST_LAG) {
        // ラグを制限
        state.theta2 = state.theta1 - MAX_WRIST_LAG
        state.omega2 = Math.max(state.omega1, state.omega2)
      }

      history.push({ ...state })

      // ヘッドスピード計算
      const vx =
        L1 * state.omega1 * Math.cos(state.theta1) +
        L2 * state.omega2 * Math.cos(state.theta2)
      const vy =
        L1 * state.omega1 * Math.sin(state.theta1) +
        L2 * state.omega2 * Math.sin(state.theta2)
      const speed = Math.sqrt(vx * vx + vy * vy)

      if (speed > maxSpeed) maxSpeed = speed

      // ボール衝突判定
      if (!hitBall && !hitGround) {
        const head = this.getHeadPosition(state)
        const floorY = L1 + L2 // 地面のY座標

        // 地面衝突チェック (ヘッドが地面より下に行った = ダフリ)
        if (head.y > floorY + 0.03) {
          hitGround = true // ダフリ！地面に当たった
          continue
        }

        const dx = head.x - this.ballX
        const dy = head.y - this.ballY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < HIT_RADIUS) {
          // インパクト時のアタック角をチェック
          // vy > 0 は下向き、vx > 0 は右向き
          // アタック角 = atan2(vy, vx) で、急な下降は大きな正の値
          const impactAttackAngle = Math.atan2(vy, vx) * (180 / Math.PI)

          // アタック角が急すぎる (> 40度下向き) = ダフリ/地面に刺さる
          if (impactAttackAngle > 40) {
            hitGround = true
            continue
          }

          hitBall = true
          impactSpeed = speed
          impactVx = vx
          impactVy = vy
          // シャフトリーン (ハンドファースト角度) を記録
          impactShaftLean = (state.theta1 - state.theta2) * (180 / Math.PI)
        }
      }

      t += DT
    }

    // ボール軌道を計算
    let ballTrajectory: BallPoint[] = []
    let ballDistance = 0
    let carryDistance = 0
    let attackAngle = 0
    let launchAngle = 0
    if (hitBall) {
      const ballResult = this.calculateBallTrajectory(
        impactVx,
        impactVy,
        impactShaftLean
      )
      ballTrajectory = ballResult.trajectory
      ballDistance = ballResult.distance
      carryDistance = ballResult.carryDistance
      attackAngle = ballResult.attackAngle
      launchAngle = ballResult.launchAngle
    }

    return {
      history,
      maxSpeed,
      impactSpeed,
      hitBall,
      ballTrajectory,
      ballDistance,
      carryDistance,
      attackAngle,
      launchAngle,
      shaftLean: impactShaftLean,
    }
  }

  // 手動モード
  async runManual() {
    const params = this.getParams()
    const result = this.simulate(params)
    this.currentTrajectory = result.ballTrajectory

    if (result.hitBall) {
      this.speedDisplay.textContent = result.impactSpeed.toFixed(2)
      const attackSign = result.attackAngle >= 0 ? "+" : ""
      const runDistance = result.ballDistance - result.carryDistance
      this.logArea.innerHTML = `🎯 Total: ${toYards(
        result.ballDistance
      ).toFixed(0)} yds (Carry: ${toYards(result.carryDistance).toFixed(
        0
      )} + Run: ${toYards(runDistance).toFixed(0)})<br>
        Attack: ${attackSign}${result.attackAngle.toFixed(
        1
      )}° | Launch: ${result.launchAngle.toFixed(1)}°`
    } else {
      this.speedDisplay.textContent = "0.0"
      this.logArea.innerHTML = `❌ Miss! (max speed was ${result.maxSpeed.toFixed(
        1
      )} m/s)`
    }
    this.animate(result.history)
  }

  // パラメータの近傍を生成 (Simulated Annealing用)
  perturbParams(p: SwingParams, temp: number): SwingParams {
    const cfg = CONFIG
    const scale = temp * 0.3 // 温度に応じた摂動スケール
    const clamp = (v: number, min: number, max: number) =>
      Math.max(min, Math.min(max, v))

    const range = (c: { min: number; max: number }) => c.max - c.min

    return {
      t1_mag: clamp(
        p.t1_mag + (Math.random() - 0.5) * range(cfg.t1_mag) * 0.3 * scale,
        cfg.t1_mag.min,
        cfg.t1_mag.max
      ),
      t1_dur: clamp(
        p.t1_dur + (Math.random() - 0.5) * range(cfg.t1_dur) * 0.5 * scale,
        cfg.t1_dur.min,
        cfg.t1_dur.max
      ),
      t2_mag: clamp(
        p.t2_mag + (Math.random() - 0.5) * range(cfg.t2_mag) * 0.4 * scale,
        cfg.t2_mag.min,
        cfg.t2_mag.max
      ),
      t2_delay: clamp(
        p.t2_delay + (Math.random() - 0.5) * range(cfg.t2_delay) * 0.5 * scale,
        cfg.t2_delay.min,
        cfg.t2_delay.max
      ),
      t2_dur: clamp(
        p.t2_dur + (Math.random() - 0.5) * range(cfg.t2_dur) * 0.5 * scale,
        cfg.t2_dur.min,
        cfg.t2_dur.max
      ),
    }
  }

  // ランダムな初期パラメータを生成
  randomParams(): SwingParams {
    const cfg = CONFIG
    const rand = (c: { min: number; max: number }) =>
      c.min + Math.random() * (c.max - c.min)

    return {
      t1_mag: rand(cfg.t1_mag),
      t1_dur: rand(cfg.t1_dur),
      t2_mag: rand(cfg.t2_mag),
      t2_delay: rand(cfg.t2_delay),
      t2_dur: rand(cfg.t2_dur),
    }
  }

  // 小さな摂動を生成 (Hill Climbing用)
  smallPerturb(p: SwingParams): SwingParams {
    const cfg = CONFIG
    const clamp = (v: number, min: number, max: number) =>
      Math.max(min, Math.min(max, v))
    const perturb = (v: number, range: number) =>
      v + (Math.random() - 0.5) * range * 0.1

    return {
      t1_mag: clamp(
        perturb(p.t1_mag, cfg.t1_mag.max - cfg.t1_mag.min),
        cfg.t1_mag.min,
        cfg.t1_mag.max
      ),
      t1_dur: clamp(
        perturb(p.t1_dur, cfg.t1_dur.max - cfg.t1_dur.min),
        cfg.t1_dur.min,
        cfg.t1_dur.max
      ),
      t2_mag: clamp(
        perturb(p.t2_mag, cfg.t2_mag.max - cfg.t2_mag.min),
        cfg.t2_mag.min,
        cfg.t2_mag.max
      ),
      t2_delay: clamp(
        perturb(p.t2_delay, cfg.t2_delay.max - cfg.t2_delay.min),
        cfg.t2_delay.min,
        cfg.t2_delay.max
      ),
      t2_dur: clamp(
        perturb(p.t2_dur, cfg.t2_dur.max - cfg.t2_dur.min),
        cfg.t2_dur.min,
        cfg.t2_dur.max
      ),
    }
  }

  // 最適化モード (Two-Phase: Random Search + Hill Climbing)
  runOptimization() {
    this.logArea.innerHTML = "🔍 Phase 1: Finding valid hits..."

    let bestParams: SwingParams | null = null
    let bestResult: SimResult | null = null
    let bestScore = -Infinity

    // スコア関数: ハンドファースト必須 + 飛距離
    const calcScore = (r: SimResult): number => {
      if (!r.hitBall) return -Infinity

      // ハンドファースト必須: shaftLean < 0 (ハンドレイト) は拒否
      if (r.shaftLean < 0) {
        return -1000 + r.shaftLean // 強いペナルティ
      }

      // ハンドファーストの場合: 飛距離 + ボーナス
      let score = r.ballDistance
      score += r.shaftLean * 2 // 1度につき2mボーナス (強化)
      return score
    }

    let phase = 1
    let iteration = 0
    const phase1Iters = 2000 // ランダム探索
    const phase2Iters = 3000 // Hill Climbing
    let hitCount = 0

    const runBatch = () => {
      const batchSize = 100

      if (phase === 1) {
        // Phase 1: Random Search
        for (let i = 0; i < batchSize && iteration < phase1Iters; i++) {
          const params = this.randomParams()
          const result = this.simulate(params)
          iteration++

          if (result.hitBall) {
            hitCount++
            const score = calcScore(result)
            if (score > bestScore) {
              bestScore = score
              bestParams = { ...params }
              bestResult = result
            }
          }
        }

        const bestDist = bestResult
          ? toYards(bestResult.ballDistance).toFixed(0)
          : "---"
        this.logArea.innerHTML = `🔍 Phase 1: ${iteration}/${phase1Iters} | Hits: ${hitCount} | Best: ${bestDist} yds`

        if (iteration >= phase1Iters) {
          if (bestParams) {
            phase = 2
            iteration = 0
            this.logArea.innerHTML = `⛰️ Phase 2: Hill climbing from ${bestDist} yds...`
          } else {
            this.logArea.innerHTML = "❌ No valid hits found in Phase 1"
            return
          }
        }
      } else {
        // Phase 2: Hill Climbing
        for (let i = 0; i < batchSize && iteration < phase2Iters; i++) {
          const params = this.smallPerturb(bestParams!)
          const result = this.simulate(params)
          iteration++

          if (result.hitBall) {
            const score = calcScore(result)
            if (score > bestScore) {
              bestScore = score
              bestParams = { ...params }
              bestResult = result
            }
          }
        }

        const bestDist = bestResult
          ? toYards(bestResult.ballDistance).toFixed(0)
          : "---"
        const leanStr = bestResult
          ? `${
              bestResult.shaftLean >= 0 ? "+" : ""
            }${bestResult.shaftLean.toFixed(0)}°`
          : "---"
        this.logArea.innerHTML = `⛰️ Phase 2: ${iteration}/${phase2Iters} | ${bestDist} yds | Lean: ${leanStr}`

        if (iteration >= phase2Iters) {
          // 完了
          this.finishOptimization(bestParams!, bestResult!)
          return
        }
      }

      setTimeout(runBatch, 0)
    }

    setTimeout(runBatch, 50)
  }

  // 最適化完了処理
  finishOptimization(bestParams: SwingParams, bestResult: SimResult) {
    const attackSign = bestResult.attackAngle >= 0 ? "+" : ""
    const leanSign = bestResult.shaftLean >= 0 ? "+" : ""
    this.logArea.innerHTML = `🎯 Best: ${toYards(
      bestResult.ballDistance
    ).toFixed(0)} yds<br>
      Lean: ${leanSign}${bestResult.shaftLean.toFixed(
      0
    )}° | Attack: ${attackSign}${bestResult.attackAngle.toFixed(1)}°`
    this.currentTrajectory = bestResult.ballTrajectory

    // 全パラメータをUIに反映
    const setSlider = (id: string, value: number) => {
      const slider = document.getElementById(id) as HTMLInputElement
      const display = document.getElementById(`val_${id}`)
      if (slider && display) {
        slider.value = value.toFixed(2)
        display.textContent = value.toFixed(2)
      }
    }

    setSlider("t1_mag", bestParams.t1_mag)
    setSlider("t1_dur", bestParams.t1_dur)
    setSlider("t2_mag", bestParams.t2_mag)
    setSlider("t2_delay", bestParams.t2_delay)
    setSlider("t2_dur", bestParams.t2_dur)

    this.speedDisplay.textContent = bestResult.impactSpeed.toFixed(2)
    this.animate(bestResult.history)
  }

  // アニメーション再生
  animate(history: State[]) {
    this.currentHistory = history
    this.isAnimating = true
    let i = 0
    const step = 5
    const drawLoop = () => {
      if (!this.isAnimating || i >= history.length) {
        this.isAnimating = false
        // 最終フレームで軌道を表示
        const lastState = history[history.length - 1]
        if (lastState) {
          this.drawState(lastState, true)
        }
        return
      }
      const currentState = history[i]

      if (currentState) {
        this.drawState(currentState)
        const percent = Math.round((i / (history.length - 1)) * 100)
        this.phaseSlider.value = percent.toString()
        this.phaseDisplay.textContent = `${percent}%`
      }
      i += step
      requestAnimationFrame(drawLoop)
    }
    drawLoop()
  }

  // 描画関数
  drawState(s: State, showTrajectory: boolean = false) {
    const w = this.canvas.width
    const h = this.canvas.height
    const cx = 280 // プレイヤーを中央寄りに配置（バックスイング表示のため）
    const cy = 240 // 上部に余裕を持たせる
    const scale = 130

    this.ctx.clearRect(0, 0, w, h)

    // 座標計算
    const x1 = cx + L1 * Math.sin(s.theta1) * scale
    const y1 = cy + L1 * Math.cos(s.theta1) * scale
    const x2 = x1 + L2 * Math.sin(s.theta2) * scale
    const y2 = y1 + L2 * Math.cos(s.theta2) * scale

    // ボール位置 (画面座標)
    const ballScreenX = cx + this.ballX * scale
    const ballScreenY = cy + this.ballY * scale
    const ballScreenRadius = BALL_RADIUS * scale * 3 // 視認性のため少し大きく
    const floorY = cy + (L1 + L2) * scale

    // 背景グラデーション
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, h)
    bgGrad.addColorStop(0, "#1a2744")
    bgGrad.addColorStop(1, "#0d1520")
    this.ctx.fillStyle = bgGrad
    this.ctx.fillRect(0, 0, w, h)

    // 床 (緑の芝)
    this.ctx.beginPath()
    this.ctx.moveTo(0, floorY)
    this.ctx.lineTo(w, floorY)
    this.ctx.strokeStyle = "#4ade80"
    this.ctx.lineWidth = 4
    this.ctx.stroke()

    // 芝エリア
    this.ctx.fillStyle = "rgba(74, 222, 128, 0.1)"
    this.ctx.fillRect(0, floorY, w, h - floorY)

    // ボール軌道を描画 (ボール位置から開始)
    if (showTrajectory && this.currentTrajectory.length > 1) {
      // 軌道の最大距離と最大高さを計算
      let maxDist = 0
      let minY = 0 // 最高点 (y座標は上が負)
      for (const pt of this.currentTrajectory) {
        if (pt) {
          maxDist = Math.max(maxDist, pt.x - this.ballX)
          minY = Math.min(minY, pt.y - this.ballY)
        }
      }

      // 動的スケール: 軌道全体がキャンバスに収まるように
      const trajStartX = ballScreenX // ボール位置から開始
      const availableWidth = w - trajStartX - 30 // 右端までの余白
      const availableHeight = floorY - 30
      const scaleX = availableWidth / Math.max(maxDist, 1)
      const scaleY = availableHeight / Math.max(Math.abs(minY), 1)
      const trajScale = Math.min(scaleX, scaleY, 4)

      const trajBaseY = floorY

      // グリッド線 (距離目盛り)
      this.ctx.strokeStyle = "#ddd"
      this.ctx.lineWidth = 1
      this.ctx.setLineDash([2, 4])
      const gridStep = maxDist > 100 ? 50 : maxDist > 50 ? 25 : 10
      for (let d = gridStep; d <= maxDist; d += gridStep) {
        const gx = trajStartX + d * trajScale
        if (gx < w - 20) {
          this.ctx.beginPath()
          this.ctx.moveTo(gx, trajBaseY)
          this.ctx.lineTo(gx, trajBaseY - 15)
          this.ctx.stroke()
          // 距離ラベル (ヤード)
          this.ctx.fillStyle = "#aaa"
          this.ctx.font = "bold 14px sans-serif"
          this.ctx.fillText(`${toYards(d).toFixed(0)}`, gx - 12, trajBaseY + 18)
        }
      }
      this.ctx.setLineDash([])

      // 軌道曲線
      this.ctx.beginPath()
      this.ctx.strokeStyle = "#f87171"
      this.ctx.lineWidth = 4

      for (let i = 0; i < this.currentTrajectory.length; i++) {
        const pt = this.currentTrajectory[i]
        if (!pt) continue
        const tx = trajStartX + (pt.x - this.ballX) * trajScale
        const ty = trajBaseY + (pt.y - this.ballY) * trajScale

        if (i === 0) {
          this.ctx.moveTo(tx, ty)
        } else {
          this.ctx.lineTo(tx, ty)
        }
      }
      this.ctx.stroke()

      // 着地点を表示
      const lastPt = this.currentTrajectory[this.currentTrajectory.length - 1]
      if (lastPt) {
        const landX = trajStartX + (lastPt.x - this.ballX) * trajScale
        const distance = lastPt.x - this.ballX

        // 着地マーカー
        this.ctx.beginPath()
        this.ctx.arc(landX, trajBaseY, 10, 0, Math.PI * 2)
        this.ctx.fillStyle = "#ef4444"
        this.ctx.fill()

        // 飛距離テキスト (ヤード)
        this.ctx.fillStyle = "#4ade80"
        this.ctx.font = "bold 22px sans-serif"
        this.ctx.fillText(
          `${toYards(distance).toFixed(0)} yds`,
          landX - 30,
          trajBaseY - 25
        )
      }

      // 最高点マーカー
      let peakPt: BallPoint | null = null
      let peakY = 0
      for (const pt of this.currentTrajectory) {
        if (pt && pt.y < peakY) {
          peakY = pt.y
          peakPt = pt
        }
      }
      if (peakPt) {
        const peakScreenX = trajStartX + (peakPt.x - this.ballX) * trajScale
        const peakScreenY = trajBaseY + (peakPt.y - this.ballY) * trajScale
        this.ctx.beginPath()
        this.ctx.arc(peakScreenX, peakScreenY, 8, 0, Math.PI * 2)
        this.ctx.fillStyle = "#3b82f6"
        this.ctx.fill()
        // 最高点高さ (ヤード)
        const peakHeight = this.ballY - peakPt.y
        this.ctx.fillStyle = "#60a5fa"
        this.ctx.font = "bold 16px sans-serif"
        this.ctx.fillText(
          `↑${toYards(peakHeight).toFixed(0)} yds`,
          peakScreenX + 8,
          peakScreenY - 8
        )
      }
    }

    // ボール
    this.ctx.beginPath()
    this.ctx.arc(
      ballScreenX,
      ballScreenY - ballScreenRadius,
      ballScreenRadius,
      0,
      Math.PI * 2
    )
    this.ctx.fillStyle = "#fff"
    this.ctx.fill()
    this.ctx.strokeStyle = "#ccc"
    this.ctx.lineWidth = 1
    this.ctx.stroke()

    // 腕 (L1)
    this.ctx.beginPath()
    this.ctx.moveTo(cx, cy)
    this.ctx.lineTo(x1, y1)
    this.ctx.lineWidth = 12
    this.ctx.strokeStyle = "#60a5fa"
    this.ctx.lineCap = "round"
    this.ctx.stroke()

    // クラブシャフト (L2)
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.lineWidth = 6
    this.ctx.strokeStyle = "#c0c0c0"
    this.ctx.lineCap = "round"
    this.ctx.stroke()

    // 関節: 肩
    this.ctx.beginPath()
    this.ctx.arc(cx, cy, 10, 0, Math.PI * 2)
    this.ctx.fillStyle = "#ef4444"
    this.ctx.fill()

    // 関節: 手首
    this.ctx.beginPath()
    this.ctx.arc(x1, y1, 8, 0, Math.PI * 2)
    this.ctx.fillStyle = "#f97316"
    this.ctx.fill()

    // クラブヘッド (円形)
    this.ctx.beginPath()
    this.ctx.arc(x2, y2, 8, 0, Math.PI * 2)
    this.ctx.fillStyle = "#c0c0c0"
    this.ctx.fill()
    this.ctx.strokeStyle = "#888"
    this.ctx.lineWidth = 1.5
    this.ctx.stroke()
  }
}

new GolfApp()
