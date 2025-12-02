// CDNから読み込んだmarkedをグローバル変数として宣言
declare const marked: {
  parse(src: string): Promise<string>
}

// 1. DOM要素を正確な型で取得し、非nullアサーション (!) または as を使用

// HTMLTextAreaElement 型であることを保証
const inputElement = document.getElementById(
  "markdown-input"
) as HTMLTextAreaElement
// HTMLDivElement 型であることを保証
const outputElement = document.getElementById(
  "preview-output"
) as HTMLDivElement

/**
 * 入力内容をMarkdownからHTMLに変換し、プレビューエリアに表示する関数
 * @returns {Promise<void>}
 */
const renderMarkdown = async (): Promise<void> => {
  // 取得した要素が存在しない場合は処理を終了
  if (!inputElement || !outputElement) {
    console.error("DOM要素が見つかりません。")
    return
  }

  // 入力値は string 型
  const markdownText = inputElement.value

  try {
    // marked.parse() は Promise<string> を返すため、await で処理を待つ
    const htmlOutput = await marked.parse(markdownText)

    // 出力エリアにHTMLを挿入
    outputElement.innerHTML = htmlOutput
  } catch (err) {
    console.error("Markdown rendering error:", err)
    outputElement.innerHTML = `<p style="color: red;">レンダリング中にエラーが発生しました。</p>`
  }
}

// 2. DOMの読み込み完了後にイベントを設定
document.addEventListener("DOMContentLoaded", () => {
  if (inputElement) {
    // 'input' イベントリスナーを設定。入力が変わるたびにレンダリング
    inputElement.addEventListener("input", renderMarkdown)

    // 初期表示をレンダリング
    renderMarkdown()
  }
})
