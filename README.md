# なんか気持ちい球




## 主な特徴 (Features)

- とりあえず触ってみろ

## 技術スタック (Tech Stack)

- **Frontend Framework**: Vue 3 (Composition API / `<script setup>`)
- **3D Graphics Engine**: Three.js (r170)
- **Shader Language**: Custom GLSL (Vertex & Fragment Shaders)
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite 6

---

## プロジェクト構成 (Directory Structure)

```text
portfolio-vue-three/
├── index.html              # エントリーHTML（純黒背景設定）
├── package.json            # 依存関係・起動スクリプト定義
├── vite.config.js          # Vite設定（Vue + Tailwind CSS v4プラグイン）
├── .gitignore              # Git除外設定 (node_modules, dist, .DS_Store等)
├── README.md               # プロジェクト仕様書・解説
└── src/
    ├── main.js             # Vueアプリケーションのエントリーポイント
    ├── style.css           # グローバルスタイル (Tailwind CSS v4)
    ├── App.vue             # メインコンポーネント（ポインタ・ホイール・ピンチ・サイズUI制御）
    ├── three/
    │   ├── SphereArrowScene.js     # Three.jsシーン、カスタムGLSLシェーダー、弾性・回転物理エンジン
    │   └── anamorphicGeometry.js   # 3D幾何変換・アナモルフィックリボン定義
    └── data/
        └── portfolioContent.js     # ポートフォリオ構造化データ定義
```

---

## セットアップと起動手順 (Getting Started)

### 前提条件
- Node.js (v18.0.0 以上推奨)
- npm または pnpm / yarn

### インストール
```bash
npm install
```

### 開発用サーバー起動 (ローカル実行)
```bash
npm run dev
```
起動後、ブラウザで `http://localhost:5173` を開いてください。

### プロダクションビルド
```bash
npm run build
```
ビルド成果物は `dist/` ディレクトリに出力されます。

### プレビュー
```bash
npm run preview
```

---

## 操作方法 (Controls)

| 操作 | 動作 |
| :--- | :--- |
| **クリック / タッチ押し込み** | 球体が触れた位置からぷるんと弾性変形（へこみ・引っ張り） |
| **ドラッグ / スワイプ** | 球体を3次元空間内で全方向に慣性回転 |
| **マウスホイール** | 球体のサイズを拡大 / 縮小 |
| **2本指ピンチイン / アウト** | スマートフォン等で直感的にサイズを拡大 / 縮小 |
| **画面下部スライダー** | サイズ倍率の微調整および `RESET` ボタンによる初期化 |

---

## ライセンス (License)

MIT License
