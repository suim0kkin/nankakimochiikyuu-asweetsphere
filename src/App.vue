<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { SphereArrowScene } from './three/SphereArrowScene.js'

const threeCanvasRef = ref(null)
let sphereSceneInstance = null

// 球体のサイズ倍率 (0.4x 〜 2.2x, デフォルト 1.0x)
const sphereScaleMultiplier = ref(1.0)

watch(sphereScaleMultiplier, (newScale) => {
  if (sphereSceneInstance) {
    sphereSceneInstance.setSphereScale(newScale)
  }
})

let isPointerDown = false
let previousPointerX = 0
let previousPointerY = 0

function handlePointerDown(event) {
  if (event.target.closest('input, button')) {
    return
  }

  isPointerDown = true
  previousPointerX = event.clientX
  previousPointerY = event.clientY

  if (sphereSceneInstance) {
    sphereSceneInstance.isDraggingRotation = true
    sphereSceneInstance.handlePointerInteraction(
      event.clientX,
      event.clientY,
      true,
      0,
      0
    )
  }
}

function handlePointerMove(event) {
  const movementX = event.clientX - previousPointerX
  const movementY = event.clientY - previousPointerY
  previousPointerX = event.clientX
  previousPointerY = event.clientY

  if (sphereSceneInstance) {
    sphereSceneInstance.handlePointerInteraction(
      event.clientX,
      event.clientY,
      isPointerDown,
      movementX,
      movementY
    )

    if (isPointerDown) {
      sphereSceneInstance.rotateSphere(movementX, movementY)
    }
  }
}

function handlePointerUp() {
  if (isPointerDown && sphereSceneInstance) {
    sphereSceneInstance.isDraggingRotation = false
    sphereSceneInstance.triggerSphereReleaseBounce()
  }
  isPointerDown = false
}

let touchPrevX = 0
let touchPrevY = 0
let touchStartDistance = 0
let touchStartScale = 1.0

function handleTouchStart(event) {
  if (event.target.closest('input, button')) {
    return
  }

  if (event.touches.length === 2) {
    // 2本指ピンチによるサイズ調整
    const touchA = event.touches[0]
    const touchB = event.touches[1]
    touchStartDistance = Math.hypot(touchA.clientX - touchB.clientX, touchA.clientY - touchB.clientY)
    touchStartScale = sphereScaleMultiplier.value
    return
  }

  if (event.touches.length !== 1) {
    return
  }

  const touch = event.touches[0]
  touchPrevX = touch.clientX
  touchPrevY = touch.clientY

  if (sphereSceneInstance) {
    sphereSceneInstance.isDraggingRotation = true
    sphereSceneInstance.handlePointerInteraction(
      touch.clientX,
      touch.clientY,
      true,
      0,
      0
    )
  }
}

function handleTouchMove(event) {
  if (event.touches.length === 2 && touchStartDistance > 0) {
    const touchA = event.touches[0]
    const touchB = event.touches[1]
    const currentDistance = Math.hypot(touchA.clientX - touchB.clientX, touchA.clientY - touchB.clientY)
    const pinchRatio = currentDistance / touchStartDistance
    const updatedScale = Math.max(0.4, Math.min(2.2, touchStartScale * pinchRatio))
    sphereScaleMultiplier.value = Number(updatedScale.toFixed(2))
    return
  }

  if (event.touches.length !== 1) {
    return
  }

  const touch = event.touches[0]
  const moveX = touch.clientX - touchPrevX
  const moveY = touch.clientY - touchPrevY
  touchPrevX = touch.clientX
  touchPrevY = touch.clientY

  if (sphereSceneInstance) {
    sphereSceneInstance.handlePointerInteraction(
      touch.clientX,
      touch.clientY,
      true,
      moveX,
      moveY
    )
    sphereSceneInstance.rotateSphere(moveX, moveY)
  }
}

function handleTouchEnd(event) {
  if (event.touches.length < 2) {
    touchStartDistance = 0
  }
  if (sphereSceneInstance && event.touches.length === 0) {
    sphereSceneInstance.isDraggingRotation = false
    sphereSceneInstance.triggerSphereReleaseBounce()
  }
}

function handleWheel(event) {
  // スクロール操作で球体のサイズを直感的に伸縮
  const zoomFactor = event.deltaY > 0 ? 0.95 : 1.05
  const nextScale = Math.max(0.4, Math.min(2.2, sphereScaleMultiplier.value * zoomFactor))
  sphereScaleMultiplier.value = Number(nextScale.toFixed(2))
}

function resetSphereScale() {
  sphereScaleMultiplier.value = 1.0
}

onMounted(() => {
  if (threeCanvasRef.value) {
    sphereSceneInstance = new SphereArrowScene(threeCanvasRef.value)
    sphereSceneInstance.setSphereScale(sphereScaleMultiplier.value)
  }

  window.addEventListener('pointerdown', handlePointerDown)
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
  window.addEventListener('touchstart', handleTouchStart, { passive: true })
  window.addEventListener('touchmove', handleTouchMove, { passive: true })
  window.addEventListener('touchend', handleTouchEnd, { passive: true })
  window.addEventListener('wheel', handleWheel, { passive: true })
})

onBeforeUnmount(() => {
  if (sphereSceneInstance) {
    sphereSceneInstance.dispose()
  }
  window.removeEventListener('pointerdown', handlePointerDown)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
  window.removeEventListener('touchstart', handleTouchStart)
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('touchend', handleTouchEnd)
  window.removeEventListener('wheel', handleWheel)
})
</script>

<template>
  <div class="relative min-h-screen w-full overflow-hidden bg-black select-none cursor-grab active:cursor-grabbing">
    <!-- 純白・無装飾の滑らかな弾性球体のみを描画するキャンバス -->
    <canvas
      ref="threeCanvasRef"
      class="fixed inset-0 h-full w-full"
    ></canvas>

    <!-- ミニマルな球体サイズコントローラー (マウスホイール/ピンチ、またはスライダーで調整可能) -->
    <div class="fixed bottom-6 inset-x-0 z-20 flex justify-center px-4 pointer-events-none">
      <div
        class="pointer-events-auto flex items-center gap-3.5 rounded-full border border-neutral-800 bg-neutral-950/85 px-4 py-2 backdrop-blur-md shadow-lg"
      >
        <span class="text-[11px] font-mono tracking-wider text-neutral-400">
          SIZE
        </span>
        <input
          v-model.number="sphereScaleMultiplier"
          type="range"
          min="0.4"
          max="2.2"
          step="0.05"
          aria-label="球体のサイズ調整"
          class="h-1.5 w-32 cursor-pointer appearance-none rounded-full bg-neutral-800 accent-neutral-300 transition"
        />
        <span class="w-10 text-right font-mono text-xs text-neutral-300">
          {{ sphereScaleMultiplier.toFixed(2) }}x
        </span>
        <button
          type="button"
          class="rounded-full px-2 py-0.5 text-[10px] font-medium text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
          @click="resetSphereScale"
        >
          RESET
        </button>
      </div>
    </div>
  </div>
</template>
