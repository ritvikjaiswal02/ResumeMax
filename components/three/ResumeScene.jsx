'use client'

import { useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

export const KEYWORDS = ['Docker', 'TypeScript', 'AWS', 'CI/CD', 'GraphQL', 'Kubernetes']
export const BASE_SCORE = 42
const PER_KEYWORD = 8
const REWRITE_BONUS = 4
export const MAX_SCORE = BASE_SCORE + KEYWORDS.length * PER_KEYWORD + REWRITE_BONUS

const PW = 2.5
const PH = 3.27
const CW = 1024
const CH = Math.round((CW * PH) / PW)
const FACE_Z = 0.062
const FALLBACK_FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
let FONT = FALLBACK_FONT
const COL = {
  ink: '#0D0F0E',
  paper: '#FFFFFF',
  sub: '#646A66',
  muted: '#E4E7E2',
  soft: '#EFF2EE',
  label: '#8C928E',
  bar: '#D9DDD7',
  slot: '#C8CEC7',
  red: '#F04438',
  amber: '#F5A524',
  go: '#12B76A',
  goDeep: '#065F3B',
  highlight: '#D9F6E6',
  peach: '#FFD3B5',
  blush: '#FF8FA3',
}
const AVATAR = { x: 190, y: 190, r: 110 }
const SLOT = { x0: 80, y0: 930, w: 270, h: 76, gx: 287, gy: 96 }
const CHIP_W = (SLOT.w / CW) * PW
const CHIP_H = (SLOT.h / CH) * PH
const ORBIT_SCALE = 1.25
const ORBIT_Y = [1.2, 0.3, -0.6, 0.8, -0.2, -1.15]
const WEAK = [1, 3]
const TAU = Math.PI * 2

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const lerp = (a, b, t) => a + (b - a) * t
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2)
const toPlane = (px, py) => new THREE.Vector3((px / CW - 0.5) * PW, (0.5 - py / CH) * PH, 0)

function hexMix(a, b, t) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const r = Math.round(lerp(pa >> 16, pb >> 16, t))
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t))
  const bl = Math.round(lerp(pa & 255, pb & 255, t))
  return `rgb(${r},${g},${bl})`
}

export function scoreColor(score) {
  const t = clamp((score - BASE_SCORE) / (MAX_SCORE - BASE_SCORE), 0, 1)
  return t < 0.5 ? hexMix(COL.red, COL.amber, t * 2) : hexMix(COL.amber, COL.go, (t - 0.5) * 2)
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function roundedShape(w, h, r) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d') }
}

function makeTexture(canvas, renderer) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
  return tex
}

const slotCenterPx = (i) => ({
  x: SLOT.x0 + SLOT.w / 2 + (i % 3) * SLOT.gx,
  y: SLOT.y0 + SLOT.h / 2 + Math.floor(i / 3) * SLOT.gy,
})

function drawResume(ctx, rw) {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = COL.paper
  ctx.fillRect(0, 0, CW, CH)

  ctx.fillStyle = COL.peach
  ctx.beginPath()
  ctx.arc(AVATAR.x, AVATAR.y, AVATAR.r, 0, TAU)
  ctx.fill()

  ctx.fillStyle = COL.ink
  ctx.font = `800 58px ${FONT}`
  ctx.fillText('Aditi Sharma', 340, 168)
  ctx.fillStyle = COL.sub
  ctx.font = `500 30px ${FONT}`
  ctx.fillText('B.Tech CSE, final year', 340, 216)
  ctx.fillStyle = COL.muted
  ;[[340, 150], [506, 190], [712, 120]].forEach(([x, w]) => { rr(ctx, x, 248, w, 16, 8); ctx.fill() })

  ctx.fillStyle = COL.soft
  ctx.fillRect(80, 336, CW - 160, 3)

  const label = (text, y) => {
    ctx.fillStyle = COL.label
    ctx.font = `700 28px ${FONT}`
    ctx.fillText(text, 80, y)
  }

  label('Experience', 398)
  const widths = [0.86, 0.7, 0.78, 0.62, 0.74, 0.52]
  widths.forEach((w, i) => {
    const y = 436 + i * 54
    const weak = WEAK.includes(i)
    const maxW = CW - 160 - 40 - (weak ? 160 : 0)
    if (weak) {
      const barW = maxW * Math.min(1, w * (1 + 0.25 * rw))
      ctx.globalAlpha = 0.1 * (1 - rw)
      ctx.fillStyle = COL.red
      rr(ctx, 96, y - 14, CW - 176, 46, 14)
      ctx.fill()
      ctx.globalAlpha = 1
      if (rw > 0) {
        ctx.fillStyle = COL.highlight
        rr(ctx, 108, y - 10, (barW + 28) * rw, 38, 6)
        ctx.fill()
      }
      const c = hexMix(COL.red, COL.ink, rw)
      ctx.fillStyle = c
      rr(ctx, 120, y, barW, 18, 9)
      ctx.fill()
      if (rw < 1) {
        ctx.globalAlpha = 1 - rw
        ctx.strokeStyle = COL.red
        ctx.lineWidth = 4
        ctx.beginPath()
        for (let x = 120; x <= 120 + barW; x += 4) {
          const yy = y + 30 + Math.sin((x - 120) / 9) * 4
          if (x === 120) ctx.moveTo(x, yy)
          else ctx.lineTo(x, yy)
        }
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      ctx.fillStyle = rw < 0.5 ? COL.red : COL.highlight
      rr(ctx, CW - 92 - 136, y - 8, 136, 34, 17)
      ctx.fill()
      ctx.fillStyle = rw < 0.5 ? '#fff' : COL.goDeep
      ctx.font = `700 21px ${FONT}`
      ctx.textAlign = 'center'
      ctx.fillText(rw < 0.5 ? 'weak' : 'rewritten', CW - 92 - 68, y + 16)
      ctx.textAlign = 'left'
      ctx.fillStyle = c
    } else {
      ctx.fillStyle = COL.bar
      rr(ctx, 120, y, maxW * w, 18, 9)
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(98, y + 9, 5, 0, TAU)
    ctx.fill()
  })

  label('Education', 788)
  ctx.fillStyle = COL.slot
  rr(ctx, 80, 812, 470, 18, 9)
  ctx.fill()
  ctx.fillStyle = COL.muted
  rr(ctx, 80, 846, 320, 16, 8)
  ctx.fill()

  label('Skills', 908)
  for (let i = 0; i < 6; i++) {
    const x = SLOT.x0 + (i % 3) * SLOT.gx
    const y = SLOT.y0 + Math.floor(i / 3) * SLOT.gy
    ctx.setLineDash([10, 8])
    ctx.lineWidth = 3
    ctx.strokeStyle = COL.slot
    rr(ctx, x, y, SLOT.w, SLOT.h, SLOT.h / 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = COL.slot
    ctx.font = `600 34px ${FONT}`
    ctx.textAlign = 'center'
    ctx.fillText('+', x + SLOT.w / 2, y + SLOT.h / 2 + 12)
    ctx.textAlign = 'left'
  }

  ctx.fillStyle = COL.soft
  ctx.fillRect(80, 1150, CW - 160, 3)
  ctx.fillStyle = COL.muted
  rr(ctx, 80, 1186, 300, 14, 7)
  ctx.fill()
  rr(ctx, 80, 1216, 220, 14, 7)
  ctx.fill()

  ctx.textAlign = 'right'
  ctx.fillStyle = COL.slot
  ctx.font = `600 22px ${FONT}`
  ctx.fillText('checked with ResumeMax', CW - 80, 1290)
  ctx.textAlign = 'left'
}

function drawBack(ctx, w, h) {
  ctx.fillStyle = COL.paper
  ctx.fillRect(0, 0, w, h)
  ctx.textAlign = 'center'
  ctx.fillStyle = COL.ink
  ctx.font = `800 46px ${FONT}`
  ctx.fillText('psst…', w / 2, h / 2 - 20)
  ctx.font = `600 32px ${FONT}`
  ctx.fillStyle = COL.sub
  ctx.fillText('wrong side, flip me back', w / 2, h / 2 + 30)
  ctx.fillStyle = COL.go
  ctx.font = `800 26px ${FONT}`
  ctx.fillText('ResumeMax', w / 2, h - 60)
}

function drawGauge(ctx, w, h, score) {
  ctx.clearRect(0, 0, w, h)
  ctx.textAlign = 'center'
  ctx.fillStyle = COL.ink
  ctx.font = `600 116px ${FONT}`
  ctx.fillText(String(score), w / 2, 120)
  ctx.fillStyle = COL.label
  ctx.font = `500 24px ${FONT}`
  ctx.fillText('ATS score', w / 2, 170)
}

function drawChip(ctx, w, h, text, done) {
  ctx.clearRect(0, 0, w, h)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.font = `700 56px ${FONT}`
  ctx.fillText(`${done ? '✓' : '+'}  ${text}`, w / 2, h / 2 + 3)
}

export default function ResumeScene({ onScore, controls }) {
  const mountRef = useRef(null)
  const apiRef = useRef({})
  const onScoreRef = useRef(onScore)
  onScoreRef.current = onScore

  useImperativeHandle(controls, () => ({
    optimize: () => apiRef.current.optimize?.(),
    reset: () => apiRef.current.reset?.(),
  }))

  useEffect(() => {
    const mount = mountRef.current
    const brandFont = getComputedStyle(mount).getPropertyValue('--font-onest').trim()
    if (brandFont) FONT = `${brandFont}, ${FALLBACK_FONT}`
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = 1
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.touchAction = 'none'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTex
    scene.environmentIntensity = 0.35

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.set(0, 0.3, 11.5)

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9f6e6, 0.6))
    const key = new THREE.DirectionalLight(0xffffff, 1.2)
    key.position.set(3, 5, 6)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xffd2b8, 0.8)
    rim.position.set(-5, 2, -4)
    scene.add(rim)

    // ── blob shadow ──
    const { canvas: shCanvas, ctx: shCtx } = makeCanvas(256, 128)
    const grad = shCtx.createRadialGradient(128, 64, 0, 128, 64, 128)
    grad.addColorStop(0, 'rgba(6,60,38,0.32)')
    grad.addColorStop(1, 'rgba(6,60,38,0)')
    shCtx.save()
    shCtx.scale(1, 0.5)
    shCtx.translate(0, 64)
    shCtx.fillStyle = grad
    shCtx.fillRect(0, -64, 256, 256)
    shCtx.restore()
    const shadowTex = makeTexture(shCanvas, renderer)
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.4),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = -2.35
    scene.add(shadow)

    // ── resume character ──
    const rig = new THREE.Group()
    scene.add(rig)
    const paper = new THREE.Group()
    rig.add(paper)

    const paperGeo = new THREE.ExtrudeGeometry(roundedShape(PW + 0.04, PH + 0.04, 0.12), {
      depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 12,
    })
    paperGeo.center()
    const paperBody = new THREE.Mesh(paperGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }))
    paper.add(paperBody)

    const { canvas: faceCanvas, ctx: faceCtx } = makeCanvas(CW, CH)
    drawResume(faceCtx, 0)
    const faceTex = makeTexture(faceCanvas, renderer)
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(PW, PH),
      new THREE.MeshBasicMaterial({ map: faceTex, toneMapped: false })
    )
    face.position.z = FACE_Z
    paper.add(face)

    const { canvas: backCanvas, ctx: backCtx } = makeCanvas(512, 670)
    drawBack(backCtx, 512, 670)
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(PW, PH),
      new THREE.MeshBasicMaterial({ map: makeTexture(backCanvas, renderer), toneMapped: false })
    )
    back.rotation.y = Math.PI
    back.position.z = -FACE_Z
    paper.add(back)

    // face on the avatar
    const ac = toPlane(AVATAR.x, AVATAR.y)
    const avatarR = (AVATAR.r / CW) * PW
    const head = new THREE.Group()
    head.position.set(ac.x, ac.y, 0)
    paper.add(head)
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(avatarR, avatarR, 0.02, 48),
      new THREE.MeshStandardMaterial({ color: COL.peach, roughness: 0.7 })
    )
    disc.rotation.x = Math.PI / 2
    disc.position.z = FACE_Z + 0.01
    head.add(disc)

    const inkMat = new THREE.MeshStandardMaterial({ color: COL.ink, roughness: 0.25 })
    const eyes = new THREE.Group()
    eyes.position.z = 0.085
    head.add(eyes)
    const eyeGeo = new THREE.SphereGeometry(0.05, 24, 16)
    const glintGeo = new THREE.SphereGeometry(0.015, 12, 8)
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const eyeMeshes = [-1, 1].map((side) => {
      const eye = new THREE.Mesh(eyeGeo, inkMat)
      eye.position.set(side * 0.095, 0.05, 0)
      eye.scale.z = 0.55
      const glint = new THREE.Mesh(glintGeo, glintMat)
      glint.position.set(0.017, 0.02, 0.045)
      eye.add(glint)
      eyes.add(eye)
      return eye
    })
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.017, 12, 40, Math.PI), inkMat)
    mouth.rotation.z = Math.PI
    mouth.position.z = 0.085
    head.add(mouth)
    const cheekMat = new THREE.MeshBasicMaterial({ color: COL.blush, transparent: true, opacity: 0 })
    ;[-1, 1].forEach((side) => {
      const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.042, 24), cheekMat)
      cheek.position.set(side * 0.165, -0.045, 0.0835)
      head.add(cheek)
    })

    // scanner
    const scanner = new THREE.Group()
    scanner.visible = false
    scanner.position.z = FACE_Z + 0.03
    paper.add(scanner)
    scanner.add(new THREE.Mesh(
      new THREE.PlaneGeometry(PW + 0.16, 0.028),
      new THREE.MeshBasicMaterial({ color: COL.go, toneMapped: false })
    ))
    const { canvas: glowCanvas, ctx: glowCtx } = makeCanvas(4, 128)
    const glowGrad = glowCtx.createLinearGradient(0, 0, 0, 128)
    glowGrad.addColorStop(0, 'rgba(18,183,106,0)')
    glowGrad.addColorStop(1, 'rgba(18,183,106,0.22)')
    glowCtx.fillStyle = glowGrad
    glowCtx.fillRect(0, 0, 4, 128)
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(PW + 0.16, 0.7),
      new THREE.MeshBasicMaterial({ map: makeTexture(glowCanvas, renderer), transparent: true, depthWrite: false, toneMapped: false })
    )
    glow.position.y = 0.35
    scanner.add(glow)

    // skill slots
    const slots = KEYWORDS.map((_, i) => {
      const p = slotCenterPx(i)
      const o = new THREE.Object3D()
      o.position.copy(toPlane(p.x, p.y)).setZ(FACE_Z + 0.03)
      paper.add(o)
      return o
    })

    // ── score gauge ──
    const gauge = new THREE.Group()
    scene.add(gauge)
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.14, 72),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
    )
    coin.rotation.x = Math.PI / 2
    gauge.add(coin)
    const track = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.045, 16, 120),
      new THREE.MeshStandardMaterial({ color: COL.soft, roughness: 0.6 })
    )
    track.position.z = 0.075
    gauge.add(track)
    const progMat = new THREE.MeshStandardMaterial({ color: COL.red, roughness: 0.3 })
    const prog = new THREE.Mesh(new THREE.BufferGeometry(), progMat)
    prog.position.z = 0.085
    prog.rotation.z = Math.PI / 2
    prog.scale.x = -1
    gauge.add(prog)
    const { canvas: gCanvas, ctx: gCtx } = makeCanvas(320, 200)
    const gTex = makeTexture(gCanvas, renderer)
    const gLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.88, 0.55),
      new THREE.MeshBasicMaterial({ map: gTex, transparent: true })
    )
    gLabel.position.set(0, -0.02, 0.08)
    gauge.add(gLabel)

    const setGauge = (score) => {
      const f = clamp(score / 100, 0.001, 1)
      prog.geometry.dispose()
      prog.geometry = new THREE.TorusGeometry(0.6, 0.06, 16, Math.max(3, Math.round(120 * f)), f * TAU)
      progMat.color.set(scoreColor(score))
      drawGauge(gCtx, 320, 200, score)
      gTex.needsUpdate = true
    }

    // ── keyword chips ──
    const chipGeo = new THREE.ExtrudeGeometry(roundedShape(CHIP_W, CHIP_H, CHIP_H / 2 - 0.001), {
      depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 16,
    })
    chipGeo.center()
    const chipLabelGeo = new THREE.PlaneGeometry(CHIP_W, CHIP_H)
    const redColor = new THREE.Color(COL.red)
    const greenColor = new THREE.Color(COL.go)

    const chips = KEYWORDS.map((kw, i) => {
      const group = new THREE.Group()
      const mat = new THREE.MeshStandardMaterial({ color: COL.red, roughness: 0.4, emissive: COL.red, emissiveIntensity: 0.18 })
      const body = new THREE.Mesh(chipGeo, mat)
      body.userData.chip = i
      group.add(body)
      const { canvas, ctx } = makeCanvas(512, 144)
      drawChip(ctx, 512, 144, kw, false)
      const tex = makeTexture(canvas, renderer)
      const label = new THREE.Mesh(chipLabelGeo, new THREE.MeshBasicMaterial({ map: tex, transparent: true }))
      label.position.z = 0.031
      group.add(label)
      group.scale.setScalar(ORBIT_SCALE)
      scene.add(group)
      return {
        i, kw, group, body, mat, ctx, tex,
        mode: 'orbit', t: 0, slot: -1, hover: 0, colorT: 0, labelDone: false, undockOnArrive: false,
        from: new THREE.Vector3(), fromQ: new THREE.Quaternion(), fromS: ORBIT_SCALE,
      }
    })
    const chipBodies = chips.map((c) => c.body)

    // ── confetti ──
    const CONFETTI = 180
    const confetti = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.07, 0.12),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }),
      CONFETTI
    )
    confetti.frustumCulled = false
    confetti.visible = false
    const palette = [COL.go, '#F2B705', '#FF7A45', '#8B5CF6', '#EC4899', '#FFFFFF'].map((c) => new THREE.Color(c))
    const parts = Array.from({ length: CONFETTI }, (_, i) => {
      confetti.setColorAt(i, palette[i % palette.length])
      return { p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), rv: new THREE.Vector3() }
    })
    scene.add(confetti)
    let confettiT = -1

    const burst = () => {
      const origin = new THREE.Vector3()
      paper.getWorldPosition(origin)
      parts.forEach((pt) => {
        pt.p.set(origin.x + (Math.random() - 0.5) * 1.6, origin.y + 1.4, origin.z + 0.4)
        pt.v.set((Math.random() - 0.5) * 6, 3.5 + Math.random() * 4.5, (Math.random() - 0.2) * 3)
        pt.r.set(Math.random() * TAU, Math.random() * TAU, Math.random() * TAU)
        pt.rv.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14)
      })
      confettiT = 0
      confetti.visible = true
    }

    // ── state ──
    const layout = { paperX: -0.45, gaugePos: new THREE.Vector3(1.95, 1.3, 0.9), gaugeScale: 1, orbitRX: 2.15 }
    const pointer = new THREE.Vector2()
    const smoothPointer = new THREE.Vector2()
    const ndc = new THREE.Vector2(9, 9)
    const raycaster = new THREE.Raycaster()
    const tmpV = new THREE.Vector3()
    const tmpQ = new THREE.Quaternion()
    const spinQ = new THREE.Quaternion()
    const xAxis = new THREE.Vector3(1, 0, 0)
    const dummy = new THREE.Object3D()

    let docked = 0
    let rewriteT = 0
    let rewriteTarget = 0
    let lastDrawnRewrite = 0
    let scanning = false
    let scanT = 0
    let queue = []
    let dispScore = BASE_SCORE
    let shownScore = -1
    let lastMetaKey = ''
    let celebrated = false
    let celebrateT = -1
    let squash = 0
    let squashV = 0
    let hopT = -1
    let mood = -0.6
    let surprise = 0
    let blinkT = -1
    let nextBlink = 2
    let dragging = false
    let moved = 0
    let lastX = 0
    let lastY = 0
    let dragY = 0
    let dragX = 0
    let hovered = null
    let pointerInside = false
    let clock = 0
    let visible = true
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 1

    const orbitPos = (i, t, out) => {
      const a = (i / KEYWORDS.length) * TAU + (calm ? t * 0.22 : 0.6)
      return out.set(
        layout.paperX + Math.cos(a) * layout.orbitRX,
        ORBIT_Y[i] + Math.sin(t * 1.4 + i * 1.7) * 0.09 * calm,
        Math.sin(a) * 1.3 + 0.25
      )
    }
    const facingQuat = (pos, t, i, out) => {
      dummy.position.copy(pos)
      dummy.lookAt(camera.position)
      dummy.rotateZ(Math.sin(t * 1.1 + i) * 0.12 * calm)
      return out.copy(dummy.quaternion)
    }

    const poke = (strength = 1) => {
      squashV += 9 * strength
      hopT = 0
      surprise = 1
    }

    const dock = (c) => {
      if (c.mode !== 'orbit') return
      const used = new Set(chips.filter((o) => o.slot >= 0).map((o) => o.slot))
      let slot = 0
      while (used.has(slot)) slot++
      c.slot = slot
      c.mode = 'docking'
      c.t = 0
      c.from.copy(c.group.position)
      c.fromQ.copy(c.group.quaternion)
      c.fromS = c.group.scale.x
    }

    const undock = (c) => {
      if (c.mode === 'docking') { c.undockOnArrive = true; return }
      if (c.mode !== 'docked') return
      scene.attach(c.group)
      docked--
      c.slot = -1
      c.mode = 'returning'
      c.t = 0
      c.from.copy(c.group.position)
      c.fromQ.copy(c.group.quaternion)
      c.fromS = c.group.scale.x
    }

    const optimize = () => {
      if (scanning) return
      if (docked === KEYWORDS.length && rewriteTarget === 1) { poke(); return }
      scanning = true
      scanT = 0
      scanner.visible = true
    }

    const reset = () => {
      scanning = false
      scanner.visible = false
      queue = []
      rewriteTarget = 0
      celebrated = false
      chips.filter((c) => c.mode === 'docked' || c.mode === 'docking').forEach((c, k) => {
        queue.push({ at: clock + k * 0.12, fn: () => undock(c) })
      })
    }

    apiRef.current = { optimize, reset }

    let disposed = false
    if (brandFont && document.fonts) {
      Promise.all([
        document.fonts.load(`800 58px ${brandFont}`),
        document.fonts.load(`500 30px ${brandFont}`),
      ]).then(() => {
        if (disposed) return
        drawResume(faceCtx, rewriteT)
        faceTex.needsUpdate = true
        drawBack(backCtx, 512, 670)
        back.material.map.needsUpdate = true
        if (shownScore >= 0) setGauge(shownScore)
        chips.forEach((c) => {
          drawChip(c.ctx, 512, 144, c.kw, c.labelDone)
          c.tex.needsUpdate = true
        })
      }).catch(() => {})
    }

    // ── input ──
    const dom = renderer.domElement
    const updatePointer = (e) => {
      const rect = dom.getBoundingClientRect()
      const px = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const py = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      pointer.set(clamp(px, -1.5, 1.5), clamp(py, -1.5, 1.5))
      pointerInside = Math.abs(px) <= 1 && Math.abs(py) <= 1
      ndc.set(px, py)
    }
    const onMove = (e) => {
      updatePointer(e)
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      moved += Math.abs(dx) + Math.abs(dy)
      dragY += dx * 0.012
      dragX = clamp(dragX + dy * 0.008, -0.6, 0.6)
    }
    const onDown = (e) => {
      updatePointer(e)
      dragging = true
      moved = 0
      lastX = e.clientX
      lastY = e.clientY
    }
    const onUp = (e) => {
      if (!dragging) return
      dragging = false
      if (moved > 6) return
      updatePointer(e)
      raycaster.setFromCamera(ndc, camera)
      const hit = raycaster.intersectObjects([...chipBodies, paperBody, face], false)[0]
      if (!hit) return
      if (hit.object.userData.chip !== undefined) {
        const c = chips[hit.object.userData.chip]
        if (c.mode === 'orbit') dock(c)
      } else {
        poke()
      }
    }
    const onLeave = () => { pointerInside = false }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    dom.addEventListener('pointerdown', onDown)
    dom.addEventListener('pointerleave', onLeave)

    // ── resize / visibility ──
    const resize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h)
      const aspect = w / h
      camera.aspect = aspect
      const narrow = aspect < 1.05
      layout.paperX = narrow ? 0 : -0.45
      layout.orbitRX = narrow ? 1.75 : 2.15
      layout.gaugePos.set(narrow ? 1.2 : 1.95, narrow ? 1.62 : 0.95, narrow ? 1.1 : 0.9)
      layout.gaugeScale = narrow ? 0.72 : 1
      const halfWidthNeeded = narrow ? 2.3 : 3.15
      camera.position.z = clamp(halfWidthNeeded / (Math.tan(THREE.MathUtils.degToRad(16)) * aspect), 8.8, 17)
      camera.lookAt(0, 0.05, 0)
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(mount)
    resize()
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    io.observe(mount)

    // ── loop ──
    let raf = 0
    let last = performance.now()
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!visible) return
      clock += dt

      // queued actions
      if (queue.length) {
        const due = queue.filter((q) => q.at <= clock)
        queue = queue.filter((q) => q.at > clock)
        due.forEach((q) => q.fn())
      }

      // scan → rewrite → dock remaining
      if (scanning) {
        scanT += dt / 1.5
        scanner.position.y = lerp(PH / 2, -PH / 2, easeInOut(Math.min(scanT, 1)))
        if (scanT >= 1) {
          scanning = false
          scanner.visible = false
          rewriteTarget = 1
          chips.filter((c) => c.mode === 'orbit').forEach((c, k) => {
            queue.push({ at: clock + 0.55 + k * 0.2, fn: () => dock(c) })
          })
        }
      }
      if (rewriteT !== rewriteTarget) {
        rewriteT = rewriteTarget > rewriteT ? Math.min(1, rewriteT + dt / 0.7) : Math.max(0, rewriteT - dt / 0.7)
      }
      if (Math.abs(rewriteT - lastDrawnRewrite) > 0.001 || (rewriteT !== lastDrawnRewrite && (rewriteT === 0 || rewriteT === 1))) {
        drawResume(faceCtx, rewriteT)
        faceTex.needsUpdate = true
        lastDrawnRewrite = rewriteT
      }

      // score
      const target = BASE_SCORE + docked * PER_KEYWORD + REWRITE_BONUS * rewriteT
      dispScore += (target - dispScore) * (1 - Math.exp(-dt * 5))
      const s = Math.round(dispScore)
      if (s !== shownScore) {
        shownScore = s
        setGauge(s)
      }
      const metaKey = `${s}|${docked}|${rewriteTarget}|${scanning}`
      if (metaKey !== lastMetaKey) {
        lastMetaKey = metaKey
        onScoreRef.current?.(s, { docked, total: KEYWORDS.length, rewritten: rewriteTarget === 1, scanning })
      }
      if (!celebrated && docked === KEYWORDS.length && rewriteT >= 1) {
        celebrated = true
        celebrateT = 0
        if (calm) burst()
      }

      // pointer smoothing + hover
      smoothPointer.lerp(pointer, 1 - Math.exp(-dt * 6))
      hovered = null
      let hoverPaper = false
      if (pointerInside && !dragging) {
        raycaster.setFromCamera(ndc, camera)
        const hit = raycaster.intersectObjects([...chipBodies, paperBody, face], false)[0]
        if (hit) {
          if (hit.object.userData.chip !== undefined) {
            const c = chips[hit.object.userData.chip]
            if (c.mode === 'orbit') hovered = c
          } else hoverPaper = true
        }
      }
      dom.style.cursor = dragging ? 'grabbing' : hovered || hoverPaper ? 'pointer' : 'grab'

      // drag spring back to nearest full turn
      if (!dragging) {
        const home = Math.round(dragY / TAU) * TAU
        dragY += (home - dragY) * (1 - Math.exp(-dt * 3))
        dragX += (0 - dragX) * (1 - Math.exp(-dt * 4))
      }

      // squash spring
      squashV += (-120 * squash - 9 * squashV) * dt
      squash += squashV * dt
      paper.scale.set(1 + squash * 0.05, 1 - squash * 0.07, 1 + squash * 0.05)

      // hop + celebrate spin
      let hop = 0
      if (hopT >= 0) {
        hopT += dt / 0.45
        hop = Math.sin(Math.PI * Math.min(hopT, 1)) * 0.22
        if (hopT >= 1) hopT = -1
      }
      let spin = 0
      if (celebrateT >= 0) {
        celebrateT += dt / 1.2
        const e = Math.min(celebrateT, 1)
        spin = easeInOut(e) * TAU * calm
        hop += Math.sin(Math.PI * e) * 0.55
        if (celebrateT >= 1) celebrateT = -1
      }

      const float = Math.sin(clock * 1.3) * 0.07 * calm
      rig.position.set(layout.paperX, 0.05 + float + hop + (hoverPaper ? 0.04 : 0), 0)
      rig.rotation.y = smoothPointer.x * 0.22 + dragY + spin
      rig.rotation.x = -smoothPointer.y * 0.12 + dragX
      rig.rotation.z = Math.sin(clock * 0.8) * 0.018 * calm
      const lift = rig.position.y + 2.35
      shadow.position.x = layout.paperX
      shadow.scale.setScalar(clamp(1.15 - lift * 0.12, 0.6, 1))
      shadow.material.opacity = clamp(1.2 - lift * 0.18, 0.35, 1)

      // face: mood, eyes, blink
      const moodTarget = clamp((dispScore - 64) / 26, -1, 1)
      mood += (moodTarget - mood) * (1 - Math.exp(-dt * 4))
      surprise = Math.max(0, surprise - dt * 2.5)
      const m = Math.abs(mood) < 0.14 ? 0.14 * (mood < 0 ? -1 : 1) : mood
      mouth.scale.set(1 - surprise * 0.35, m * (1 - surprise * 0.5), 1)
      mouth.position.y = -0.085 + 0.06 * m
      cheekMat.opacity = clamp(mood, 0, 1) * 0.75
      let lookX = smoothPointer.x
      let lookY = smoothPointer.y
      if (hovered) {
        hovered.group.getWorldPosition(tmpV)
        tmpV.project(camera)
        lookX = tmpV.x
        lookY = tmpV.y
      }
      if (scanning) {
        lookX = 0
        lookY = clamp(scanner.position.y / (PH / 2), -1, 1) - 0.4
      }
      eyes.position.x += (clamp(lookX, -1, 1) * 0.028 - eyes.position.x) * (1 - Math.exp(-dt * 10))
      eyes.position.y += (clamp(lookY, -1, 1) * 0.022 - eyes.position.y) * (1 - Math.exp(-dt * 10))
      nextBlink -= dt
      if (nextBlink <= 0 && blinkT < 0) { blinkT = 0; nextBlink = 2 + Math.random() * 3.5 }
      let lid = 1
      if (blinkT >= 0) {
        blinkT += dt / 0.16
        lid = 1 - Math.sin(Math.PI * Math.min(blinkT, 1)) * 0.9
        if (blinkT >= 1) blinkT = -1
      }
      const eyeBig = 1 + surprise * 0.3
      eyeMeshes.forEach((eye) => eye.scale.set(eyeBig, lid * eyeBig, 0.55))

      // gauge
      gauge.position.set(layout.gaugePos.x, layout.gaugePos.y + Math.sin(clock * 1.1 + 1) * 0.08 * calm, layout.gaugePos.z)
      gauge.rotation.set(-smoothPointer.y * 0.2 + 0.05, smoothPointer.x * 0.35 - 0.25, Math.sin(clock * 0.7) * 0.04)
      gauge.scale.setScalar(layout.gaugeScale * (1 + Math.max(0, squash) * 0.03))

      // chips
      chips.forEach((c) => {
        c.hover += ((hovered === c ? 1 : 0) - c.hover) * (1 - Math.exp(-dt * 12))
        if (c.mode === 'orbit') {
          orbitPos(c.i, clock, c.group.position)
          facingQuat(c.group.position, clock, c.i, c.group.quaternion)
          c.group.scale.setScalar(ORBIT_SCALE * (1 + c.hover * 0.15))
          c.colorT = Math.max(0, c.colorT - dt * 3)
        } else if (c.mode === 'docking') {
          c.t += dt / 0.85
          const e = easeInOut(Math.min(c.t, 1))
          const slot = slots[c.slot]
          slot.getWorldPosition(tmpV)
          slot.getWorldQuaternion(tmpQ)
          c.group.position.lerpVectors(c.from, tmpV, e)
          c.group.position.y += Math.sin(Math.PI * e) * 0.9
          c.group.position.z += Math.sin(Math.PI * e) * 0.6
          c.group.quaternion.slerpQuaternions(c.fromQ, tmpQ, e)
          spinQ.setFromAxisAngle(xAxis, TAU * easeOutBack(Math.min(c.t, 1)))
          c.group.quaternion.multiply(spinQ)
          c.group.scale.setScalar(lerp(c.fromS, 1, e))
          c.colorT = e
          if (c.t >= 1) {
            paper.attach(c.group)
            c.group.position.copy(slot.position)
            c.group.quaternion.identity()
            c.group.scale.setScalar(1)
            c.mode = 'docked'
            docked++
            squashV += 5
            if (c.undockOnArrive) {
              c.undockOnArrive = false
              undock(c)
            }
          }
        } else if (c.mode === 'returning') {
          c.t += dt / 0.9
          const e = easeInOut(Math.min(c.t, 1))
          orbitPos(c.i, clock, tmpV)
          facingQuat(tmpV, clock, c.i, tmpQ)
          c.group.position.lerpVectors(c.from, tmpV, e)
          c.group.position.y += Math.sin(Math.PI * e) * 0.7
          c.group.quaternion.slerpQuaternions(c.fromQ, tmpQ, e)
          c.group.scale.setScalar(lerp(c.fromS, ORBIT_SCALE, e))
          c.colorT = 1 - e
          if (c.t >= 1) c.mode = 'orbit'
        }
        c.mat.color.copy(redColor).lerp(greenColor, c.colorT)
        c.mat.emissive.copy(c.mat.color)
        const done = c.colorT > 0.5
        if (done !== c.labelDone) {
          c.labelDone = done
          drawChip(c.ctx, 512, 144, c.kw, done)
          c.tex.needsUpdate = true
        }
      })

      // confetti
      if (confettiT >= 0) {
        confettiT += dt
        parts.forEach((pt, i) => {
          pt.v.y -= 7.5 * dt
          pt.v.multiplyScalar(1 - dt * 0.6)
          pt.p.addScaledVector(pt.v, dt)
          pt.r.x += pt.rv.x * dt
          pt.r.y += pt.rv.y * dt
          pt.r.z += pt.rv.z * dt
          dummy.position.copy(pt.p)
          dummy.rotation.copy(pt.r)
          dummy.scale.setScalar(clamp(3.2 - confettiT, 0, 1))
          dummy.updateMatrix()
          confetti.setMatrixAt(i, dummy.matrix)
        })
        confetti.instanceMatrix.needsUpdate = true
        if (confettiT > 3.2) { confettiT = -1; confetti.visible = false }
      }

      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      dom.removeEventListener('pointerdown', onDown)
      dom.removeEventListener('pointerleave', onLeave)
      scene.traverse((obj) => {
        obj.geometry?.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : []
        mats.forEach((mat) => { mat.map?.dispose(); mat.dispose() })
      })
      envTex.dispose()
      pmrem.dispose()
      renderer.dispose()
      mount.removeChild(dom)
      apiRef.current = {}
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
