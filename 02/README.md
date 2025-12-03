# Day 02: TypeScriptで作るゴルフスイングシミュレーター

🌐 [English](./README.en.md)

Advent Calendar 2025 - 2日目の記事です。

## 概要

TypeScriptを使って、ゴルフスイングを物理シミュレーションするWebアプリを作成しました。二重振り子モデル（肩と手首の2自由度）を使用し、トルク制御によるスイング動作をシミュレートします。ボールへのインパクト、飛距離計算、軌道表示まで対応しています。

## 使用技術

- **TypeScript** - 型安全なJavaScript
- **Canvas API** - スイングアニメーションと軌道描画
- **Lagrangian力学** - 二重振り子の運動方程式
- **Runge-Kutta法 (RK4)** - 数値積分による物理シミュレーション
- **HTML/CSS** - モダンなダークテーマUI

## 使用ツール

- **Cursor + Claude Opus 4.5** - コード生成・デバッグ・最適化
- **Vercel** - デプロイ・ホスティング

## ディレクトリ構成

```
02/
├── index.html      # メインHTML
├── style.css       # スタイルシート
├── main.ts         # TypeScriptソース
├── dist/           # コンパイル後のJS
├── package.json
└── tsconfig.json
```

## セットアップ

```bash
# 依存関係のインストール
npm install

# TypeScriptのコンパイル
npx tsc

# ローカルサーバーの起動
npx serve
# または
python3 -m http.server 8080
```

## 主な機能

1. **2自由度スイングモデル** - 肩関節と手首関節の物理シミュレーション
2. **トルク制御** - 肩と手首のトルク強度・タイミングを調整可能
3. **ボールインパクト検出** - クラブヘッドがボールに当たる瞬間を検出
4. **飛距離計算** - 空気抵抗を考慮した弾道計算（キャリー + ラン）
5. **軌道可視化** - ボールの飛翔軌道をリアルタイム表示
6. **最適化機能** - 2フェーズ最適化（ランダム探索 + 山登り法）で最適パラメータを探索
7. **フェーズスライダー** - スイングの任意の瞬間を確認可能

## 物理モデル

### 二重振り子

- **L1 (腕)**: 0.55m, 4.5kg
- **L2 (クラブ)**: 0.95m, 0.35kg（7アイアン相当）
- **反発係数 (COR)**: 0.78
- **ロフト角**: 34°

### スイングパラメータ

- **肩トルク**: 30-150 Nm
- **手首トルク**: -50〜80 Nm（負値でラグ維持）
- **初期状態**: 腕-120°、手首コック45°

## コードのポイント

### 運動方程式 (Lagrangian)

```typescript
static computeAccelerations(
  theta1: number, omega1: number,
  theta2: number, omega2: number,
  tau1: number, tau2: number
): [number, number] {
  // 二重振り子のラグランジュ運動方程式
  // 質量行列と力ベクトルから角加速度を計算
}
```

### Runge-Kutta積分

```typescript
static rk4Step(state: State, tau1: number, tau2: number): State {
  // 4次のRunge-Kutta法で状態を更新
  // より高精度な数値積分
}
```

### 弾道計算

```typescript
calculateBallTrajectory(impactVx, impactVy, shaftLean) {
  // アタック角、ダイナミックロフトから打ち出し角を計算
  // 空気抵抗を考慮した放物運動
  // 着地後のラン（転がり）も計算
}
```

## デプロイ

Vercelを使用してデプロイしています。

```bash
# Vercel CLIでデプロイ
npx vercel --prod
```

## 注意点

- ESモジュールを使用するため、`file://`プロトコルでは動作しません
- ローカルサーバー経由でアクセスしてください
- 最適化は計算負荷が高いため、完了まで数秒かかります

## 参考リンク

- [Double Pendulum - Wikipedia](https://en.wikipedia.org/wiki/Double_pendulum)
- [Golf Ball Flight Physics](https://www.golfdigest.com/story/the-physics-of-a-golf-swing)
- [TypeScript公式ドキュメント](https://www.typescriptlang.org/docs/)

## ライセンス

MIT

---

Created by @da1ssk, 2025

