import type { MoodState } from '../../../shared/types'

type CatFace = {
  eyeLeft: string
  eyeRight: string
  mouth: string
  blush: string
  accent: string
  extra: string
}

const FACE_BY_MOOD: Record<MoodState, CatFace> = {
  idle: {
    eyeLeft: '<ellipse cx="102" cy="111" rx="7" ry="10" fill="#111827" />',
    eyeRight: '<ellipse cx="154" cy="111" rx="7" ry="10" fill="#111827" />',
    mouth:
      '<path d="M116 143 Q128 153 140 143" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round" />',
    blush:
      '<circle cx="86" cy="134" r="8" fill="#fda4af" opacity=".45" /><circle cx="170" cy="134" r="8" fill="#fda4af" opacity=".45" />',
    accent: '#fbbf24',
    extra: ''
  },
  happy: {
    eyeLeft:
      '<path d="M94 109 Q102 118 110 109" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" />',
    eyeRight:
      '<path d="M146 109 Q154 118 162 109" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" />',
    mouth:
      '<path d="M111 141 Q128 165 145 141" fill="#fb7185" stroke="#111827" stroke-width="5" stroke-linejoin="round" />',
    blush:
      '<circle cx="84" cy="133" r="9" fill="#fb7185" opacity=".5" /><circle cx="172" cy="133" r="9" fill="#fb7185" opacity=".5" />',
    accent: '#fb7185',
    extra:
      '<path d="M69 59 l7 15 16 2 -12 11 3 16 -14 -8 -14 8 3 -16 -12 -11 16 -2z" fill="#fde047" />'
  },
  angry_for_user: {
    eyeLeft:
      '<path d="M92 103 L111 112" stroke="#111827" stroke-width="7" stroke-linecap="round" /><circle cx="104" cy="117" r="6" fill="#111827" />',
    eyeRight:
      '<path d="M164 103 L145 112" stroke="#111827" stroke-width="7" stroke-linecap="round" /><circle cx="152" cy="117" r="6" fill="#111827" />',
    mouth:
      '<path d="M115 150 Q128 140 141 150" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round" />',
    blush:
      '<path d="M72 132 h24" stroke="#f87171" stroke-width="5" stroke-linecap="round" /><path d="M160 132 h24" stroke="#f87171" stroke-width="5" stroke-linecap="round" />',
    accent: '#ef4444',
    extra:
      '<path d="M183 70 q18 8 3 23 q18 5 0 23" fill="none" stroke="#ef4444" stroke-width="7" stroke-linecap="round" />'
  },
  cuddling: {
    eyeLeft:
      '<path d="M94 111 Q103 119 112 111" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" />',
    eyeRight:
      '<path d="M144 111 Q153 119 162 111" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" />',
    mouth:
      '<path d="M116 144 Q128 154 140 144" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round" />',
    blush:
      '<circle cx="83" cy="132" r="11" fill="#f9a8d4" opacity=".58" /><circle cx="173" cy="132" r="11" fill="#f9a8d4" opacity=".58" />',
    accent: '#f9a8d4',
    extra:
      '<path d="M68 173 q21 28 60 8 q39 20 60 -8" fill="none" stroke="#f9a8d4" stroke-width="10" stroke-linecap="round" />'
  },
  hungry: {
    eyeLeft: '<ellipse cx="102" cy="115" rx="7" ry="5" fill="#111827" />',
    eyeRight: '<ellipse cx="154" cy="115" rx="7" ry="5" fill="#111827" />',
    mouth:
      '<path d="M117 150 Q128 143 139 150" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round" />',
    blush:
      '<circle cx="84" cy="135" r="7" fill="#93c5fd" opacity=".38" /><circle cx="172" cy="135" r="7" fill="#93c5fd" opacity=".38" />',
    accent: '#60a5fa',
    extra: '<path d="M165 143 q14 17 -4 26 q-10 -13 4 -26z" fill="#60a5fa" opacity=".82" />'
  },
  sleeping: {
    eyeLeft:
      '<path d="M93 113 Q103 108 113 113" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" />',
    eyeRight:
      '<path d="M143 113 Q153 108 163 113" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" />',
    mouth: '<circle cx="128" cy="145" r="6" fill="#111827" opacity=".85" />',
    blush:
      '<circle cx="86" cy="133" r="7" fill="#c4b5fd" opacity=".42" /><circle cx="170" cy="133" r="7" fill="#c4b5fd" opacity=".42" />',
    accent: '#a78bfa',
    extra:
      '<text x="171" y="63" font-size="24" font-family="Arial, sans-serif" font-weight="700" fill="#a78bfa">z</text><text x="194" y="43" font-size="18" font-family="Arial, sans-serif" font-weight="700" fill="#c4b5fd">z</text>'
  },
  excited: {
    eyeLeft:
      '<circle cx="102" cy="112" r="8" fill="#111827" /><circle cx="99" cy="109" r="3" fill="#fff" />',
    eyeRight:
      '<circle cx="154" cy="112" r="8" fill="#111827" /><circle cx="151" cy="109" r="3" fill="#fff" />',
    mouth:
      '<path d="M110 140 Q128 170 146 140 Q128 154 110 140" fill="#fb7185" stroke="#111827" stroke-width="5" stroke-linejoin="round" />',
    blush:
      '<circle cx="83" cy="133" r="9" fill="#fb923c" opacity=".5" /><circle cx="173" cy="133" r="9" fill="#fb923c" opacity=".5" />',
    accent: '#fb923c',
    extra:
      '<path d="M58 86 l8 8 8 -8" fill="none" stroke="#fb923c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" /><path d="M190 86 l8 8 8 -8" fill="none" stroke="#fb923c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />'
  },
  sad: {
    eyeLeft:
      '<path d="M94 116 Q103 108 112 116" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" />',
    eyeRight:
      '<path d="M144 116 Q153 108 162 116" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round" />',
    mouth:
      '<path d="M115 153 Q128 143 141 153" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round" />',
    blush:
      '<circle cx="84" cy="136" r="7" fill="#bfdbfe" opacity=".45" /><circle cx="172" cy="136" r="7" fill="#bfdbfe" opacity=".45" />',
    accent: '#38bdf8',
    extra: '<path d="M163 125 q12 16 -4 25 q-9 -12 4 -25z" fill="#38bdf8" opacity=".78" />'
  }
}

export function buildDefaultCatSvgMarkup(mood: MoodState): string {
  const face = FACE_BY_MOOD[mood]
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zuiti cow-cat ${mood} 奶牛猫" viewBox="0 0 256 256">
<defs>
<filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
<feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#111827" flood-opacity=".18"/>
</filter>
</defs>
<g filter="url(#softShadow)">
<g id="zuiti-part-body">
<ellipse cx="128" cy="210" rx="64" ry="14" fill="#111827" opacity=".12"/>
</g>
<g id="zuiti-part-tail">
<path d="M198 162 C232 158 229 207 190 198" fill="none" stroke="#111827" stroke-width="10" stroke-linecap="round"/>
<circle cx="197" cy="162" r="8" fill="${face.accent}" stroke="#111827" stroke-width="4"/>
</g>
<g id="zuiti-part-left-foot">
<ellipse cx="96" cy="190" rx="18" ry="10" fill="#fff7ed" stroke="#111827" stroke-width="6"/>
</g>
<g id="zuiti-part-right-foot">
<ellipse cx="160" cy="190" rx="18" ry="10" fill="#fff7ed" stroke="#111827" stroke-width="6"/>
</g>
<g id="zuiti-part-left-arm">
<path d="M74 168 C57 157 49 139 55 119" fill="none" stroke="#111827" stroke-width="7" stroke-linecap="round"/>
</g>
<g id="zuiti-part-right-arm">
<path d="M182 168 C199 157 207 139 201 119" fill="none" stroke="#111827" stroke-width="7" stroke-linecap="round"/>
</g>
<g id="zuiti-part-head">
<path d="M67 83 L82 35 L115 70 Z" fill="#fff7ed" stroke="#111827" stroke-width="7" stroke-linejoin="round"/>
<path d="M189 83 L174 35 L141 70 Z" fill="#fff7ed" stroke="#111827" stroke-width="7" stroke-linejoin="round"/>
<path d="M82 55 L88 78 L101 71 Z" fill="#f9a8d4" opacity=".82"/>
<path d="M174 55 L168 78 L155 71 Z" fill="#f9a8d4" opacity=".82"/>
<circle cx="128" cy="125" r="74" fill="#fff7ed" stroke="#111827" stroke-width="7"/>
<path d="M75 95 C82 58 116 48 129 54 C115 72 99 84 75 95 Z" fill="#111827"/>
<path d="M145 57 C170 56 189 78 195 105 C174 98 157 84 145 57 Z" fill="#111827"/>
<g id="zuiti-part-face">
${face.eyeLeft}
${face.eyeRight}
<path d="M124 128 L132 128 L128 136 Z" fill="#f472b6" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
${face.mouth}
${face.blush}
<path d="M75 105 h-25 M77 121 h-28 M181 105 h25 M179 121 h28" stroke="#111827" stroke-width="4" stroke-linecap="round" opacity=".72"/>
${face.extra}
</g>
</g>
</g>
</svg>`
}

export function buildDefaultCatSvg(mood: MoodState): string {
  return buildDefaultCatSvgMarkup(mood)
}

export function buildDefaultCatSvgDataUrl(mood: MoodState): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildDefaultCatSvg(mood))}`
}
