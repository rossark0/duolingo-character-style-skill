// reference/kit.mjs
// A dependency-free kit that draws people in the Duolingo illustration style,
// following SKILL.md. Every function returns plain shape data ("parts");
// toSvg() turns parts into an SVG string. Port the geometry unchanged to
// React Native SVG, Skia or canvas: it is plain path data.
//
// THE FRAME: the head is 100 units wide and its center is (0, 0); y grows
// down. The head spans y -66 to 56, the torso starts at y 68. Translate and
// scale the whole group to place a character in a scene.
//
// Part kinds:
//   { d, fill, evenOdd? }   a filled path
//   { d, stroke, sw }       a stroke with round caps and joins (capsules, closed eyes)
//   { t, kids }             a group with an SVG transform

// ── parts and the three shapes ──────────────────────────────────────────────
export const g = (t, ...kids) => ({ t, kids });
export const fill = (d, color, evenOdd = false) => ({ d, fill: color, evenOdd });
export const line = (d, color, sw) => ({ d, stroke: color, sw });

const f = (n) => Math.round(n * 100) / 100;

export function circle(cx, cy, r) {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
}

/** The rounded rectangle (the most used shape). */
export function rrect(x, y, w, h, r) {
  const q = Math.min(r, w / 2, h / 2);
  return (
    `M${f(x + q)} ${f(y)}H${f(x + w - q)}A${f(q)} ${f(q)} 0 0 1 ${f(x + w)} ${f(y + q)}` +
    `V${f(y + h - q)}A${f(q)} ${f(q)} 0 0 1 ${f(x + w - q)} ${f(y + h)}` +
    `H${f(x + q)}A${f(q)} ${f(q)} 0 0 1 ${f(x)} ${f(y + h - q)}V${f(y + q)}A${f(q)} ${f(q)} 0 0 1 ${f(x + q)} ${f(y)}Z`
  );
}

/** The pill: a fully rounded rectangle centered at (cx, cy). */
export function pill(cx, cy, w, h) {
  return rrect(cx - w / 2, cy - h / 2, w, h, Math.min(w, h) / 2);
}

/**
 * The tombstone: a half-circle top (radius w/2), straight sides and bottom
 * corners of radius r. When h <= w/2 it becomes a cap (an arc cut flat at the
 * bottom: straight bangs, a beanie).
 */
export function tomb(cx, top, w, h, r) {
  const R = w / 2;
  const yb = top + h;
  if (h <= R) {
    const half = Math.sqrt(R * R - (R - h) * (R - h));
    return `M${f(cx - half)} ${f(yb)}A${f(R)} ${f(R)} 0 0 1 ${f(cx + half)} ${f(yb)}Z`;
  }
  const q = Math.min(r, R, h - R);
  return (
    `M${f(cx - R)} ${f(top + R)}A${f(R)} ${f(R)} 0 0 1 ${f(cx + R)} ${f(top + R)}` +
    `V${f(yb - q)}A${f(q)} ${f(q)} 0 0 1 ${f(cx + R - q)} ${f(yb)}H${f(cx - R + q)}A${f(q)} ${f(q)} 0 0 1 ${f(cx - R)} ${f(yb - q)}Z`
  );
}

/** The rounded triangle with corners a, b, c and corner radius r. */
export function rtri(a, b, c, r) {
  const pts = [a, b, c];
  let d = '';
  for (let i = 0; i < 3; i++) {
    const p = pts[i];
    const prev = pts[(i + 2) % 3];
    const next = pts[(i + 1) % 3];
    const tp = unit([prev[0] - p[0], prev[1] - p[1]]);
    const tn = unit([next[0] - p[0], next[1] - p[1]]);
    const s = [p[0] + tp[0] * r, p[1] + tp[1] * r];
    const e = [p[0] + tn[0] * r, p[1] + tn[1] * r];
    d += `${i === 0 ? 'M' : 'L'}${f(s[0])} ${f(s[1])}Q${f(p[0])} ${f(p[1])} ${f(e[0])} ${f(e[1])}`;
  }
  return `${d}Z`;
}
function unit([x, y]) {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

// ── proportions (head = 100), measured on the guide's drawings ─────────────
/** The arm: thickness (about the neck), hand radius (diameter half the head), cuff = sleeve end center to hand center. */
export const ARM = { w: 38, hand: 25, cuff: 38 };
/** The thumb of a thumbs up: width 1/3 of the hand diameter, sticks out 0.63 x the hand radius past the fist. */
export const THUMB = { w: 16, out: 16 };
/** The shoulder: the center of the arm's round end, fully inside the torso. */
export const SHOULDER = { x: 46, y: 118 };
/** The eye: white pill 30 x 40, pupil pill 13 x 20 in the upper part. */
const EYE = { x: 19.5, y: -8, w: 30, h: 40, pw: 13, ph: 20, shine: 2.8 };
const FEATURE_W = 5;
const TEAR = '#7FD4FF';

// ── characters ──────────────────────────────────────────────────────────────
const FACE = { eyeWhite: '#FFFFFF', pupil: '#3C3C3C', mouth: '#B03A3A', tongue: '#F15A5A', teeth: '#FFFFFF' };

/**
 * Two example characters. A palette has: skin, skinShade (one step darker:
 * hands over the face, tired bags), feature (darker and saturated: nose,
 * closed eyes, closed mouth), hair, top + topShade (clothes), topTrim
 * (hoodie strings), bottom (pants), shoe.
 */
export const CHARACTERS = {
  bob: {
    hair: 'bob',
    clothes: 'sweater',
    nose: 'round',
    noseX: 2,
    palette: {
      skin: '#F5B092',
      skinShade: '#E8946F',
      feature: '#D97856',
      hair: '#7C3F25',
      top: '#FFAADE',
      topShade: '#F78BCB',
      topTrim: '#FFFFFF',
      bottom: '#2B70C9',
      shoe: '#FF4B4B',
      ...FACE,
    },
  },
  curls: {
    hair: 'curls',
    clothes: 'hoodie',
    nose: 'wide',
    noseX: 1,
    palette: {
      skin: '#FFCBA3',
      skinShade: '#F5B585',
      feature: '#E99B5F',
      hair: '#4A2C1C',
      top: '#FF9600',
      topShade: '#E08300',
      topTrim: '#FFFFFF',
      bottom: '#2B70C9',
      shoe: '#1CB0F6',
      ...FACE,
    },
  },
};

// ── the muted "before" version: a cool pastel ramp, never gray ─────────────
const MUTE_DARK = [74, 70, 128];
const MUTE_LIGHT = [222, 218, 255];
/** Clothes go this far down the ramp, or hands in front of them vanish (skin and pastel clothes share a lightness). */
const MUTE_CLOTHES_SHIFT = 0.18;
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(rgb) {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}
export function muteColor(hex, shift = 0) {
  const [r, gg, b] = hexToRgb(hex);
  const l = (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
  const t = Math.min(1, Math.max(0, (l - 0.1) / 0.8 - shift));
  return rgbToHex(MUTE_DARK.map((d, i) => d + (MUTE_LIGHT[i] - d) * t));
}
export function mute(p) {
  const out = { ...p };
  for (const k of Object.keys(out)) {
    if (k === 'eyeWhite' || k === 'teeth') continue;
    out[k] = muteColor(p[k], k === 'top' || k === 'topShade' ? MUTE_CLOTHES_SHIFT : 0);
  }
  return out;
}

// ── the face ────────────────────────────────────────────────────────────────
export const EXPRESSIONS = {
  neutral: { eyes: 'open', mouth: 'smile' },
  happy: { eyes: 'open', mouth: 'grin' },
  laugh: { eyes: 'closedHappy', mouth: 'laugh' },
  calm: { eyes: 'closedCalm', mouth: 'smile' },
  sigh: { eyes: 'closedTight', mouth: 'o' },
  stressed: { eyes: 'worried', mouth: 'grimace' },
  sad: { eyes: 'sad', mouth: 'sad', look: [0, 6] },
  tired: { eyes: 'tired', mouth: 'flat' },
  yawn: { eyes: 'closedTight', mouth: 'yawn' },
  wide: { eyes: 'wide', mouth: 'flat', look: [3, 0] },
  sleepless: { eyes: 'wide', mouth: 'flat', look: [2, -4], bags: true },
};

/** Eye cuts in units from the eye center: `lid` [outer, inner] hides everything above; `cheek` hides everything below. */
const CUTS = {
  tired: { lid: [-3, -3] },
  sad: { lid: [-5, -19] },
  worried: { lid: [-9, -21], cheek: [15, 12] },
};

function eye(side, e, p, happy, noseX) {
  const cx = side * EYE.x;
  const cy = EYE.y;
  const [lx, ly] = e.look ?? [0, 0];
  // a closed eye is a stroke in the nose color: center it on the nose so the inner end does not touch it
  const kx = noseX + side * EYE.x;
  if (e.eyes === 'closedHappy') return [line(`M${kx - 11} ${cy + 5}Q${kx} ${cy - 10} ${kx + 11} ${cy + 5}`, p.feature, FEATURE_W)];
  if (e.eyes === 'closedCalm') {
    return [line(`M${kx - side * 11} ${cy}H${kx + side * 4}Q${kx + side * 10} ${cy} ${kx + side * 11} ${cy + 7}`, p.feature, FEATURE_W)];
  }
  if (e.eyes === 'closedTight') {
    // ">" and "<": down from the outside toward the nose, back flat underneath
    const ox = kx + side * 10;
    const ix = kx - side * 10;
    const top = cy - 11;
    return [line(`M${ox} ${top}L${ix} ${top + 14}H${ox - side}`, p.feature, FEATURE_W)];
  }
  const half = EYE.w / 2;
  const out = [fill(pill(cx, cy, EYE.w, EYE.h), p.eyeWhite)];
  const pw = e.eyes === 'wide' ? 10 : EYE.pw;
  const ph = e.eyes === 'wide' ? 14 : EYE.ph;
  const top = cy - EYE.h / 2 + (e.eyes === 'wide' ? 9 : 7) + ly;
  const px = cx + lx - side * 2.5;
  out.push(fill(pill(px, top + ph / 2, pw, ph), p.pupil));
  // the shine dot, on the same side in both eyes
  out.push(fill(circle(px - pw * 0.22, top + EYE.shine + 1.6, EYE.shine), p.eyeWhite));
  const cut = { ...(CUTS[e.eyes] ?? {}), ...(happy ? { cheek: [10, 15] } : {}) };
  const xo = cx + side * (half + 2);
  const xi = cx - side * (half + 2);
  if (cut.lid) {
    const [o, i] = cut.lid;
    out.push(fill(`M${xo} ${cy - EYE.h}L${xi} ${cy - EYE.h}L${xi} ${cy + i}L${xo} ${cy + o}Z`, p.skin));
  }
  if (cut.cheek) {
    const [o, i] = cut.cheek;
    out.push(fill(`M${xo} ${cy + o}L${xi} ${cy + i}L${xi} ${cy + EYE.h}L${xo} ${cy + EYE.h}Z`, p.skin));
  }
  return out;
}

/** The mouth: pulled to one side, teeth and tongue in the middle. */
function mouth(e, p) {
  const out = [];
  const open = (x0, x1, top, depth, tilt) => {
    const mid = (x0 + x1) / 2;
    out.push(
      fill(`M${x0} ${top}L${x1} ${top - tilt}Q${x1 + 2} ${top + depth} ${mid} ${top + depth}Q${x0 - 2} ${top + depth} ${x0} ${top}Z`, p.mouth),
    );
    const tr = Math.min(depth * 0.36, (x1 - x0) * 0.22);
    out.push(fill(circle(mid + 1, top + depth - tr - 1.5, tr), p.tongue));
    out.push(fill(`M${x0 + 1} ${top}L${x1 - 1} ${top - tilt}L${x1 - 1.5} ${top - tilt + 5}L${x0 + 1.5} ${top + 5}Z`, p.teeth));
  };
  switch (e.mouth) {
    case 'smile':
      out.push(line('M-8 28Q3 37 15 24', p.feature, FEATURE_W));
      break;
    case 'grin':
      // only the teeth: a crooked white half moon
      out.push(fill('M-13 24L17 18Q19 40 3 40Q-10 39 -13 24Z', p.teeth));
      break;
    case 'laugh':
      open(-16, 18, 22, 22, 6);
      break;
    case 'flat':
      out.push(line('M-5 30H10', p.feature, FEATURE_W));
      break;
    case 'sad':
      out.push(line('M-7 34Q3 26 13 33', p.feature, FEATURE_W));
      break;
    case 'o':
      out.push(fill(circle(4, 32, 6.5), p.mouth));
      break;
    case 'yawn':
      out.push(fill(pill(3, 34, 20, 28), p.mouth), fill(circle(3, 41, 7), p.tongue));
      break;
    case 'grimace':
      out.push(fill(rrect(-12, 23, 27, 13, 6.5), p.teeth));
      break;
  }
  return out;
}

export function face(ch, e, p) {
  const happy = e.mouth === 'grin' && (e.eyes === 'open' || e.eyes === 'wide');
  const tear =
    e.eyes === 'sad'
      ? [
          fill(circle(-EYE.x - 9, EYE.y + 27, 5), TEAR),
          fill(rtri([-EYE.x - 9, EYE.y + 13], [-EYE.x - 13.8, EYE.y + 26], [-EYE.x - 4.2, EYE.y + 26], 1.5), TEAR),
        ]
      : [];
  const bags = e.bags
    ? [-1, 1].map((s) => line(`M${s * EYE.x - 10} ${EYE.y + 24}Q${s * EYE.x} ${EYE.y + 28} ${s * EYE.x + 10} ${EYE.y + 24}`, p.skinShade, 3.4))
    : [];
  const nose =
    ch.nose === 'round'
      ? [fill(pill(2, -2, 8, 22), p.feature), fill(circle(2, 9, 6.5), p.feature)]
      : [fill(pill(1, -3, 10, 22), p.feature), fill(rrect(-7, 4, 16, 10, 5), p.feature)];
  return [...bags, ...eye(-1, e, p, happy, ch.noseX), ...eye(1, e, p, happy, ch.noseX), ...nose, ...mouth(e, p), ...tear];
}

// ── head and hair ───────────────────────────────────────────────────────────
const HEAD_D = tomb(0, -66, 100, 122, 26);

/** Hair behind the head (drawn before the arms, neck and body). */
export function hairBack(ch, p) {
  // the bob: a tombstone down to the chin, the same color as the bangs (they read as one shape)
  return ch.hair === 'bob' ? [fill(tomb(0, -80, 128, 146, 20), p.hair)] : [];
}

function topRound(x, y, w, h, r) {
  const q = Math.min(r, w / 2, h);
  return `M${f(x)} ${f(y + h)}V${f(y + q)}A${f(q)} ${f(q)} 0 0 1 ${f(x + q)} ${f(y)}H${f(x + w - q)}A${f(q)} ${f(q)} 0 0 1 ${f(x + w)} ${f(y + q)}V${f(y + h)}Z`;
}

/** Curls: circles of different sizes (rhythm) over a close-cropped base with the face cut out (even-odd). */
const CURLS = [
  [-32, -66, 22],
  [-8, -82, 26],
  [22, -80, 25],
  [42, -60, 20],
];

/** The head with the face and the front hair. */
export function head(ch, e, p) {
  const out = [];
  if (ch.hair === 'curls') out.push(fill(circle(-50, 2, 11), p.skin), fill(circle(50, 2, 11), p.skin));
  out.push(fill(HEAD_D, p.skin), ...face(ch, e, p));
  if (ch.hair === 'bob') {
    // straight bangs down to just above the eyes
    out.push(fill(tomb(0, -75, 112, 42, 0), p.hair));
  } else {
    out.push(...CURLS.map(([x, y, r]) => fill(circle(x, y, r), p.hair)));
    // the base goes down to above the ear (always hair above the ear)
    out.push(fill(tomb(0, -74, 110, 64, 8) + topRound(-39, -42, 78, 32, 18), p.hair, true));
  }
  return out;
}

export function neck(p) {
  return [fill(rrect(-14, 40, 28, 40, 6), p.skin), fill(rrect(-14, 40, 28, 14, 6), p.feature)];
}

// ── the body ────────────────────────────────────────────────────────────────
/** The torso: a tombstone (half-circle top = round shoulders), down to `bottom`. */
export function torso(ch, p, bottom = 250) {
  const top = 68;
  if (ch.clothes === 'sweater') {
    return [fill(tomb(0, top, 144, bottom - top, 30), p.top), fill(pill(0, 70, 40, 14), p.topShade)];
  }
  // the hoodie: the hood behind the neck, the body, the neck opening and the strings
  return [
    fill(pill(0, 74, 70, 22), p.topShade),
    fill(tomb(0, top, 148, bottom - top, 30), p.top),
    fill(pill(0, 72, 46, 16), p.topShade),
    line('M-9 82V108', p.topTrim, 4.6),
    line('M9 82V104', p.topTrim, 4.6),
  ];
}

// ── arms and hands ──────────────────────────────────────────────────────────
/** The hand in its own frame: center at (0, 0), the forearm arriving from below (the hand points to -y). */
function handLocal(kind, side, p) {
  const r = ARM.hand;
  const fist = fill(circle(0, 0, r), p.skin);
  if (kind === 'thumbsUp') {
    const top = -r - THUMB.out;
    return [fist, fill(rrect(-side * 0.42 * r - THUMB.w / 2, top, THUMB.w, -top, THUMB.w / 2), p.skin)];
  }
  return [fist];
}

/**
 * One arm: the hand, then the sleeve over it (one capsule, or two sharing a
 * round elbow) ending ARM.cuff before the hand center.
 *   spec = { from: [x, y] shoulder inside the torso, elbow?: [x, y], to: [x, y] hand center,
 *            hand: 'ball' | 'thumbsUp', side: -1 (left of the image) | 1,
 *            front?: arm in front of the body, shadeHand?: hand over the face,
 *            handOver?: hand drawn above all front sleeves (gripping the other arm, holding an object) }
 * `only` returns just the 'sleeve' or just the 'hand'.
 */
export function arm(spec, p, only) {
  const [hx, hy] = spec.to;
  const [bx, by] = spec.elbow ?? spec.from;
  const len = Math.hypot(hx - bx, hy - by) || 1;
  const ux = (hx - bx) / len;
  const uy = (hy - by) / len;
  const cuff = [hx - ux * ARM.cuff, hy - uy * ARM.cuff];
  const pts = spec.elbow ? [spec.from, spec.elbow, cuff] : [spec.from, cuff];
  const angle = (Math.atan2(uy, ux) * 180) / Math.PI + 90;
  const skin = spec.shadeHand ? { ...p, skin: p.skinShade } : p;
  const hand = g(`translate(${f(hx)} ${f(hy)}) rotate(${f(angle)})`, ...handLocal(spec.hand, spec.side, skin));
  const sleeve = line(`M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}`, p.top, ARM.w);
  if (only === 'sleeve') return [sleeve];
  if (only === 'hand') return [hand];
  return [hand, sleeve];
}

/** A floor shadow: a pill, never an oval. */
export function floorShadow(cx, y, w, color) {
  return fill(pill(cx, y, w, 10), color);
}

// ── poses ───────────────────────────────────────────────────────────────────
const S = SHOULDER;

/**
 * The upper body, in the layer order of SKILL.md section 9: back hair, arms
 * behind, neck, torso, head, `under`, front sleeves, `held`, gripping hands,
 * `over`.
 */
function bust(ch, e, p, arms, extra = {}) {
  return [
    ...hairBack(ch, p),
    ...arms.filter((a) => !a.front).flatMap((a) => arm(a, p)),
    ...neck(p),
    ...torso(ch, p, 250),
    ...head(ch, e, p),
    ...(extra.under ?? []),
    ...arms.filter((a) => a.front).flatMap((a) => arm(a, p, a.handOver ? 'sleeve' : undefined)),
    ...(extra.held ?? []),
    ...arms.filter((a) => a.front && a.handOver).flatMap((a) => arm(a, p, 'hand')),
    ...(extra.over ?? []),
  ];
}

/** A hanging arm: one straight capsule from inside the torso, about 9 degrees out, hand at the hip. */
const hanging = (side) => ({ from: [side * S.x, S.y], to: [side * 80, 252], hand: 'ball', side });

function phone(cx, cy, angle, screen, k = 1) {
  return g(
    `rotate(${angle} ${cx} ${cy})`,
    fill(rrect(cx - 11 * k, cy - 20 * k, 22 * k, 40 * k, 6 * k), '#3C3C3C'),
    fill(rrect(cx - 8 * k, cy - 16 * k, 16 * k, 31 * k, 3 * k), screen),
  );
}

function coffee(cx, cy) {
  return [
    fill(rrect(cx - 20, cy - 28, 40, 56, 10), '#FFFFFF'),
    fill(rrect(cx - 20, cy - 10, 40, 18, 0), '#FF9600'),
    fill(rrect(cx - 24, cy - 39, 48, 15, 7.5), '#3C3C3C'),
  ];
}

/** Lying in bed: pillow, hair, head, then the hands BEHIND the blanket edge (only their top half shows). */
function lying(ch, e, p, bed) {
  return [
    fill(rrect(-100, -76, 200, 124, 40), bed.pillow),
    ...hairBack(ch, p).map((q) => g('translate(0 -8) scale(1.06 0.66)', q)),
    ...neck(p),
    ...head(ch, e, p),
    fill(circle(-38, 76, ARM.hand), p.skin),
    fill(circle(38, 76, ARM.hand), p.skin),
    fill(rrect(-160, 72, 320, 220, 40), bed.blanket),
    fill(rrect(-160, 72, 320, 32, 16), bed.fold),
  ];
}

const COFFEE = { x: -40, y: 146 };

export const POSES = {
  /** Hand on the forehead, eyes squeezed (a sigh). The hand over the face is one skin shade darker. */
  sighing: (ch, p) =>
    bust(ch, EXPRESSIONS.sigh, p, [
      hanging(-1),
      { from: [S.x, S.y], elbow: [114, 30], to: [30, -50], hand: 'ball', side: 1, front: true, shadeHand: true },
    ]),

  /** Both arms up in a V, fists, laughing. */
  cheering: (ch, p) =>
    bust(ch, EXPRESSIONS.laugh, p, [
      { from: [-S.x, S.y], to: [-128, -42], hand: 'ball', side: -1 },
      { from: [S.x, S.y], to: [128, -42], hand: 'ball', side: 1 },
    ]),

  /** Thumbs up: elbow out, forearm standing, segments of equal length. */
  thumbsUp: (ch, p) =>
    bust(ch, EXPRESSIONS.happy, p, [hanging(1), { from: [-S.x, S.y], elbow: [-116, 158], to: [-112, 76], hand: 'thumbsUp', side: -1 }]),

  /** Self hug, sad and cold: forearms merged with the sweater, hands gripping the other arm at the silhouette edge. */
  selfHug: (ch, p) =>
    bust(ch, EXPRESSIONS.sad, p, [
      { from: [S.x, S.y], elbow: [84, 184], to: [-64, 148], hand: 'ball', side: 1, front: true, handOver: true },
      { from: [-S.x, S.y], elbow: [-84, 184], to: [66, 132], hand: 'ball', side: -1, front: true, handOver: true },
    ]),

  /** Holding the head at the temples, elbows on a desk (stress). The scene's desk hides everything below y ~150. */
  holdHead: (ch, p) =>
    bust(ch, { eyes: 'closedTight', mouth: 'sad' }, p, [
      { from: [-S.x, S.y], elbow: [-86, 178], to: [-58, -16], hand: 'ball', side: -1, front: true, shadeHand: true },
      { from: [S.x, S.y], elbow: [86, 178], to: [58, -16], hand: 'ball', side: 1, front: true, shadeHand: true },
    ]),

  /** Scrolling a phone held with both hands at the chest; the phone goes in front of the hands. */
  scrolling: (ch, p) =>
    bust(
      ch,
      { eyes: 'tired', mouth: 'flat', look: [-2, 9] },
      p,
      [
        { from: [-S.x, S.y], elbow: [-86, 192], to: [-26, 150], hand: 'ball', side: -1, front: true },
        { from: [S.x, S.y], elbow: [86, 192], to: [26, 150], hand: 'ball', side: 1, front: true },
      ],
      { over: [phone(0, 130, 0, '#1CB0F6', 1.4)] },
    ),

  /** Phone at the ear and coffee in hand: sleeve, then cup, then the hand gripping it. */
  phoneAndCoffee: (ch, p) =>
    bust(
      ch,
      { eyes: 'open', mouth: 'grin', look: [4, 0] },
      p,
      [
        { from: [S.x, S.y], elbow: [120, 60], to: [58, 0], hand: 'ball', side: 1, front: true },
        { from: [-S.x, S.y], elbow: [-96, 196], to: [COFFEE.x - 26, COFFEE.y + 14], hand: 'ball', side: -1, front: true, handOver: true },
      ],
      { under: [phone(52, -22, 14, '#1CB0F6')], held: coffee(COFFEE.x, COFFEE.y) },
    ),

  /** Cross-legged, eyes closed, straight arms down to the hands on the knees. */
  meditating: (ch, p) => [
    ...hairBack(ch, p),
    ...neck(p),
    ...torso(ch, p, 256),
    line('M-92 262L44 284', p.bottom, 34),
    line('M92 262L-44 284', p.bottom, 34),
    fill(pill(-56, 290, 34, 18), p.shoe),
    fill(pill(56, 290, 34, 18), p.shoe),
    ...arm({ from: [-S.x, S.y], to: [-98, 250], hand: 'ball', side: -1 }, p),
    ...arm({ from: [S.x, S.y], to: [98, 250], hand: 'ball', side: 1 }, p),
    ...head(ch, EXPRESSIONS.calm, p),
  ],

  /** Lying in bed, awake, holding the blanket. */
  lyingAwake: (ch, p) => lying(ch, { eyes: 'tired', mouth: 'flat' }, p, { pillow: '#FFFFFF', blanket: '#2B70C9', fold: '#1CB0F6' }),
};

/** Parts for one pose: person('cheering', { character: 'curls', muted: true }). */
export function person(poseId, { character = 'bob', muted = false } = {}) {
  const ch = CHARACTERS[character];
  const p = muted ? mute(ch.palette) : ch.palette;
  return POSES[poseId](ch, p);
}

// ── SVG output ──────────────────────────────────────────────────────────────
export function partToSvg(part) {
  if ('kids' in part) return `<g transform="${part.t}">${part.kids.map(partToSvg).join('')}</g>`;
  if (part.stroke) {
    return `<path d="${part.d}" fill="none" stroke="${part.stroke}" stroke-width="${part.sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return `<path d="${part.d}" fill="${part.fill}"${part.evenOdd ? ' fill-rule="evenodd"' : ''}/>`;
}

/** A standalone SVG of parts placed with the head center at (x, y) and the given scale. */
export function toSvg(parts, { width = 400, height = 420, x = 200, y = 130, scale = 1, background } = {}) {
  const bg = background ? `<rect width="${width}" height="${height}" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bg}<g transform="translate(${x} ${y}) scale(${scale})">${parts.map(partToSvg).join('')}</g></svg>`;
}
