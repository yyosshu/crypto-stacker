# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

**crypto-stacker** は、bitbank取引所からBTC/JPYのリアルタイム価格を取得し、時間足ベースのチャート表示を行うWebアプリケーションです。

## 開発コマンド

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動（ポート3000）
npm run dev

# プロダクションビルド
npm run build
```

## 実装済み機能

### リアルタイム価格表示
- bitbank WebSocket APIからのリアルタイムBTC/JPY価格取得
- 1秒間隔での価格・変動率・売買価格の更新
- 接続状態の監視と自動再接続機能

### 時間足チャート表示
- 7種類の時間足対応：1分足、5分足、15分足、30分足、1時間足、4時間足、1日足
- 各時間足で過去100本のろうそく足データを表示
- ろうそく足の終値を使用した折れ線チャート
- 現在足のリアルタイム更新（右端ポイントが動的変化）
- 時間足完了時の新ポイント追加（右シフト表示）

### UI・UX
- レスポンシブデザイン（デスクトップ・モバイル対応）
- ダークテーマ対応
- 時間足切り替えタブ
- 価格変動時のフラッシュ効果
- ホバー時のツールチップ表示

## 技術構成

### フロントエンド
- **HTML5/CSS3/JavaScript (ES6+)**
- **Chart.js**: チャート描画
- **Socket.IO Client**: WebSocket通信
- **date-fns**: 日時処理

### API連携
- **bitbank WebSocket API**: リアルタイム価格取得
- **bitbank REST API**: 過去のろうそく足データ取得
- 複数日・複数年のAPIコールによる大量データ処理

### アーキテクチャ
- **CandleManager**: 時間足の集約・管理
- **ChartDisplay**: Chart.jsを使用したチャート表示
- **PriceDisplay**: 価格情報の表示
- **WebSocketManager**: リアルタイム通信管理
- **ApiClient**: REST API呼び出し

## ファイル構成

```
src/
├── js/
│   ├── app.js                  # メインアプリケーション
│   ├── candle-manager.js       # 時間足管理
│   ├── chart-display.js        # チャート表示
│   ├── price-display.js        # 価格表示
│   ├── websocket-manager-real.js # WebSocket管理
│   └── api-client.js          # API呼び出し
└── css/
    └── style.css              # スタイルシート
```

## 開発時の注意点

### bitbank API制限
- 短期間時間足（1分〜1時間）：日付指定（YYYYMMDD）
- 長期間時間足（4時間〜1日）：年指定（YYYY）
- 複数日・複数年のデータを取得して最新100本を抽出

### リアルタイム更新ロジック
- WebSocket受信 → CandleManagerで時間足集約 → チャート更新
- 現在足：リアルタイム更新（同じ時間軸、価格のみ変更）
- 新しい足：時間足完了時のみ追加（新しい時間軸にポイント追加）

## Git コミットルール

- 1行のコミットメッセージのみ使用
- 簡潔で説明的な内容にする
- 例：「Add real-time BTC/JPY price chart with timeframe-based candlestick visualization」