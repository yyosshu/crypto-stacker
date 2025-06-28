# 技術アーキテクチャ設計

## システム構成

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   bitbank API   │ ←──────────────→ │   Frontend App  │
│ (ticker_btc_jpy)│                  │  (JavaScript)   │
└─────────────────┘                  └─────────────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │   Web Browser   │
                                     │     (UI)        │
                                     └─────────────────┘
```

## フロントエンド アーキテクチャ

### モジュール構成

```
src/
├── index.html          # メインHTML
├── css/
│   ├── style.css       # メインスタイル
│   └── responsive.css  # レスポンシブ対応
├── js/
│   ├── app.js          # アプリケーションメイン
│   ├── websocket.js    # WebSocket接続管理
│   ├── price-display.js # 価格表示コンポーネント
│   ├── chart.js        # チャート表示
│   └── utils.js        # ユーティリティ関数
└── assets/
    └── icons/          # アイコン類
```

### コンポーネント設計

#### 1. WebSocketManager
```javascript
class WebSocketManager {
  constructor(url, options)
  connect()                  // 接続開始
  disconnect()              // 接続終了
  subscribe(channel)        // チャンネル購読
  onMessage(callback)       // メッセージ受信ハンドラ
  onStatusChange(callback)  // 接続状態変更ハンドラ
  reconnect()              // 再接続
}
```

#### 2. PriceDisplay
```javascript
class PriceDisplay {
  constructor(container)
  updatePrice(data)         // 価格情報更新
  updateTrend(direction)    // トレンド表示更新
  formatPrice(value)        // 価格フォーマット
  animateChange()          // 変更時アニメーション
}
```

#### 3. ChartDisplay
```javascript
class ChartDisplay {
  constructor(canvas)
  addDataPoint(price, timestamp)  // データポイント追加
  updateChart()                   // チャート再描画
  setTimeRange(minutes)          // 表示時間範囲設定
}
```

#### 4. AppController
```javascript
class AppController {
  constructor()
  init()                    // アプリ初期化
  handlePriceUpdate(data)   // 価格更新処理
  handleConnectionChange()  // 接続状態変更処理
  setupEventListeners()     // イベントリスナー設定
}
```

## データフロー

```
bitbank WebSocket
        │
        ▼ (ticker data)
WebSocketManager
        │
        ▼ (parsed data)
AppController
        │
        ├─────────────────────┐
        ▼                     ▼
PriceDisplay              ChartDisplay
        │                     │
        ▼                     ▼
     DOM更新               Canvas描画
```

## 状態管理

### アプリケーション状態
```javascript
const appState = {
  connection: {
    status: 'disconnected',    // 'connecting', 'connected', 'disconnected'
    lastConnected: null,
    reconnectAttempts: 0
  },
  price: {
    current: null,
    previous: null,
    trend: 'neutral',          // 'up', 'down', 'neutral'
    lastUpdated: null
  },
  history: {
    prices: [],               // 過去の価格データ
    maxPoints: 60            // 最大保持ポイント数
  },
  ui: {
    theme: 'light',          // 'light', 'dark'
    chartVisible: true
  }
};
```

## エラーハンドリング戦略

### WebSocket エラー
1. **接続エラー**: 指数バックオフで再接続
2. **データエラー**: ログ出力し、前回データを保持
3. **タイムアウト**: 一定時間でハートビート確認

### UI エラー
1. **描画エラー**: フォールバック表示
2. **データ形式エラー**: デフォルト値で表示継続

## パフォーマンス最適化

### 1. DOM更新最適化
- requestAnimationFrame使用
- 差分更新のみ実行
- 頻繁な更新の間引き

### 2. メモリ管理
- 古い価格データの自動削除
- イベントリスナーの適切な削除
- WebSocket接続の適切なクリーンアップ

### 3. 描画最適化
- Canvas使用でチャート描画
- デバウンス処理で不要な更新抑制

## セキュリティ考慮事項

### 1. XSS対策
- innerHTML使用を避ける
- textContentやcreateElementを使用
- 外部データのサニタイズ

### 2. WebSocket セキュリティ
- WSS (SSL) 接続必須
- 適切なOriginチェック
- レート制限対応

## ブラウザ互換性

### 必須API
- WebSocket API
- Canvas API
- ES6+ (Promise, Arrow functions, Classes)
- CSS Grid/Flexbox

### ポリフィル対応
- socket.io が古いブラウザ対応
- CSS Grid のフォールバック

## 開発・ビルド設定

### 開発環境
```json
{
  "scripts": {
    "dev": "live-server --port=3000",
    "build": "npm run minify && npm run optimize",
    "minify": "terser js/*.js -o dist/app.min.js",
    "optimize": "csso css/*.css -o dist/style.min.css"
  }
}
```

### 依存関係
```json
{
  "dependencies": {
    "socket.io-client": "^4.0.0"
  },
  "devDependencies": {
    "live-server": "^1.2.1",
    "terser": "^5.0.0",
    "csso": "^4.2.0"
  }
}
```