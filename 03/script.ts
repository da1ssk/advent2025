// --- 型定義 (Interfaces) ---

/**
 * デフォルトパターン - Super Mario Bros. Theme (Simplified)
 * Note Index Mapping (B5 down to C4):
 * 0:B5, 1:A#5, 2:A5, 3:G#5, 4:G5, 5:F#5, 6:F5, 7:E5
 * 8:D#5, 9:D5, 10:C#5, 11:C5
 * 12:B4, 13:A#4, 14:A4, 15:G#4, 16:G4, 17:F#4, 18:F4, 19:E4
 * 20:D#4, 21:D4, 22:C#4, 23:C4
 */
// Pattern Generator Helper
const generatePattern = (
  callback: (
    addNote: (
      noteIndex: number | undefined,
      startStep: number,
      duration: number,
      noteType?: number
    ) => void,
    N: Record<string, number>
  ) => void
) => {
  const pattern: [number, number, number][] = []
  const addNote = (
    noteIndex: number | undefined,
    startStep: number,
    duration: number,
    noteType: number = 1 // 1: Staccato (default), 2: Continuous
  ) => {
    if (typeof noteIndex === "number") {
      for (let i = 0; i < duration; i++) {
        pattern.push([noteIndex, startStep + i, noteType])
      }
    }
  }
  // Note Mapping Helper
  const N = {
    B5: 0,
    Ash5: 1,
    A5: 2,
    Gsh5: 3,
    G5: 4,
    Fsh5: 5,
    F5: 6,
    E5: 7,
    Dsh5: 8,
    D5: 9,
    Csh5: 10,
    C5: 11,
    B4: 12,
    Ash4: 13,
    A4: 14,
    Gsh4: 15,
    G4: 16,
    Fsh4: 17,
    F4: 18,
    E4: 19,
    Dsh4: 20,
    D4: 21,
    Csh4: 22,
    C4: 23,
  }
  callback(addNote, N)
  return pattern
}

const PATTERNS = {
  mario: generatePattern((addNote, N) => {
    // Intro - 8th note grid (simplified)
    // E-E-E-C-E pattern (全て単音なのでStaccato)
    addNote(N.E5, 0, 1, 1) // Staccato
    addNote(N.E5, 1, 1, 1) // Staccato
    addNote(N.E5, 3, 1, 1) // Staccato
    addNote(N.C5, 5, 1, 1) // Staccato
    addNote(N.E5, 6, 1, 1) // Staccato
    addNote(N.G5, 8, 2, 2) // Continuous (2ステップ持続)
    addNote(N.G4, 12, 2, 2) // Continuous (2ステップ持続)

    // Theme A (Part 1) - Starts Step 16
    const baseA = 16
    addNote(N.C5, baseA + 0, 2, 2) // Continuous (2ステップ)
    addNote(N.G4, baseA + 3, 2, 2) // Continuous (2ステップ)
    addNote(N.E4, baseA + 6, 2, 2) // Continuous (2ステップ)
    addNote(N.A4, baseA + 9, 2, 2) // Continuous (2ステップ)
    addNote(N.B4, baseA + 12, 2, 2) // Continuous (2ステップ)
    addNote(N.Ash4, baseA + 14, 1, 1) // Staccato (単音)
    addNote(N.A4, baseA + 15, 1, 1) // Staccato (単音)

    // Theme A (Part 2) - Starts Step 32 (全て単音の速いフレーズ)
    const baseB = 32
    addNote(N.G4, baseB + 1, 1, 1) // Staccato
    addNote(N.E5, baseB + 2, 1, 1) // Staccato
    addNote(N.G5, baseB + 3, 1, 1) // Staccato
    addNote(N.A5, baseB + 4, 1, 1) // Staccato
    addNote(N.F5, baseB + 5, 1, 1) // Staccato
    addNote(N.G5, baseB + 6, 1, 1) // Staccato
    addNote(N.E5, baseB + 8, 1, 1) // Staccato
    addNote(N.C5, baseB + 9, 1, 1) // Staccato
    addNote(N.D5, baseB + 10, 1, 1) // Staccato
    addNote(N.B4, baseB + 11, 1, 1) // Staccato

    // Repeat Theme A (Part 1) Logic
    const baseC = 48
    addNote(N.C5, baseC + 0, 2, 2) // Continuous (2ステップ)
    addNote(N.G4, baseC + 3, 2, 2) // Continuous (2ステップ)
    addNote(N.E4, baseC + 6, 2, 2) // Continuous (2ステップ)
    addNote(N.A4, baseC + 9, 2, 2) // Continuous (2ステップ)
    addNote(N.B4, baseC + 12, 2, 2) // Continuous (2ステップ)
    addNote(N.Ash4, baseC + 14, 1, 1) // Staccato (単音)
    addNote(N.A4, baseC + 15, 1, 1) // Staccato (単音)

    // Theme A (Part 3 - Ending) (全て単音の速いフレーズ)
    const baseD = 64
    addNote(N.G4, baseD + 1, 1, 1) // Staccato
    addNote(N.E5, baseD + 2, 1, 1) // Staccato
    addNote(N.G5, baseD + 3, 1, 1) // Staccato
    addNote(N.A5, baseD + 4, 1, 1) // Staccato
    addNote(N.F5, baseD + 5, 1, 1) // Staccato
    addNote(N.G5, baseD + 6, 1, 1) // Staccato
    addNote(N.E5, baseD + 8, 1, 1) // Staccato
    addNote(N.C5, baseD + 9, 1, 1) // Staccato
    addNote(N.D5, baseD + 10, 1, 1) // Staccato
    addNote(N.B4, baseD + 11, 1, 1) // Staccato
  }),
}

const DEFAULT_PATTERN = PATTERNS.mario

/** シーケンサーの状態を表すクラス */
class Sequencer {
  // 定数
  private readonly STEPS_PER_BAR: number = 8 // 16->8倍の分解能へ (8分音符ベース)

  // private readonly TOTAL_BARS: number = 8 // 削除: 画面幅に応じて動的に決定
  public readonly TOTAL_STEPS: number = 80 // Fixed length for full song (~10 bars, 8th notes)
  // B5からC4までの半音階 (Chromatic)
  private readonly NOTES: number[] = [
    987.77,
    932.33,
    880.0,
    830.61,
    783.99,
    739.99,
    698.46,
    659.25, // B5 - E5
    622.25,
    587.33,
    554.37,
    523.25, // D#5 - C5
    493.88,
    466.16,
    440.0,
    415.3,
    392.0,
    369.99,
    349.23,
    329.63, // B4 - E4
    311.13,
    293.66,
    277.18,
    261.63, // D#4 - C4
  ]
  public readonly NOTE_COUNT: number

  // 状態管理
  private sequence: number[][] = [] // [noteIndex][stepIndex] (0: OFF, 1: Staccato, 2: Continuous)
  private isPlaying: boolean = false
  private currentStep: number = 0
  private nextStepTime: number = 0
  private scheduleTimerId: number | null = null
  private lastPlayedNote: number | null = null // 前のステップで鳴らした音符
  private lastPlayedNoteType: number = 0 // 前のステップの音符タイプ (1: Staccato, 2: Continuous)

  // Web Audio API
  private audioContext: AudioContext

  // DOM要素
  private sequencerDiv: HTMLDivElement
  private playPauseBtn: HTMLButtonElement
  private bpmInput: HTMLInputElement
  private clearBtn: HTMLButtonElement
  private resetBtn: HTMLButtonElement
  private saveBtn: HTMLButtonElement
  private loadBtn: HTMLButtonElement
  private savedListDiv: HTMLDivElement

  constructor() {
    // Fixed TOTAL_STEPS is already set in class property

    this.NOTE_COUNT = this.NOTES.length
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()

    // DOM要素の取得と型アサーション
    this.sequencerDiv = document.getElementById("sequencer") as HTMLDivElement
    this.playPauseBtn = document.getElementById(
      "playPauseBtn"
    ) as HTMLButtonElement
    this.bpmInput = document.getElementById("bpm") as HTMLInputElement
    this.clearBtn = document.getElementById("clearBtn") as HTMLButtonElement
    this.resetBtn = document.getElementById("resetBtn") as HTMLButtonElement
    this.saveBtn = document.getElementById("saveBtn") as HTMLButtonElement
    this.loadBtn = document.getElementById("loadBtn") as HTMLButtonElement
    this.savedListDiv = document.getElementById("savedList") as HTMLDivElement

    this.initSequencer()
    this.setupEventListeners()
    this.loadPattern(DEFAULT_PATTERN) // Default
    this.renderSavedList() // Display saved items
  }

  /**
   * シーケンサーの初期化とDOMへの描画
   */
  private initSequencer(): void {
    // グリッドの列数を固定幅で設定（スクロール可能に）
    const cellWidth = 20 // 固定幅
    this.sequencerDiv.style.gridTemplateColumns = `repeat(${this.TOTAL_STEPS}, ${cellWidth}px)`

    // シーケンス配列の初期化
    for (let i = 0; i < this.NOTE_COUNT; i++) {
      this.sequence[i] = new Array(this.TOTAL_STEPS).fill(0)
    }

    this.NOTES.forEach((noteFreq, noteIndex) => {
      for (let stepIndex = 0; stepIndex < this.TOTAL_STEPS; stepIndex++) {
        const cell: HTMLDivElement = document.createElement("div")
        cell.classList.add("cell")
        cell.dataset.note = noteIndex.toString()
        cell.dataset.step = stepIndex.toString()

        // 視認性のためのクラス追加
        if ((stepIndex + 1) % this.STEPS_PER_BAR === 0) {
          cell.classList.add("step-16")
        } else if ((stepIndex + 1) % (this.STEPS_PER_BAR / 4) === 0) {
          cell.classList.add("step-4")
        }

        cell.addEventListener("click", this.toggleNote.bind(this))
        this.sequencerDiv.appendChild(cell)
      }
    })
  }

  /**
   * パターンをロードしてシーケンサーに反映する
   * @param pattern [noteIndex, stepIndex, noteType] の配列
   */
  private loadPattern(pattern: [number, number, number][]): void {
    for (const [noteIndex, stepIndex, noteType] of pattern) {
      if (
        noteIndex >= 0 &&
        noteIndex < this.NOTE_COUNT &&
        stepIndex >= 0 &&
        stepIndex < this.TOTAL_STEPS
      ) {
        this.sequence[noteIndex]![stepIndex] = noteType
        const cell = document.querySelector(
          `.cell[data-note="${noteIndex}"][data-step="${stepIndex}"]`
        ) as HTMLDivElement | null
        if (cell) {
          if (noteType === 1) {
            cell.classList.add("note-on")
          } else if (noteType === 2) {
            cell.classList.add("note-continuous")
          }
        }
      }
    }
  }

  /**
   * DOM要素のイベントリスナー設定
   */
  private setupEventListeners(): void {
    this.playPauseBtn.addEventListener("click", this.togglePlayback.bind(this))
    this.clearBtn.addEventListener("click", this.handleClear.bind(this))
    this.resetBtn.addEventListener("click", this.handleReset.bind(this))
    this.saveBtn.addEventListener("click", this.handleSave.bind(this))
    this.loadBtn.addEventListener("click", this.handleLoad.bind(this))
  }

  private handleClear(): void {
    // 停止
    if (this.isPlaying) {
      this.togglePlayback()
    }
    // グリッドをクリア
    this.clearGrid()
  }

  private handleReset(): void {
    // 停止
    if (this.isPlaying) {
      this.togglePlayback()
    }
    // グリッドをクリア
    this.clearGrid()
    // デフォルトパターンをロード
    this.loadPattern(DEFAULT_PATTERN)
  }

  private handleSave(): void {
    // 名前を入力
    const name = prompt(
      "パターン名を入力してください:",
      `パターン ${new Date().toLocaleString("ja-JP")}`
    )
    if (!name) return

    // 既存の保存データを取得
    const saves = this.getSavedPatterns()

    // 現在のシーケンスを保存
    const saveData = {
      name: name,
      sequence: this.sequence,
      bpm: this.bpmInput.value,
      timestamp: new Date().toISOString(),
    }

    saves[name] = saveData
    localStorage.setItem("sequencer-saves", JSON.stringify(saves))
    alert("保存しました！")
    this.renderSavedList()
  }

  private handleLoad(): void {
    // This button is now just for showing the list (list is always visible)
    alert("下の保存リストから読み込みたいパターンをクリックしてください")
  }

  private getSavedPatterns(): Record<string, any> {
    const saved = localStorage.getItem("sequencer-saves")
    return saved ? JSON.parse(saved) : {}
  }

  private loadFromSave(name: string): void {
    const saves = this.getSavedPatterns()
    const data = saves[name]
    if (!data) {
      alert("データが見つかりません")
      return
    }

    try {
      // 停止
      if (this.isPlaying) {
        this.togglePlayback()
      }

      // グリッドをクリア
      this.clearGrid()

      // 保存されたシーケンスをロード
      this.sequence = data.sequence

      // BPMも復元
      if (data.bpm) {
        this.bpmInput.value = data.bpm
      }

      // DOMを更新
      for (let noteIndex = 0; noteIndex < this.NOTE_COUNT; noteIndex++) {
        for (let stepIndex = 0; stepIndex < this.TOTAL_STEPS; stepIndex++) {
          const state = this.sequence[noteIndex]![stepIndex]
          if (state !== 0) {
            const cell = document.querySelector(
              `.cell[data-note="${noteIndex}"][data-step="${stepIndex}"]`
            ) as HTMLDivElement | null
            if (cell) {
              if (state === 1) {
                cell.classList.add("note-on")
              } else if (state === 2) {
                cell.classList.add("note-continuous")
              }
            }
          }
        }
      }

      alert(`「${name}」をロードしました！`)
    } catch (e) {
      alert("ロードに失敗しました")
      console.error(e)
    }
  }

  private deleteFromSave(name: string): void {
    if (!confirm(`「${name}」を削除しますか？`)) return

    const saves = this.getSavedPatterns()
    delete saves[name]
    localStorage.setItem("sequencer-saves", JSON.stringify(saves))
    this.renderSavedList()
    alert("削除しました")
  }

  private renderSavedList(): void {
    const saves = this.getSavedPatterns()
    this.savedListDiv.innerHTML = ""

    const saveNames = Object.keys(saves)
    if (saveNames.length === 0) {
      this.savedListDiv.innerHTML =
        '<p style="color: #666;">保存されたパターンはありません</p>'
      return
    }

    saveNames.forEach((name) => {
      const data = saves[name]
      const item = document.createElement("div")
      item.className = "saved-item"

      const info = document.createElement("div")
      info.className = "saved-item-info"
      info.onclick = () => this.loadFromSave(name)

      const nameSpan = document.createElement("span")
      nameSpan.className = "saved-item-name"
      nameSpan.textContent = name

      const dateSpan = document.createElement("span")
      dateSpan.className = "saved-item-date"
      const date = new Date(data.timestamp)
      dateSpan.textContent = ` (${date.toLocaleString("ja-JP")})`

      info.appendChild(nameSpan)
      info.appendChild(dateSpan)

      const deleteBtn = document.createElement("button")
      deleteBtn.className = "saved-item-delete"
      deleteBtn.textContent = "削除"
      deleteBtn.onclick = (e) => {
        e.stopPropagation()
        this.deleteFromSave(name)
      }

      item.appendChild(info)
      item.appendChild(deleteBtn)
      this.savedListDiv.appendChild(item)
    })
  }

  private clearGrid(): void {
    // 内部状態クリア
    for (let i = 0; i < this.NOTE_COUNT; i++) {
      this.sequence[i]!.fill(0)
    }
    // DOMクリア
    document
      .querySelectorAll(".note-on, .note-continuous")
      .forEach((el) => el.classList.remove("note-on", "note-continuous"))
  }

  // --- DOM操作 ---

  /**
   * セルがクリックされた時の処理
   * 3状態をサイクル: 0 (OFF) -> 1 (Staccato) -> 2 (Continuous) -> 0
   * @param {MouseEvent} e
   */
  private toggleNote(e: MouseEvent): void {
    const cell = e.target as HTMLDivElement
    const noteIndex = parseInt(cell.dataset.note!, 10) // ! は非nullアサーション
    const stepIndex = parseInt(cell.dataset.step!, 10)

    const currentState = this.sequence[noteIndex]![stepIndex]

    // モノフォニック処理: 同じステップの他の音符をOFFにする
    for (let i = 0; i < this.NOTE_COUNT; i++) {
      if (i !== noteIndex && this.sequence[i]![stepIndex] !== 0) {
        this.sequence[i]![stepIndex] = 0
        const oldCell = document.querySelector(
          `.cell[data-note="${i}"][data-step="${stepIndex}"]`
        ) as HTMLDivElement
        if (oldCell) {
          oldCell.classList.remove("note-on", "note-continuous")
        }
      }
    }

    // 3状態サイクル
    if (currentState === 0) {
      // OFF -> Staccato
      this.sequence[noteIndex]![stepIndex] = 1
      cell.classList.add("note-on")
      cell.classList.remove("note-continuous")
    } else if (currentState === 1) {
      // Staccato -> Continuous
      this.sequence[noteIndex]![stepIndex] = 2
      cell.classList.remove("note-on")
      cell.classList.add("note-continuous")
    } else {
      // Continuous -> OFF
      this.sequence[noteIndex]![stepIndex] = 0
      cell.classList.remove("note-on", "note-continuous")
    }
  }

  // --- オーディオ再生ロジック ---

  /**
   * 矩形波（Pulse Wave, Square Type）のオシレーターを作成・再生する
   * @param {number} frequency - 再生する周波数（Hz）
   * @param {number} duration - 音の長さ（秒）
   */
  private playPulse(frequency: number, duration: number): void {
    const time = this.audioContext.currentTime

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    // Square波を設定（ファミコンの矩形波を簡易的に再現）
    oscillator.type = "square"
    oscillator.frequency.setValueAtTime(frequency, time)

    // 音量のエンベロープ (アタックとディケイ)
    gainNode.gain.setValueAtTime(0.0, time)
    gainNode.gain.linearRampToValueAtTime(0.3, time + 0.005) // Attack
    gainNode.gain.linearRampToValueAtTime(0.0, time + duration) // Decay

    // 接続
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    // 再生と停止をスケジュール
    oscillator.start(time)
    oscillator.stop(time + duration)
  }

  /**
   * 現在のステップの音符をチェックし、鳴らす
   * @param {number} stepIndex - 現在のステップ
   */
  private playStep(stepIndex: number): void {
    const bpm: number = parseFloat(this.bpmInput.value)
    if (isNaN(bpm) || bpm <= 0) return

    const stepDuration: number = 60 / bpm / 2 // 8分音符の長さ（秒）

    // 該当ステップで音符がONになっている行を探す
    let currentNote: number | null = null
    let noteType: number = 0
    for (let i = 0; i < this.NOTE_COUNT; i++) {
      if (this.sequence[i]![stepIndex] !== 0) {
        currentNote = i
        noteType = this.sequence[i]![stepIndex]!
        break // モノフォニックなので、見つけたら終了
      }
    }

    // 音符がない場合
    if (currentNote === null) {
      this.lastPlayedNote = null
      this.lastPlayedNoteType = 0
      return
    }

    // 前のステップと同じ音符かつContinuousタイプの場合はスキップ
    if (currentNote === this.lastPlayedNote && this.lastPlayedNoteType === 2) {
      // 同じ音符が続いている場合は再トリガーしない（長い音として継続）
      return
    }

    const noteFreq = this.NOTES[currentNote]!
    let duration: number

    if (noteType === 1) {
      // Staccato: 短い音
      duration = stepDuration * 0.5
    } else {
      // Continuous: 何ステップ続くか先読みして長さを計算
      let noteLength = 1
      for (let s = stepIndex + 1; s < this.TOTAL_STEPS; s++) {
        if (this.sequence[currentNote]![s] === 2) {
          noteLength++
        } else {
          break
        }
      }
      duration = stepDuration * noteLength * 0.95
    }

    this.playPulse(noteFreq, duration)
    this.lastPlayedNote = currentNote
    this.lastPlayedNoteType = noteType
  }

  /**
   * 最後の音符の位置を取得
   */
  private getLastNoteStep(): number {
    let lastStep = 0
    for (let stepIndex = this.TOTAL_STEPS - 1; stepIndex >= 0; stepIndex--) {
      for (let noteIndex = 0; noteIndex < this.NOTE_COUNT; noteIndex++) {
        if (this.sequence[noteIndex]![stepIndex] !== 0) {
          return stepIndex
        }
      }
    }
    return lastStep
  }

  /**
   * スケジュール処理 (メトロノームのように正確な時間に音を鳴らす)
   */
  private scheduler(): void {
    const lookahead: number = 0.1 // 100ms先のイベントまでスケジュール
    const bpm: number = parseFloat(this.bpmInput.value)
    if (isNaN(bpm) || bpm <= 0) {
      this.togglePlayback() // BPMが無効なら停止
      return
    }

    const stepDuration: number = 60 / bpm / 2 // 8分音符の秒数
    const lastNoteStep = this.getLastNoteStep()

    while (this.nextStepTime < this.audioContext.currentTime + lookahead) {
      // 1. DOMハイライト更新
      this.updateDOMHighlight(this.currentStep)

      // 2. 音を鳴らす
      this.playStep(this.currentStep)

      // 3. 次の時刻とステップを設定
      this.nextStepTime += stepDuration
      this.currentStep = this.currentStep + 1

      // 最後の音符まで到達したらループ（最初に戻る）
      if (this.currentStep > lastNoteStep) {
        this.currentStep = 0
        this.lastPlayedNote = null
        this.lastPlayedNoteType = 0
      }
    }

    // 次のスケジュール処理を設定
    if (this.isPlaying) {
      this.scheduleTimerId = window.setTimeout(this.scheduler.bind(this), 50)
    }
  }

  /**
   * DOM上の現在のステップのハイライトを更新する
   * @param {number} stepIndex
   */
  /**
   * DOM上の現在のステップのハイライトを更新する
   * @param {number} stepIndex
   */
  private updateDOMHighlight(stepIndex: number): void {
    // 古いハイライトを削除
    document
      .querySelectorAll(".current-step")
      .forEach((cell) => cell.classList.remove("current-step"))

    // 再生停止時(-1)は処理終了
    if (stepIndex === -1) return

    // 新しいハイライトを追加
    const currentCells = document.querySelectorAll(`[data-step="${stepIndex}"]`)
    currentCells.forEach((cell) => cell.classList.add("current-step"))

    // スクロールして再生位置を中央に配置
    const firstCell = currentCells[0] as HTMLElement
    if (firstCell && this.sequencerDiv) {
      const containerWidth = this.sequencerDiv.clientWidth
      const cellLeft = firstCell.offsetLeft
      const cellWidth = firstCell.offsetWidth

      // セルの中心を画面の中心に配置
      const scrollTo = cellLeft + cellWidth / 2 - containerWidth / 2
      this.sequencerDiv.scrollLeft = Math.max(0, scrollTo)
    }
  }

  // --- 再生制御 ---

  /**
   * 再生/停止を切り替える
   */
  private togglePlayback(): void {
    if (this.isPlaying) {
      // 停止処理
      this.isPlaying = false
      this.playPauseBtn.textContent = "再生 / 停止"
      if (this.scheduleTimerId !== null) {
        window.clearTimeout(this.scheduleTimerId)
      }
      this.updateDOMHighlight(-1) // 全てのハイライトを削除
      this.currentStep = 0 // 最初からに戻す
      this.lastPlayedNote = null // 音符追跡をリセット
      this.lastPlayedNoteType = 0
    } else {
      // 再生処理
      this.isPlaying = true
      this.playPauseBtn.textContent = "■ 再生中..."

      if (this.audioContext.state === "suspended") {
        this.audioContext.resume()
      }

      this.currentStep = 0
      this.nextStepTime = this.audioContext.currentTime
      this.lastPlayedNote = null // 音符追跡をリセット
      this.lastPlayedNoteType = 0

      this.scheduler()
    }
  }
}

// アプリケーションのエントリーポイント
document.addEventListener("DOMContentLoaded", () => {
  new Sequencer()
})
