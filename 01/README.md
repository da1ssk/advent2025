# Day 01: TypeScriptで作るMarkdownプレビューア

Advent Calendar 2025 - 1日目の記事です。

## 概要

TypeScriptを使って、リアルタイムでMarkdownをプレビューできるシンプルなWebアプリを作成しました。入力したMarkdownがその場でHTMLに変換され、プレビューエリアに表示されます。

[Markdownプレビューア](https://markdown-previewer-day01.vercel.app/)

## 使用技術

- **TypeScript** - 型安全なJavaScript
- **marked** - Markdown → HTML変換ライブラリ（CDN経由）
- **HTML/CSS** - Flexboxを使ったレスポンシブレイアウト

## 使用ツール

- **Google Gemini** - 初期コードの生成
- **Cursor + Claude Opus 4.5** - コードのリファインメント・デバッグ
- **Vercel** - デプロイ・ホスティング

## ディレクトリ構成

```
01/
├── index.html      # メインHTML
├── style.css       # スタイルシート
├── script.ts       # TypeScriptソース
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

1. **リアルタイムプレビュー** - 入力するたびに即座にプレビューが更新
2. **コードブロック対応** - シンタックスハイライト風のスタイリング
3. **レスポンシブデザイン** - 左右分割のFlexboxレイアウト

## コードのポイント

### TypeScriptの型定義

CDNから読み込んだ`marked`ライブラリをグローバル変数として宣言：

```typescript
declare const marked: {
  parse(src: string): Promise<string>
}
```

### DOM要素の型アサーション

```typescript
const inputElement = document.getElementById("markdown-input") as HTMLTextAreaElement
const outputElement = document.getElementById("preview-output") as HTMLDivElement
```

### 非同期処理

`marked.parse()`はPromiseを返すため、async/awaitで処理：

```typescript
const renderMarkdown = async (): Promise<void> => {
  const markdownText: string = inputElement.value
  const htmlOutput: string = await marked.parse(markdownText)
  outputElement.innerHTML = htmlOutput
}
```

## デプロイ

Vercelを使用してデプロイしています。

```bash
# Vercel CLIでデプロイ
npx vercel --prod
```

`vercel.json`で出力ディレクトリを設定：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "."
}
```

**本番URL:** https://markdown-previewer-day01.vercel.app

## 注意点

- ESモジュールを使用するため、`file://`プロトコルでは動作しません
- ローカルサーバー経由でアクセスしてください

## 参考リンク

- [marked - GitHub](https://github.com/markedjs/marked)
- [TypeScript公式ドキュメント](https://www.typescriptlang.org/docs/)

## ライセンス

MIT

---

Created by Kakumei, 2025

