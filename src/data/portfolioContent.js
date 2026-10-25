/**
 * ポートフォリオに表示する自己紹介・制作実績・技術スタック・外部リンクの定義データ
 */

export const PROFILE_SUMMARY = {
  name: 'Haruki Watarai',
  roleTitle: 'Data Scientist / AI & Creative Software Engineer',
  tagline: '数理最適化・深層学習とインタラクティブな3D表現を融合し、複雑なアルゴリズムを直観的な体験へと昇華する。',
  bioParagraphs: [
    'Python（PyTorch, scikit-learn）を用いた機械学習・深層学習モデルの構築から、Rustによる高速計算基盤、Vue.js / Three.js を用いたインタラクティブな可視化システムまで一貫して設計・実装しています。',
    '仮説検証サイクルと数理的根拠（線形代数・確率統計）に立脚したアーキテクチャ設計を重視し、研究と実社会アプリケーションの架け橋となるプロダクトを開発しています。',
  ],
  location: 'Japan',
  statusText: 'Open for Research & Engineering Projects',
}

export const WORKS_ITEMS = [
  {
    id: 'algebraic-cv',
    title: 'AlgebraicCV — 連続空間プリミティブ視覚基盤',
    category: 'Computer Vision / Rust',
    summary: '離散画素グリッド走査を排し、楕円ガウス基底の代数閉包性と誤差予算制御によりマイクロ秒単位で空間特徴を追跡する非同期ビジョンエンジン。',
    tags: ['Rust', 'Computer Vision', 'Linear Algebra'],
  },
  {
    id: 'math-llm-post-training',
    title: '数理推論特化 LLM 事後学習パイプライン',
    category: 'Deep Learning / LLM',
    summary: '4Bパラメータモデルにおける段階的SFTとルールベース強化学習（GRPO）・モデルマージ（DARE-TIES）を組み合わせた演繹推論最適化。',
    tags: ['PyTorch', 'LLM', 'GRPO / SFT'],
  },
  {
    id: 'interactive-math-viz',
    title: 'Scrollytelling アルゴリズム数理シミュレータ',
    category: 'WebGL / Educational UI',
    summary: '誤差逆伝播法やLoRAの低ランク適応プロセスを高校数学レベルから視覚的・対話的に体験できるリアルタイムWebシミュレータ群。',
    tags: ['Vue 3', 'Three.js', 'Tailwind CSS'],
  },
]

export const SKILL_CATEGORIES = [
  {
    categoryName: 'Machine Learning & Data Science',
    items: [
      { name: 'PyTorch / Deep Learning', levelPercent: 92 },
      { name: 'Python (pandas / scikit-learn)', levelPercent: 95 },
      { name: 'Mathematical Optimization & Statistics', levelPercent: 88 },
    ],
  },
  {
    categoryName: 'Software & Creative Engineering',
    items: [
      { name: 'Vue 3 / TypeScript / Tailwind CSS', levelPercent: 86 },
      { name: 'Three.js / WebGL / GLSL Shaders', levelPercent: 84 },
      { name: 'Rust / High-Performance Computing', levelPercent: 80 },
    ],
  },
]

export const EXTERNAL_LINKS = [
  {
    id: 'github',
    label: 'GitHub',
    handle: '@haruki-watarai',
    description: 'OSSリポジトリ・実験コード・アルゴリズム実装',
    url: 'https://github.com',
  },
  {
    id: 'kaggle',
    label: 'Kaggle / Competitions',
    handle: 'ML Competitions',
    description: '医療画像解析（RSNA）・LLM数理推論コンペティション',
    url: 'https://www.kaggle.com',
  },
  {
    id: 'zenn-qiita',
    label: 'Tech Articles (Zenn / Note)',
    handle: 'Technical Blog',
    description: '深層学習の数理還元解説とアーキテクチャ考察',
    url: 'https://zenn.dev',
  },
  {
    id: 'contact',
    label: 'Contact / Email',
    handle: 'Get in Touch',
    description: '共同研究・開発案件・技術相談のお問い合わせ',
    url: 'mailto:contact@example.com',
  },
]
