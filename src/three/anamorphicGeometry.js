import * as THREE from 'three'

/**
 * 四方向に伸びる「くの字の矢印」＝「並んでいた文章の側面（エッジプロファイル）」の定義。
 *
 * 初期状態 (progress = 0) では、カメラの視線方向に対して文章プレートが真横（側面）を向いており、
 * その側面エッジ自体が球から四方向へ伸びる「くの字の矢印」を形作っている。
 * スライドによって視点がくの字の方向へ回り込む (progress -> 1) と、
 * 側面だった「くの字」が正面の平面へと向きを変え、連なっていた文章が浮かび上がる。
 */

export const FOUR_DIRECTIONAL_SENTENCES = [
  {
    id: 'about',
    directionX: -1,
    directionY: 1,
    headerLabel: 'ABOUT / PROFILE',
    mainSentence: 'Haruki Watarai — Data Scientist & Software Engineer',
    subSentence: '数理最適化・深層学習（PyTorch）と3D視覚表現の融合。仮説検証に基づくアルゴリズム設計と実装。',
  },
  {
    id: 'works',
    directionX: 1,
    directionY: 1,
    headerLabel: 'SELECTED WORKS',
    mainSentence: 'GaussianCV / Math LLM Post-Training / Scrollytelling UI',
    subSentence: '連続ガウス視覚基盤（C++/CUDA）、4B数理推論モデル事後学習（GRPO）、対話型数理シミュレータ。',
  },
  {
    id: 'skill',
    directionX: -1,
    directionY: -1,
    headerLabel: 'TECHNICAL STACK',
    mainSentence: 'Python · PyTorch · Rust · Vue 3 · Three.js · Tailwind CSS',
    subSentence: '機械学習・統計モデリング・高速ネイティブ計算からWebGLシェーダー実装まで一貫対応。',
  },
  {
    id: 'links',
    directionX: 1,
    directionY: -1,
    headerLabel: 'LINKS & CONTACT',
    mainSentence: 'GitHub / Kaggle / Zenn Tech Blog / Direct Contact',
    subSentence: 'OSSコードリポジトリ・コンペティション実績・技術解説記事・共同研究や開発のご相談。',
  },
]

/**
 * 文章プレートの表面に描画する高解像度タイポグラフィテクスチャを生成する。
 * 白地に「水色っぽい灰色」のシャープな文字と繊細な陰影を描画し、平面方向へ回り込んだ際に文章を浮かび上がらせる。
 */
export function createSentencePlaneTexture(sentenceConfig) {
  const canvasElement = document.createElement('canvas')
  canvasElement.width = 2048
  canvasElement.height = 512
  const ctx = canvasElement.getContext('2d')

  // 純白のベースプレート面
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasElement.width, canvasElement.height)

  // 上下の水色っぽい灰色のエッジライン（側面から平面へ回る際の立体境界）
  ctx.fillStyle = '#a3c1d4'
  ctx.fillRect(0, 0, canvasElement.width, 10)
  ctx.fillRect(0, canvasElement.height - 10, canvasElement.width, 10)

  // セクションラベル
  ctx.font = '700 42px "Space Grotesk", "Noto Sans JP", sans-serif'
  ctx.fillStyle = '#6d98b5'
  ctx.fillText(sentenceConfig.headerLabel, 96, 118)

  // メインの文章（側面から平面になったときに最も際立つ見出し文）
  ctx.shadowColor = 'rgba(148, 182, 204, 0.45)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetX = 4
  ctx.shadowOffsetY = 6
  ctx.font = '700 66px "Space Grotesk", "Noto Sans JP", sans-serif'
  ctx.fillStyle = '#243b4d'
  ctx.fillText(sentenceConfig.mainSentence, 96, 245)

  // 補足説明文（続く文章）
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.font = '500 44px "Noto Sans JP", "Space Grotesk", sans-serif'
  ctx.fillStyle = '#527891'
  ctx.fillText(sentenceConfig.subSentence, 96, 365)

  // 進行方向のくの字モチーフ刻印
  ctx.strokeStyle = '#8eb2c9'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(1920, 190)
  ctx.lineTo(1980, 256)
  ctx.lineTo(1920, 322)
  ctx.stroke()

  const texture = new THREE.CanvasTexture(canvasElement)
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

/**
 * 初期状態 (progress = 0) では球から伸びる「くの字の矢印（文章の側面）」の形をしており、
 * スライド (progress -> 1) に伴って「くの形になっていたところが平面に見える方向」へと回転・展開する
 * 3D文章リボン（厚みのある立体プレート＋側面の文字凹凸リブ）を生成する。
 */
export function createKuArrowSentenceRibbonGeometry(
  lengthSegments = 80,
  heightSegments = 8
) {
  const geometry = new THREE.BoxGeometry(1, 1, 1, lengthSegments, heightSegments, 2)

  // 各頂点の正規化ローカル座標 (u ∈ [0, 1]: 長さ方向, v ∈ [-0.5, 0.5]: 平面の高さ方向, w ∈ [-0.5, 0.5]: 側面の厚み方向) を保持
  const positionAttr = geometry.attributes.position
  const vertexCount = positionAttr.count
  const normalizedCoords = new Float32Array(vertexCount * 3)

  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    const rawX = positionAttr.getX(vertexIndex) // [-0.5, 0.5]
    const rawY = positionAttr.getY(vertexIndex) // [-0.5, 0.5]
    const rawZ = positionAttr.getZ(vertexIndex) // [-0.5, 0.5]

    normalizedCoords[vertexIndex * 3 + 0] = rawX + 0.5 // u ∈ [0, 1]
    normalizedCoords[vertexIndex * 3 + 1] = rawY       // v ∈ [-0.5, 0.5]
    normalizedCoords[vertexIndex * 3 + 2] = rawZ       // w ∈ [-0.5, 0.5]
  }

  geometry.userData.normalizedCoords = normalizedCoords
  return geometry
}

/**
 * リボンジオメトリの頂点群を現在のスライド進行度 revealProgress ∈ [0, 1] に応じて更新する。
 *
 * - revealProgress = 0 (初期状態):
 *   プレートの面法線が視線と直交（真横＝側面視）しており、画面上では球から斜めに伸びて「くの字」に折れ曲がる
 *   シャープな「くの字の矢印」の側面エッジだけが見える。
 * - revealProgress -> 1 (くの字の方向へスライドした状態):
 *   くの字に折れていた側面がカメラ正面の「平面」へと90°回り込みながら真っ直ぐに伸び、
 *   側面に並んでいた文章全体が平面として浮かび上がる。
 */
export function deformSentenceRibbonForProgress(
  geometry,
  directionX,
  directionY,
  revealProgress
) {
  const positionAttr = geometry.attributes.position
  const normalizedCoords = geometry.userData.normalizedCoords
  const vertexCount = positionAttr.count

  // 滑らかなエルミート補間
  const clampedProgress = Math.max(0, Math.min(1, revealProgress))
  const smoothProgress =
    clampedProgress * clampedProgress * (3 - 2 * clampedProgress)

  // 1. 「くの字」の側面状態 (progress = 0) における球からの起点・屈折点・先端座標
  // 球の半径 (R = 2.15) のすぐ外側から四方向へ伸びる
  const innerStartX = directionX * 1.65
  const innerStartY = directionY * 1.15

  // 「くの字」の屈折（エルボー）関節位置: 外へ広がってから内側へ折り返す明確な「く」の字
  const elbowRatio = 0.54
  const kuBendAmplitude = (1.0 - smoothProgress) * 0.72

  // 2. 平面展開状態 (progress = 1) における4象限の文章プレート中心座標
  const planeStartX = directionX < 0 ? -4.85 : 0.75
  const planeEndX = directionX < 0 ? -0.75 : 4.85
  const planeCenterY = directionY * 1.65

  // 側面視 (0 rad) から 平面正面視 (π/2 rad) への回転角
  const twistToFlatAngle = smoothProgress * (Math.PI * 0.5)
  const cosTwist = Math.cos(twistToFlatAngle)
  const sinTwist = Math.sin(twistToFlatAngle)

  // プレートの高さ（平面になったときの縦幅）と厚み（くの字側面として見える太さ）
  const platePlaneHeight = 0.92 + smoothProgress * 0.22
  const sideEdgeThickness = 0.11 * (1.0 - smoothProgress * 0.55)

  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    const uRatio = normalizedCoords[vertexIndex * 3 + 0] // [0, 1] 長さ方向
    const vCoord = normalizedCoords[vertexIndex * 3 + 1] // [-0.5, 0.5] 文章平面の高さ方向
    const wCoord = normalizedCoords[vertexIndex * 3 + 2] // [-0.5, 0.5] 側面の厚み方向

    // --- (A) 初期状態の「くの字」中心軸軌跡 ---
    // uRatio ∈ [0, elbowRatio] で外方へ伸び、uRatio ∈ [elbowRatio, 1] で「くの字」に屈折して矢印先端へ至る
    const radialReachX = innerStartX + directionX * (uRatio * 2.55)
    const radialReachY = innerStartY + directionY * (uRatio * 1.65)

    // 「くの字」特有の折れ曲がりオフセット（山型に屈折する折れ線）
    const tentFactor =
      uRatio <= elbowRatio
        ? uRatio / elbowRatio
        : (1.0 - uRatio) / (1.0 - elbowRatio)

    const kuArrowSpineX = radialReachX + directionX * tentFactor * 0.68
    const kuArrowSpineY = radialReachY - directionY * tentFactor * 0.52

    // --- (B) 回転後の「平面」中心軸軌跡（水平に整列した文章プレート） ---
    const flatPlaneSpineX = planeStartX + (planeEndX - planeStartX) * uRatio
    const flatPlaneSpineY = planeCenterY

    // スライドに伴う空間旋回（くの字方向へ回り込む視差軌道）
    const spineX =
      kuArrowSpineX + (flatPlaneSpineX - kuArrowSpineX) * smoothProgress
    const spineY =
      kuArrowSpineY + (flatPlaneSpineY - kuArrowSpineY) * smoothProgress

    // 空間回転中の奥行き弧（側面がカメラへ向かって手前に起き上がる立体視差）
    const orbitalArchZ =
      Math.sin(smoothProgress * Math.PI) *
      (0.85 * (uRatio - 0.35) * directionX * directionY) +
      (1.0 - smoothProgress) * (uRatio * -0.45)

    // 先端を矢印状にシャープに絞るテーパー係数（側面視のとき先端が鋭いくの字矢印になる）
    const tipTaper =
      uRatio > 0.86
        ? 1.0 - ((uRatio - 0.86) / 0.14) * (1.0 - smoothProgress) * 0.75
        : 1.0

    // 側面に並んでいる文字の微細な凹凸感（側面から見たときに「文章の側面である」質感を出す）
    const characterSideRipple =
      Math.sin(uRatio * 68.0) * 0.018 * (1.0 - smoothProgress)

    const localPlaneY = vCoord * platePlaneHeight
    const localThickness = (wCoord * sideEdgeThickness + characterSideRipple) * tipTaper

    // 初期状態 (twist = 0):
    //   localPlaneY（文章の上下幅）は Z軸（視線の奥行き方向）へ倒れており正面からは見えない（側面のみ見える）。
    //   localThickness（側面の厚み）が XY平面に現れ、「くの字の矢印」を描く。
    // 平面状態 (twist = π/2):
    //   localPlaneY が XY平面の縦方向へ起き上がり、文章が書かれた平面が正面に浮かび上がる。
    const offsetInScreenY =
      localPlaneY * sinTwist + localThickness * cosTwist * directionY
    const offsetInScreenX =
      -localThickness * cosTwist * directionX * 0.55
    const offsetInDepthZ =
      localPlaneY * cosTwist - localThickness * sinTwist

    positionAttr.setXYZ(
      vertexIndex,
      spineX + offsetInScreenX,
      spineY + offsetInScreenY,
      orbitalArchZ + offsetInDepthZ
    )
  }

  positionAttr.needsUpdate = true
  geometry.computeVertexNormals()
}
