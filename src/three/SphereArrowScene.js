import * as THREE from 'three'

/**
 * 線や模様を一切持たない純白・完全無装飾の滑らかな弾性球体用カスタムGLSLシェーダーマテリアル。
 * - 表面の線・グリッド・スリットを完全排除し、美しい無彩色のランバート拡散陰影のみで描画。
 * - ポインタで触れた際のバネ減衰振動（弾性変形）と法線動的再計算による陰影の波打ちを実装。
 */
function createPureSmoothElasticSphereMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uLightDirection: { value: new THREE.Vector3(-0.45, 0.72, 0.85).normalize() },
      uBaseWhiteColor: { value: new THREE.Color('#ffffff') },
      uNeutralShadeColor: { value: new THREE.Color('#b8b8b8') },
      uDeepShadeColor: { value: new THREE.Color('#4a4a4a') },
      uContactPoint: { value: new THREE.Vector3(0, 0, 1) },
      uElasticDisplacement: { value: 0.0 },
      uElasticVelocityWave: { value: 0.0 },
      uElasticStretchVec: { value: new THREE.Vector3(0, 0, 0) },
      uWaveTime: { value: 0.0 },
    },
    vertexShader: /* glsl */ `
      uniform vec3 uContactPoint;
      uniform float uElasticDisplacement;
      uniform float uElasticVelocityWave;
      uniform vec3 uElasticStretchVec;
      uniform float uWaveTime;

      varying vec3 vWorldNormal;
      varying vec3 vViewDirection;

      vec3 computeDeformedPosition(vec3 unitPos, float baseRadius) {
        vec3 contactDir = normalize(uContactPoint);
        float distToContact = distance(unitPos, contactDir);

        // 触れた地点を中心とするガウス弾性へこみ・引っ張り + 表面弾性リップル波
        float gaussianFalloff = exp(-distToContact * distToContact * 3.8);
        float rippleWave = cos(distToContact * 9.5 - uWaveTime * 12.0) * exp(-distToContact * 2.6);
        float localRadialOffset =
          uElasticDisplacement * gaussianFalloff +
          uElasticVelocityWave * rippleWave * 0.15;

        // 球全体の体積保存型スクワッシュ＆ストレッチ
        float stretchLen = length(uElasticStretchVec);
        float stretchProjection = 0.0;
        if (stretchLen > 0.0001) {
          vec3 stretchDir = uElasticStretchVec / stretchLen;
          float cosTheta = dot(unitPos, stretchDir);
          stretchProjection = stretchLen * (1.5 * cosTheta * cosTheta - 0.5);
        }

        float finalRadius = baseRadius + localRadialOffset + stretchProjection;
        return unitPos * finalRadius;
      }

      void main() {
        float baseRadius = length(position);
        vec3 unitPos = normalize(position);

        vec3 deformedPos = computeDeformedPosition(unitPos, baseRadius);

        // 接平面差分から変形後の正確な法線を解析的に算出
        vec3 arbitraryAxis = abs(unitPos.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
        vec3 tangentU = normalize(cross(arbitraryAxis, unitPos));
        vec3 tangentV = normalize(cross(unitPos, tangentU));
        float eps = 0.015;

        vec3 neighborU = computeDeformedPosition(normalize(unitPos + tangentU * eps), baseRadius);
        vec3 neighborV = computeDeformedPosition(normalize(unitPos + tangentV * eps), baseRadius);
        vec3 perturbedNormal = normalize(cross(neighborU - deformedPos, neighborV - deformedPos));

        vec4 worldPosition = modelMatrix * vec4(deformedPos, 1.0);
        vWorldNormal = normalize(mat3(modelMatrix) * perturbedNormal);
        vViewDirection = normalize(cameraPosition - worldPosition.xyz);

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uLightDirection;
      uniform vec3 uBaseWhiteColor;
      uniform vec3 uNeutralShadeColor;
      uniform vec3 uDeepShadeColor;

      varying vec3 vWorldNormal;
      varying vec3 vViewDirection;

      void main() {
        vec3 normalVec = normalize(vWorldNormal);

        // 線や模様のない、滑らかなモノクロームのランバート陰影
        float diffuseTerm = dot(normalVec, uLightDirection) * 0.5 + 0.5;
        float smoothLight = smoothstep(0.14, 0.86, diffuseTerm);

        vec3 shadedColor = mix(
          uDeepShadeColor,
          uNeutralShadeColor,
          smoothstep(0.0, 0.5, diffuseTerm)
        );
        vec3 surfaceColor = mix(shadedColor, uBaseWhiteColor, smoothLight);

        gl_FragColor = vec4(surfaceColor, 1.0);
      }
    `,
  })
}

export class SphereArrowScene {
  constructor(canvasElement) {
    this.canvasElement = canvasElement
    this.animationFrameId = null

    // 回転制御（クォータニオンによる3Dトラックボール回転と慣性減衰）
    this.angularVelocity = new THREE.Vector2(0, 0)
    this.isDraggingRotation = false

    // サイズ調整制御
    this.currentScale = 1.0
    this.targetScale = 1.0

    // 球体の弾性シミュレーション状態
    this.raycaster = new THREE.Raycaster()
    this.pointerNdc = new THREE.Vector2(-99, -99)
    this.lastContactPoint = new THREE.Vector3(0, 0, 1)

    this.elasticDisplacement = 0.0
    this.elasticVelocity = 0.0
    this.targetElasticDisplacement = 0.0

    this.elasticStretchVec = new THREE.Vector3(0, 0, 0)
    this.elasticStretchVel = new THREE.Vector3(0, 0, 0)
    this.targetElasticStretchVec = new THREE.Vector3(0, 0, 0)

    this.disposableGeometries = []
    this.disposableMaterials = []

    this.initScene()
    this.initSphereOnly()
    this.bindResizeListener()
    this.startRenderLoop()
  }

  initScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#000000')

    const aspectRatio = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(40, aspectRatio, 0.1, 100)
    this.updateCameraForAspect(aspectRatio)

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasElement,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  updateCameraForAspect(aspectRatio) {
    const cameraZ = aspectRatio < 0.85 ? 9.0 : aspectRatio < 1.25 ? 7.6 : 6.8
    this.camera.position.set(0, 0, cameraZ)
    this.camera.lookAt(0, 0, 0)
  }

  initSphereOnly() {
    // 影や線などの装飾は一切排し、ただの純白の滑らかな球体のみを配置
    const baseSphereRadius = 1.68
    const sphereGeo = new THREE.SphereGeometry(baseSphereRadius, 128, 128)
    this.sphereMaterial = createPureSmoothElasticSphereMaterial()
    this.centralSphereMesh = new THREE.Mesh(sphereGeo, this.sphereMaterial)
    this.scene.add(this.centralSphereMesh)

    this.disposableGeometries.push(sphereGeo)
    this.disposableMaterials.push(this.sphereMaterial)
  }

  /**
   * 球体のサイズ倍率を設定する（0.3x 〜 2.5x）
   */
  setSphereScale(scaleMultiplier) {
    this.targetScale = Math.max(0.3, Math.min(2.5, scaleMultiplier))
  }

  /**
   * ポインタドラッグ量に応じて球体を3次元回転させる（角速度の蓄積）
   */
  rotateSphere(deltaPixelX, deltaPixelY) {
    const rotationSensitivity = 0.0055
    const deltaRotY = deltaPixelX * rotationSensitivity
    const deltaRotX = deltaPixelY * rotationSensitivity

    const quatY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaRotY)
    const quatX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), deltaRotX)

    this.centralSphereMesh.quaternion.premultiply(quatY)
    this.centralSphereMesh.quaternion.premultiply(quatX)

    this.angularVelocity.x = deltaRotX
    this.angularVelocity.y = deltaRotY
  }

  /**
   * ポインタ（マウス/タッチ）が球体に触れたか判定し、弾性インパルスを与える
   */
  handlePointerInteraction(clientX, clientY, isPressed = false, movementX = 0, movementY = 0) {
    this.pointerNdc.x = (clientX / window.innerWidth) * 2 - 1
    this.pointerNdc.y = -(clientY / window.innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.pointerNdc, this.camera)
    const intersections = this.raycaster.intersectObject(this.centralSphereMesh, false)

    if (intersections.length === 0) {
      if (!isPressed) {
        this.targetElasticDisplacement = 0.0
        this.targetElasticStretchVec.set(0, 0, 0)
      }
      return false
    }

    const hitPointWorld = intersections[0].point
    const hitPointLocal = this.centralSphereMesh.worldToLocal(hitPointWorld.clone()).normalize()
    this.lastContactPoint.copy(hitPointLocal)

    const moveSpeed = Math.min(Math.hypot(movementX, movementY), 48)
    if (isPressed) {
      this.targetElasticDisplacement = -0.32
      this.elasticVelocity -= 0.08
      this.targetElasticStretchVec.set(
        (movementX / window.innerWidth) * 2.2,
        -(movementY / window.innerHeight) * 2.2,
        -0.12
      )
    } else {
      this.targetElasticDisplacement = -0.14 - moveSpeed * 0.004
      this.elasticVelocity -= moveSpeed * 0.012
      this.targetElasticStretchVec.set(
        (movementX / window.innerWidth) * 1.35,
        -(movementY / window.innerHeight) * 1.35,
        0.0
      )
    }

    return true
  }

  triggerSphereReleaseBounce() {
    this.targetElasticDisplacement = 0.0
    this.targetElasticStretchVec.set(0, 0, 0)
    this.elasticVelocity += 1.65
  }

  stepPhysicsAndInertia(deltaTimeSeconds, elapsedSeconds) {
    const dt = Math.min(deltaTimeSeconds, 0.033)

    // 1. スケール変更の滑らかな補間追従
    this.currentScale += (this.targetScale - this.currentScale) * 0.15
    this.centralSphereMesh.scale.setScalar(this.currentScale)

    // 2. 回転の慣性減衰
    if (!this.isDraggingRotation && this.angularVelocity.lengthSq() > 0.000001) {
      const quatY = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.angularVelocity.y
      )
      const quatX = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        this.angularVelocity.x
      )
      this.centralSphereMesh.quaternion.premultiply(quatY)
      this.centralSphereMesh.quaternion.premultiply(quatX)

      this.angularVelocity.multiplyScalar(0.93)
    }

    // 3. 弾性変形の減衰バネ振動
    const springStiffness = 145.0
    const dampingCoefficient = 6.5

    const displacementError = this.elasticDisplacement - this.targetElasticDisplacement
    const springForce =
      -springStiffness * displacementError - dampingCoefficient * this.elasticVelocity
    this.elasticVelocity += springForce * dt
    this.elasticDisplacement += this.elasticVelocity * dt

    const stretchError = new THREE.Vector3().subVectors(
      this.elasticStretchVec,
      this.targetElasticStretchVec
    )
    const stretchForce = stretchError
      .multiplyScalar(-springStiffness * 0.85)
      .addScaledVector(this.elasticStretchVel, -dampingCoefficient)
    this.elasticStretchVel.addScaledVector(stretchForce, dt)
    this.elasticStretchVec.addScaledVector(this.elasticStretchVel, dt)

    this.sphereMaterial.uniforms.uContactPoint.value.lerp(this.lastContactPoint, 0.28)
    this.sphereMaterial.uniforms.uElasticDisplacement.value = this.elasticDisplacement
    this.sphereMaterial.uniforms.uElasticVelocityWave.value = this.elasticVelocity
    this.sphereMaterial.uniforms.uElasticStretchVec.value.copy(this.elasticStretchVec)
    this.sphereMaterial.uniforms.uWaveTime.value = elapsedSeconds
  }

  startRenderLoop() {
    const clock = new THREE.Clock()
    let lastTime = 0

    const renderTick = () => {
      this.animationFrameId = requestAnimationFrame(renderTick)

      const elapsedSeconds = clock.getElapsedTime()
      const deltaTimeSeconds = elapsedSeconds - lastTime
      lastTime = elapsedSeconds

      this.stepPhysicsAndInertia(deltaTimeSeconds, elapsedSeconds)
      this.renderer.render(this.scene, this.camera)
    }

    renderTick()
  }

  bindResizeListener() {
    this.handleWindowResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const aspect = width / height

      this.camera.aspect = aspect
      this.updateCameraForAspect(aspect)
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(width, height)
    }

    window.addEventListener('resize', this.handleWindowResize)
  }

  dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    if (this.handleWindowResize) {
      window.removeEventListener('resize', this.handleWindowResize)
    }

    this.disposableGeometries.forEach((geometry) => geometry.dispose())
    this.disposableMaterials.forEach((material) => material.dispose())
    this.renderer.dispose()
  }
}
