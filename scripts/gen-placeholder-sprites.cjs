/* eslint-disable */
// Generates placeholder cat pet sprites under resources/pet/<mood>/<n>.png.
// Pure-Node PNG writer: no npm deps. 256×256, cute cat on transparent bg.

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const MOODS = {
  idle:           { bodyColor: [245, 240, 235], accent: [255, 180, 160], frames: 4, eyeStyle: 'normal' },
  happy:          { bodyColor: [245, 240, 235], accent: [255, 200, 100], frames: 4, eyeStyle: 'happy' },
  angry_for_user: { bodyColor: [245, 235, 230], accent: [255, 120, 100], frames: 4, eyeStyle: 'angry' },
  cuddling:       { bodyColor: [248, 238, 240], accent: [255, 160, 180], frames: 4, eyeStyle: 'love' },
  hungry:         { bodyColor: [240, 235, 225], accent: [220, 190, 140], frames: 4, eyeStyle: 'pleading' },
  sleeping:       { bodyColor: [235, 238, 248], accent: [180, 190, 230], frames: 4, eyeStyle: 'sleeping' },
  excited:        { bodyColor: [248, 242, 235], accent: [255, 210, 80],  frames: 4, eyeStyle: 'sparkle' },
  sad:            { bodyColor: [235, 238, 245], accent: [160, 180, 220], frames: 4, eyeStyle: 'sad' }
}

const SIZE = 256
const CX = SIZE / 2
const CY = SIZE / 2 + 10

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}

function makePng(width, height, rgba) {
  const row = width * 4
  const raw = Buffer.alloc((row + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (row + 1)] = 0
    rgba.copy(raw, y * (row + 1) + 1, y * row, y * row + row)
  }
  const idat = zlib.deflateSync(raw)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr.writeUInt8(8, 8)
  ihdr.writeUInt8(6, 9)
  ihdr.writeUInt8(0, 10)
  ihdr.writeUInt8(0, 11)
  ihdr.writeUInt8(0, 12)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ])
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

function ellipseHit(x, y, cx, cy, rx, ry) {
  return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0
}

function blendColor(base, overlay, alpha) {
  return [
    Math.round(base[0] * (1 - alpha) + overlay[0] * alpha),
    Math.round(base[1] * (1 - alpha) + overlay[1] * alpha),
    Math.round(base[2] * (1 - alpha) + overlay[2] * alpha)
  ]
}

function drawCatSprite(width, height, bodyColor, accent, eyeStyle, frameIdx) {
  const buf = Buffer.alloc(width * height * 4)
  const breathe = Math.sin(frameIdx * Math.PI / 2) * 3
  const sway = Math.sin(frameIdx * Math.PI / 2) * 2
  const tailPhase = frameIdx * Math.PI / 2

  const headCX = CX + sway
  const headCY = CY - 20 + breathe * 0.3
  const headRX = 58
  const headRY = 52

  const bodyCX = CX + sway * 0.5
  const bodyCY = CY + 38 + breathe * 0.5
  const bodyRX = 48 + breathe * 0.5
  const bodyRY = 40 + breathe * 0.3

  const [br, bg, bb] = bodyColor
  const outR = Math.round(br * 0.65)
  const outG = Math.round(bg * 0.65)
  const outB = Math.round(bb * 0.65)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      let R = 0, G = 0, B = 0, A = 0

      // --- Tail (drawn first, behind body) ---
      const tailStartX = bodyCX + 35
      const tailStartY = bodyCY + 15
      const tailLen = 45
      for (let t = 0; t < 1.0; t += 0.01) {
        const tw = 6 - t * 3
        const tx = tailStartX + t * tailLen
        const ty = tailStartY - Math.sin(t * Math.PI + tailPhase) * 20
        if (dist(x, y, tx, ty) < tw) {
          R = Math.round(br * 0.75); G = Math.round(bg * 0.75); B = Math.round(bb * 0.75); A = 255
          break
        }
      }

      // --- Body ellipse ---
      if (ellipseHit(x, y, bodyCX, bodyCY, bodyRX, bodyRY)) {
        const t = 1 - ((x - bodyCX) / bodyRX) ** 2 - ((y - bodyCY) / bodyRY) ** 2
        R = Math.round(br * (0.92 + 0.08 * t))
        G = Math.round(bg * (0.92 + 0.08 * t))
        B = Math.round(bb * (0.92 + 0.08 * t))
        A = 255

        if (!ellipseHit(x, y, bodyCX, bodyCY, bodyRX - 2.5, bodyRY - 2.5)) {
          R = outR; G = outG; B = outB
        }

        // Belly highlight
        if (ellipseHit(x, y, bodyCX, bodyCY + 5, bodyRX * 0.55, bodyRY * 0.6)) {
          R = Math.min(255, R + 12); G = Math.min(255, G + 10); B = Math.min(255, B + 8)
        }
      }

      // --- Front paws ---
      const pawY = bodyCY + bodyRY - 8
      const leftPawX = bodyCX - 20
      const rightPawX = bodyCX + 20
      const pawR = 10
      if (dist(x, y, leftPawX, pawY) < pawR || dist(x, y, rightPawX, pawY) < pawR) {
        R = br; G = bg; B = bb; A = 255
        if (dist(x, y, leftPawX, pawY) > pawR - 2 || dist(x, y, rightPawX, pawY) > pawR - 2) {
          if (dist(x, y, leftPawX, pawY) > pawR - 2 && dist(x, y, leftPawX, pawY) < pawR) {
            R = outR; G = outG; B = outB
          }
          if (dist(x, y, rightPawX, pawY) > pawR - 2 && dist(x, y, rightPawX, pawY) < pawR) {
            R = outR; G = outG; B = outB
          }
        }
        // Paw pads (tiny pink circles)
        if (dist(x, y, leftPawX, pawY + 2) < 4 || dist(x, y, rightPawX, pawY + 2) < 4) {
          R = accent[0]; G = accent[1]; B = accent[2]
        }
      }

      // --- Head ellipse ---
      if (ellipseHit(x, y, headCX, headCY, headRX, headRY)) {
        const t = 1 - ((x - headCX) / headRX) ** 2 - ((y - headCY) / headRY) ** 2
        R = Math.round(br * (0.93 + 0.07 * t))
        G = Math.round(bg * (0.93 + 0.07 * t))
        B = Math.round(bb * (0.93 + 0.07 * t))
        A = 255

        if (!ellipseHit(x, y, headCX, headCY, headRX - 2.5, headRY - 2.5)) {
          R = outR; G = outG; B = outB
        }
      }

      // --- Ears (triangular) ---
      const earH = 32
      const earW = 22
      // Left ear
      const leX = headCX - headRX * 0.55
      const leY = headCY - headRY * 0.75
      const leTip = [leX - 8, leY - earH]
      const leLeft = [leX - earW / 2 - 4, leY]
      const leRight = [leX + earW / 2 - 4, leY]
      if (pointInTriangle(x, y, leTip, leLeft, leRight)) {
        A = 255
        if (pointInTriangle(x, y, [leTip[0], leTip[1] + 6], [leLeft[0] + 5, leLeft[1] - 2], [leRight[0] - 3, leRight[1] - 2])) {
          R = accent[0]; G = accent[1]; B = accent[2]
        } else {
          R = Math.round(br * 0.85); G = Math.round(bg * 0.85); B = Math.round(bb * 0.85)
        }
      }
      // Right ear
      const reX = headCX + headRX * 0.55
      const reY = headCY - headRY * 0.75
      const reTip = [reX + 8, reY - earH]
      const reLeft = [reX - earW / 2 + 4, reY]
      const reRight = [reX + earW / 2 + 4, reY]
      if (pointInTriangle(x, y, reTip, reLeft, reRight)) {
        A = 255
        if (pointInTriangle(x, y, [reTip[0], reTip[1] + 6], [reLeft[0] + 3, reLeft[1] - 2], [reRight[0] - 5, reRight[1] - 2])) {
          R = accent[0]; G = accent[1]; B = accent[2]
        } else {
          R = Math.round(br * 0.85); G = Math.round(bg * 0.85); B = Math.round(bb * 0.85)
        }
      }

      // --- Face features (only on head) ---
      if (ellipseHit(x, y, headCX, headCY, headRX - 3, headRY - 3)) {
        // Cheek blush
        const lCheekX = headCX - 30, rCheekX = headCX + 30, cheekY = headCY + 12
        if (dist(x, y, lCheekX, cheekY) < 12 || dist(x, y, rCheekX, cheekY) < 12) {
          const d1 = dist(x, y, lCheekX, cheekY)
          const d2 = dist(x, y, rCheekX, cheekY)
          const d = Math.min(d1, d2)
          const alpha = Math.max(0, 1 - d / 12) * 0.35
          ;[R, G, B] = blendColor([R, G, B], accent, alpha)
        }

        // Nose (tiny inverted triangle)
        const noseX = headCX, noseY = headCY + 5
        if (dist(x, y, noseX, noseY) < 4 && y >= noseY - 2) {
          ;[R, G, B] = blendColor([R, G, B], accent, 0.8)
        }

        // Whiskers
        const whiskerY = headCY + 8
        // Left whiskers
        for (let w = 0; w < 3; w++) {
          const wy = whiskerY + (w - 1) * 6
          const angle = (-15 + (w - 1) * 12) * Math.PI / 180
          for (let t = 0; t < 25; t++) {
            const wx = headCX - 15 - t
            const wwy = wy + Math.sin(angle) * t
            if (Math.abs(x - wx) < 1.5 && Math.abs(y - wwy) < 1) {
              ;[R, G, B] = blendColor([R, G, B], [outR, outG, outB], 0.6)
            }
          }
        }
        // Right whiskers
        for (let w = 0; w < 3; w++) {
          const wy = whiskerY + (w - 1) * 6
          const angle = (15 + (w - 1) * -12) * Math.PI / 180
          for (let t = 0; t < 25; t++) {
            const wx = headCX + 15 + t
            const wwy = wy + Math.sin(angle) * t
            if (Math.abs(x - wx) < 1.5 && Math.abs(y - wwy) < 1) {
              ;[R, G, B] = blendColor([R, G, B], [outR, outG, outB], 0.6)
            }
          }
        }

        // Eyes
        const eyeY = headCY - 8
        const eyeLX = headCX - 20
        const eyeRX = headCX + 20
        const eyeRadius = 8

        drawEyes(x, y, eyeLX, eyeRX, eyeY, eyeRadius, eyeStyle, frameIdx, (r, g, b, a) => {
          if (a > 0) { R = r; G = g; B = b }
        })

        // Mouth
        drawMouth(x, y, headCX, headCY + 14, eyeStyle, (r, g, b, a) => {
          if (a > 0) { ;[R, G, B] = blendColor([R, G, B], [r, g, b], a / 255) }
        })
      }

      buf[idx] = R
      buf[idx + 1] = G
      buf[idx + 2] = B
      buf[idx + 3] = A
    }
  }
  return buf
}

function drawEyes(x, y, lx, rx, ey, r, style, frame, set) {
  const dark = [40, 40, 50]
  const white = [255, 255, 255]
  const sparkle = [255, 255, 255]

  switch (style) {
    case 'normal': {
      // Round eyes with pupil and sparkle
      if (dist(x, y, lx, ey) < r || dist(x, y, rx, ey) < r) {
        set(...white, 255)
        if (dist(x, y, lx, ey) < r * 0.65 || dist(x, y, rx, ey) < r * 0.65) {
          set(...dark, 255)
        }
        if (dist(x, y, lx - 2, ey - 2) < 2.5 || dist(x, y, rx - 2, ey - 2) < 2.5) {
          set(...sparkle, 255)
        }
      }
      break
    }
    case 'happy': {
      // Squinted happy arcs (upside-down U)
      const arcR = r * 0.8
      for (const cx of [lx, rx]) {
        const d = dist(x, y, cx, ey)
        if (d > arcR - 2.5 && d < arcR + 1.5 && y < ey + 1) {
          set(...dark, 255)
        }
      }
      break
    }
    case 'angry': {
      // Angry: angled brows, smaller pupils
      if (dist(x, y, lx, ey) < r || dist(x, y, rx, ey) < r) {
        set(...white, 255)
        if (dist(x, y, lx, ey + 1) < r * 0.55 || dist(x, y, rx, ey + 1) < r * 0.55) {
          set(...dark, 255)
        }
      }
      // Angry brows
      for (const [cx, dir] of [[lx, -1], [rx, 1]]) {
        for (let t = -r; t <= r; t++) {
          const bx = cx + t
          const by = ey - r - 4 + dir * t * 0.25
          if (Math.abs(x - bx) < 1 && Math.abs(y - by) < 2) {
            set(...dark, 255)
          }
        }
      }
      break
    }
    case 'love': {
      // Heart-shaped eyes
      for (const cx of [lx, rx]) {
        const hx = (x - cx) / (r * 0.7)
        const hy = (y - ey) / (r * 0.7)
        const heart = (hx * hx + hy * hy - 1) ** 3 - hx * hx * hy * hy * hy
        if (heart <= 0) {
          set(230, 80, 120, 255)
        }
      }
      break
    }
    case 'pleading': {
      // Big watery eyes
      const bigR = r * 1.2
      if (dist(x, y, lx, ey) < bigR || dist(x, y, rx, ey) < bigR) {
        set(...white, 255)
        // Big pupils
        if (dist(x, y, lx, ey + 1) < bigR * 0.6 || dist(x, y, rx, ey + 1) < bigR * 0.6) {
          set(...dark, 255)
        }
        // Big sparkles
        if (dist(x, y, lx - 3, ey - 3) < 3 || dist(x, y, rx - 3, ey - 3) < 3) {
          set(...sparkle, 255)
        }
        if (dist(x, y, lx + 2, ey + 2) < 1.5 || dist(x, y, rx + 2, ey + 2) < 1.5) {
          set(...sparkle, 255)
        }
      }
      break
    }
    case 'sleeping': {
      // Closed eyes (horizontal lines)
      for (const cx of [lx, rx]) {
        if (Math.abs(y - ey) < 2 && Math.abs(x - cx) < r * 0.7) {
          set(...dark, 255)
        }
        // Eyelash tip down
        if (Math.abs(x - (cx + r * 0.6)) < 1.5 && y > ey - 1 && y < ey + 4) {
          set(...dark, 255)
        }
      }
      break
    }
    case 'sparkle': {
      // Star-shaped sparkly eyes
      if (dist(x, y, lx, ey) < r || dist(x, y, rx, ey) < r) {
        set(...white, 255)
        if (dist(x, y, lx, ey) < r * 0.55 || dist(x, y, rx, ey) < r * 0.55) {
          set(255, 180, 60, 255)
        }
        // Star sparkle pattern
        for (const cx of [lx, rx]) {
          if ((Math.abs(x - cx) < 1.5 && Math.abs(y - ey) < r * 0.8) ||
              (Math.abs(y - ey) < 1.5 && Math.abs(x - cx) < r * 0.8)) {
            set(...sparkle, 255)
          }
        }
      }
      break
    }
    case 'sad': {
      // Droopy eyes looking down
      if (dist(x, y, lx, ey) < r || dist(x, y, rx, ey) < r) {
        set(...white, 255)
        if (dist(x, y, lx + 1, ey + 2) < r * 0.55 || dist(x, y, rx + 1, ey + 2) < r * 0.55) {
          set(...dark, 255)
        }
        if (dist(x, y, lx - 1, ey - 1) < 2 || dist(x, y, rx - 1, ey - 1) < 2) {
          set(...sparkle, 255)
        }
      }
      // Sad brows (angled up in center)
      for (const [cx, dir] of [[lx, 1], [rx, -1]]) {
        for (let t = -r; t <= r; t++) {
          const bx = cx + t
          const by = ey - r - 5 + dir * t * 0.2
          if (Math.abs(x - bx) < 1 && Math.abs(y - by) < 1.5) {
            set(...dark, 255)
          }
        }
      }
      break
    }
  }
}

function drawMouth(x, y, cx, cy, style, set) {
  const dark = [80, 70, 70]
  switch (style) {
    case 'normal':
    case 'sparkle': {
      // Small w-shaped cat mouth
      const mw = 10
      if (Math.abs(y - cy) < 2) {
        const relX = x - cx
        if (relX > -mw && relX < 0) {
          const lineY = cy + (relX + mw / 2) * 0.3
          if (Math.abs(y - lineY) < 1.5) set(...dark, 200)
        }
        if (relX >= 0 && relX < mw) {
          const lineY = cy - (relX - mw / 2) * 0.3
          if (Math.abs(y - lineY) < 1.5) set(...dark, 200)
        }
      }
      break
    }
    case 'happy': {
      // Big open smile
      const smileR = 12
      const d = dist(x, y, cx, cy - 2)
      if (d > smileR - 2 && d < smileR + 1.5 && y > cy - 2) {
        set(...dark, 220)
      }
      break
    }
    case 'angry': {
      // Jagged/grumpy mouth
      const mw = 14
      const relX = x - (cx - mw / 2)
      if (relX >= 0 && relX <= mw && Math.abs(y - cy) < 3) {
        const zigzag = Math.abs((relX % 5) - 2.5) * 1.2
        if (Math.abs(y - (cy - zigzag + 1.5)) < 1.5) set(...dark, 220)
      }
      break
    }
    case 'love':
    case 'cuddling': {
      // Tiny content smile
      const smileR = 8
      const d = dist(x, y, cx, cy - 1)
      if (d > smileR - 2 && d < smileR + 1 && y > cy) {
        set(...dark, 180)
      }
      break
    }
    case 'pleading':
    case 'hungry': {
      // Small open O mouth
      const oR = 6
      const d = dist(x, y, cx, cy + 2)
      if (d > oR - 2 && d < oR + 1) {
        set(...dark, 200)
      }
      break
    }
    case 'sleeping': {
      // Tiny relaxed line
      if (Math.abs(y - cy) < 1 && Math.abs(x - cx) < 5) {
        set(...dark, 120)
      }
      break
    }
    case 'sad': {
      // Downturned mouth
      const sadR = 10
      const d = dist(x, y, cx, cy + 6)
      if (d > sadR - 2 && d < sadR + 1 && y < cy + 3) {
        set(...dark, 200)
      }
      break
    }
    case 'excited': {
      // Wide open smile
      const smileR = 14
      const d = dist(x, y, cx, cy - 3)
      if (d > smileR - 2 && d < smileR + 1.5 && y > cy - 1) {
        set(...dark, 240)
      }
      break
    }
  }
}

function pointInTriangle(px, py, v1, v2, v3) {
  const [x1, y1] = v1, [x2, y2] = v2, [x3, y3] = v3
  const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2)
  const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3)
  const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

function main() {
  const root = path.resolve(__dirname, '..', 'resources', 'pet')
  for (const [mood, { bodyColor, accent, frames, eyeStyle }] of Object.entries(MOODS)) {
    const dir = path.join(root, mood)
    fs.mkdirSync(dir, { recursive: true })
    for (let i = 0; i < frames; i++) {
      const rgba = drawCatSprite(SIZE, SIZE, bodyColor, accent, eyeStyle, i)
      const png = makePng(SIZE, SIZE, rgba)
      fs.writeFileSync(path.join(dir, `${i}.png`), png)
    }
    console.log(`✓ ${mood}: ${frames} frame(s) → ${dir}`)
  }
}

main()
