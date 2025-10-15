# メモリーカードゲーム 技術設計書（ドラフト）

## 1. アーキテクチャ概要
- **フレームワーク**: React 18 + TypeScript + Vite（軽量かつ高速ビルドを優先）
- **状態管理**: React Hooks (`useState`, `useReducer`, `useEffect`) を中心に構成し、ゲーム状態はカスタムフック `useGameEngine` に集約する。
- **UI レイヤー**: Atomic Designに準拠した簡易レベル（Atoms: ボタン/カード、Molecules: HUD、Organisms: ゲーム盤、Templates: 画面全体）。
- **スタイル**: CSS Modules または Tailwind CSS。MVPの速度を優先し Tailwind 導入を想定。演出アニメーションはCSSトランジションで実装し、JS負荷を削減。
- **永続化**: `localStorage` を `useLocalStorage` フック経由で抽象化。
- **テスト**: Jest + React Testing Library によるユニットテスト。重要なゲームロジックはロジック単体テスト、UIはスナップショット/動作テストを最低限実施。

```
App
 ├─ GameScreen
 │   ├─ HUD
 │   ├─ CardGrid
 │   │   └─ MemoryCard (10〜15枚)
 │   └─ ActionBar
 ├─ ScoreModal
 └─ SettingsPanel
```

## 2. コンポーネント設計

### 2.1 App
- 役割: ルートコンポーネント。ゲーム状態の監視・ルーティング不要（単一画面）。
- 機能: `useGameEngine` を初期化し、`GameScreen`, `ScoreModal`, `SettingsPanel` を切り替え表示。

### 2.2 GameScreen
- 役割: ゲームプレイ画面の土台。レスポンシブレイアウトを担当。
- 子コンポーネント: `HUD`, `CardGrid`, `ActionBar`。

### 2.3 HUD
- 表示: 残り時間、現在スコア、成功ペア数、最高スコア。
- Timer 表示は `mm:ss` 形式。カラーバッジで視認性向上。

### 2.4 CardGrid
- 役割: カードをグリッド配置する。スマホは 2〜3 カラム、PCは 4〜5 カラム。
- ロジック: `MemoryCard` のクリックイベントを `GameScreen` 経由で `useGameEngine` に伝搬。

### 2.5 MemoryCard
- Props: `id`, `icon`, `isFlipped`, `isMatched`, `onFlip`.
- アニメーション: CSS `transform: rotateY` を利用し、フリップ演出を実現。
- アクセシビリティ: `role="button"`, `aria-pressed`.

### 2.6 ActionBar
- ボタン: `リスタート`, `ヒントを見る（やさしいのみ）`, `設定`.
- ボタンは大きめでタップしやすいサイズを確保。

### 2.7 ScoreModal
- 役割: ゲームクリア時にモーダル表示。結果まとめ、最高スコア更新演出。
- 機能: `閉じる`, `もう一度遊ぶ`。最高スコア更新時は祝福アニメーション（CSSパーティクル）。

### 2.8 SettingsPanel
- 役割: 難易度選択、BGM/効果音ON/OFF切替、続きからプレイの選択。
- 表示: ドロワー式パネルでスマホでも操作しやすくする。

## 3. カスタムフック設計

### 3.1 useGameEngine
- 責務: ゲームの状態遷移・スコアロジック・タイマー管理。
- 内部状態:
  ```ts
  type GameState = {
    difficulty: Difficulty;
    deck: CardModel[];
    flippedCardIds: string[];
    matchedCardIds: Set<string>;
    score: number;
    combo: number;
    mistakes: number;
    remainingTimeMs: number;
    isRunning: boolean;
    startedAt: number | null;
    sessionId: string;
  };
  ```
- 難易度ごとのパラメータ:
  ```ts
  const DIFFICULTY_SETTINGS: Record<Difficulty, {
    totalCards: number;
    timeLimitMs: number | null;
    hintAvailable: boolean;
  }>;
  ```
- 主なAPI:
  - `startGame(difficulty)`
  - `flipCard(cardId)`
  - `restartGame()`
  - `resumeFromSession(session: PersistedSession)`
  - `tick(deltaMs)` → `useEffect` で interval 管理
  - `useHint()` → やさしいモード限定

### 3.2 useLocalStorage
- ジェネリック対応: `useLocalStorage<T>(key, initialValue)`
- セッション保存:
  ```ts
  type PersistedSession = {
    savedAt: number;
    state: GameState;
  };
  ```
- 最高スコア保存:
  ```ts
  type HighScoreStore = Record<Difficulty, { score: number; achievedAt: number }>;
  ```

### 3.3 useSound
- 効果音再生を抽象化。BGMとSEのON/OFFを状態で管理。
- Web Audio API ライブラリ（Howler.js）を導入するか検討。MVPは HTMLAudioElement の簡易実装。

## 4. データモデル

```ts
type Difficulty = 'easy' | 'normal' | 'hard';

type CardModel = {
  id: string;        // ランダムUUID
  pairId: string;    // ペアの識別子
  icon: string;      // 表アイコン (画像URL or emoji)
  status: 'hidden' | 'flipped' | 'matched';
};
```

カードデッキは以下フローで生成:
1. テーマ定義から `pairId` ごとにアイコン候補（PNG/SVG or emoji）を取得。
2. 難易度設定に応じて必要ペア数をサンプリング。
3. `pairId` を複製してシャッフル → `CardModel[]` として保持。

## 5. ゲームロジック詳細

1. `flipCard(cardId)` が呼ばれると、以下の状態遷移を実施:
   - すでに `flippedCardIds` が2枚の場合は入力無視。
   - 1枚目 → `flippedCardIds` に追加。
   - 2枚目 → 判定。`pairId` が一致すれば `matchedCardIds` に登録し、`score += pairBonus`.
2. スコア計算式（暫定）:
   ```
   basePairScore = 100
   comboBonus = combo * 20
   timeBonus = floor(remainingTimeMs / 1000) * 2
   mistakePenalty = mistakes * 10
   FinalScore = sum(basePairScore + comboBonus) + timeBonus - mistakePenalty
   ```
3. タイマー: `requestAnimationFrame` ではなく `setInterval` (1s) で残り時間を減算。残り10秒以下でHUDを赤色点滅。
4. ヒント: 全カードを1秒間オープン → `hintUsed` フラグON。1回限り。
5. ゲームクリア条件: `matchedCardIds.size === deck.length`. クリア時に `isRunning = false`。

## 6. ローカルストレージアクセス戦略
- キー設計:
  - `memory-game:last-difficulty`
  - `memory-game:high-scores`
  - `memory-game:session`
- 保存フロー:
  1. `startGame` 時に `sessionId` 生成 → `session` に保存。
  2. `setInterval` (5s) で `session` を更新。
  3. ゲーム終了時に `high-scores` を更新し、`session` を削除。
- 起動時:
  - `session` が存在すれば再開ポップアップを表示。
  - `high-scores` を読み、HUDに反映。

## 7. 効果音・BGM
- フリー素材サイト（OtoLogic 等）を利用。プリロードせず、初回再生時にロードし、操作遅延を減らす。
- ブラウザの自動再生制限に対応するため、最初のユーザー操作後にBGM再生を開始。
- サウンド設定は `localStorage` に保持し、次回起動時に反映。

## 8. レスポンシブデザイン戦略
- Tailwind のブレークポイント `sm/md/lg` を利用。
- スマホ: 2列 × 5行 (10枚) / 3列 × 4行 (12枚) / 3列 × 5行 (15枚)
- タブレット/PC: 4列 × 3〜4行。カード比率は `aspect-square` を使用。
- フォントサイズは `clamp` を用いて最小/最大値を制御。

## 9. アニメーション / 演出
- CSS `transition` + `transform` でフリップ。`prefers-reduced-motion` を尊重しオフに切り替え。
- ペア成立時: `scale` + `box-shadow` + `particle` (疑似要素)。
- 最高スコア更新時: `ScoreModal` 内で konfetti API（軽量JSライブラリ）またはCSSアニメーションを適用。

## 10. テスト計画 (技術視点)
- `useGameEngine`:
  - 難易度ごとの初期デッキサイズ/タイム制限が正しいか。
  - 2枚一致で `matchedCardIds` 更新、スコア加算されるか。
  - 不一致時に `mistakes` 増加、コンボリセットされるか。
  - タイマーが0でゲーム停止するか。
  - セッション保存データを復元できるか。
- コンポーネント:
  - `MemoryCard` のクリックで `onFlip` が呼ばれるか。
  - `HUD` が状態に応じて表示を更新するか。
- E2E（オプション）:
  - Cypressで主要フロー（スタート→数枚めくる→クリア→再スタート）を検証。

## 11. ディレクトリ構成（案）
```
src/
  assets/           // フリー素材（画像・音）
  components/
    HUD/
    MemoryCard/
    ScoreModal/
    ActionBar/
  hooks/
    useGameEngine.ts
    useLocalStorage.ts
    useSound.ts
  utils/
    shuffle.ts
    score.ts
  data/
    themeAnimals.ts
  styles/
    globals.css
  App.tsx
  main.tsx
tests/
  hooks/useGameEngine.test.ts
  components/MemoryCard.test.tsx
```

## 12. MVP スコープ（1時間以内）
1. Vite + React + TypeScript 初期化。
2. Tailwind 設定。
3. `useGameEngine` の最小ロジック（単一難易度・10枚固定・簡易スコア）。
4. `MemoryCard`/`CardGrid`/`HUD`/`ActionBar` を組み合わせて単一画面でプレイ可能にする。
5. ゲームクリア→モーダル表示→リスタート。
6. `localStorage` に最高スコア保存（難易度固定のため単一キー）。

追加機能（時間が余れば）:
- 難易度切替
- タイマー・ヒント
- サウンド
- 続きから再開

## 13. 今後の拡張
- マルチプレイ: WebSocket サーバーとの同期ロジック。後続フェーズで設計。
- カードテーマ: JSON定義ファイルを増やすだけで追加可能なよう設計済み。
- PWA化: Service Worker導入、オフライン対応。
- 分析: 子どものプレイデータ収集を実施する場合は保護者同意・匿名化を徹底。

---
本設計について追記・修正の要望があればフィードバックをお願いします。
