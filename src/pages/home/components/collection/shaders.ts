export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec2  uRes;
  uniform float uDpr;
  uniform float uSliderY;
  uniform float uOffset;
  uniform float uPart;   // não é mais usado: a camisa nunca abre por completo
  uniform float uVel;
  uniform float uTime;
  uniform vec2  uMouse;
  varying vec2  vUv;

  // ==========================================================
  //  CONSTANTS
  // ==========================================================
  const float PI          = 3.14159265359;
  const float TAU         = 6.28318530718;

  const float V_SPREAD    = 5.0;   // parabolic opening rate (acima do slider)
  const float EDGE_MIN    = 0.008; // half-width when zipper closed

  const float TOOTH_ROWS  = 80.0;
  const float ROW_H       = 1.0 / TOOTH_ROWS;
  const float TAPE_WIDTH  = 0.090;
  const float TOOTH_DEPTH = 0.022;
  const float STITCH_UV   = 0.70;

  // ==========================================================
  //  NOISE
  // ==========================================================
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  float sfbm(vec2 p) {
    return 0.55 * vnoise(p)
         + 0.30 * vnoise(p * 2.1 + 5.2)
         + 0.15 * vnoise(p * 4.3 - 3.1);
  }

  float ridged(vec2 p) {
    float n = vnoise(p);
    return pow(1.0 - abs(2.0 * n - 1.0), 2.0);
  }

  float ridgefbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * ridged(p);
      p = p * 2.07 + vec2(3.1, 7.7);
      a *= 0.5;
    }
    return v;
  }

  // ==========================================================
  //  EDGE GEOMETRY
  //    eR > 0  -> borda interna da metade DIREITA
  //    eL < 0  -> borda interna da metade ESQUERDA
  //  Sem mistura final: a camisa nunca abre por completo.
  // ==========================================================
  float edgeMagnitude(float y, float side) {
    float d = max(y - uSliderY, 0.0);
    float along = y - uOffset;
    float open = smoothstep(0.0, 0.14, d);

    float base = V_SPREAD * d * d;

    float n1 = fbm(vec2(along * 1.8 + side * 4.7, 1.0));
    float n2 = fbm(vec2(along * 4.5 + side * 2.3, 7.0));
    float wobble = (n1 - 0.5) * 0.10 + (n2 - 0.5) * 0.03;
    wobble *= smoothstep(0.0, 0.30, d);

    float anim = sin(along * 3.5 + uTime * 1.2 + side * 1.5) * uVel * 0.015;

    return (base + wobble + anim) * open + EDGE_MIN;
  }

  vec2 edges(float y) {
    float eR =  edgeMagnitude(y,  1.0);
    float eL = -edgeMagnitude(y, -1.0);
    return vec2(eL, eR);
  }

  // ==========================================================
  //  FABRIC HEIGHT FIELD
  // ==========================================================
  float fabricHeight(vec2 q, vec2 mq) {
    vec2 qt = vec2(q.x, q.y - uOffset);
    vec2 ed = edges(q.y);

    float dR    = q.x - ed.y;
    float dL    = ed.x - q.x;
    float dEdge = min(abs(ed.y - q.x), abs(ed.x - q.x));

    float dSlide = q.y - uSliderY;

    float drapePh = qt.x * 4.5 + fbm(vec2(qt.y * 0.6, 1.0)) * 2.5;
    float drape   = (sin(drapePh) + 0.7 * sin(drapePh * 0.55 + 1.7)) * 0.5;

    float edgePh   = dEdge * 30.0 + fbm(vec2(qt.y * 3.0, 2.0)) * 3.0;
    float edgeFold = sin(edgePh) * exp(-dEdge * 6.0);

    float rSlider   = length(vec2(q.x, dSlide));
    float angSlider = atan(q.x, max(dSlide, 0.01));
    float radial    = sin(angSlider * 22.0 + fbm(qt * 4.0) * 2.5) * exp(-rSlider * 3.0);
    radial *= smoothstep(0.0, 0.05, dSlide);

    float crinkle1 = ridgefbm(qt * 10.0) - 0.55;
    float crinkle2 = ridged(qt * 25.0 + 4.0) - 0.45;
    float sag      = sfbm(qt * 0.6 + 10.0) - 0.5;

    vec2 dm = q - mq;
    float mouse = exp(-dot(dm, dm) * 6.0) * 0.030;

    float h = drape * 0.008
            + edgeFold * 0.005
            + radial * 0.008
            + crinkle1 * 0.004
            + crinkle2 * 0.002
            + sag * 0.010
            + mouse;

    float inFabric = max(dR, dL);
    h *= smoothstep(0.0, 0.04, inFabric);
    return h;
  }

  // ==========================================================
  //  WOVEN TEXTURE
  // ==========================================================
  float sampleWeave(vec2 pix, float scale, out float threadH) {
    float ts = scale * uDpr;
    vec2 c  = pix / ts;
    vec2 id = floor(c);
    vec2 f  = fract(c) - 0.5;

    float over = mod(id.x + id.y, 2.0);

    float warp = sqrt(max(0.0, 1.0 - 3.0 * f.x * f.x));
    float weft = sqrt(max(0.0, 1.0 - 3.0 * f.y * f.y));

    float slubV = 0.78 + 0.45 * vnoise(vec2(id.x * 0.3, id.y * 3.1));
    float slubH = 0.78 + 0.45 * vnoise(vec2(id.x * 3.1, id.y * 0.3));

    float top, under;
    if (over < 0.5) {
      top   = warp * slubV;
      under = weft * 0.20;
    } else {
      top   = weft * slubH;
      under = warp * 0.20;
    }

    threadH = max(top, under);

    float fuzz = (vnoise(pix * 3.7) - 0.5) * 0.09;
    float lint = (vnoise(pix * 0.9 + 11.0) - 0.5) * 0.05;

    float chanX = smoothstep(0.42, 0.50, abs(f.x));
    float chanY = smoothstep(0.42, 0.50, abs(f.y));
    float chan  = over < 0.5 ? chanY : chanX;

    return clamp(0.42 + threadH * 0.58 - chan * 0.28 + fuzz + lint, 0.0, 1.0);
  }

  // ==========================================================
  //  TOOTH SDF  (ponta na origem, corpo se estende para +x, dentro da fita)
  // ==========================================================
  float toothSDF(vec2 p) {
    float py = abs(p.y);

    vec2 bc = vec2(0.0050, 0.0);
    vec2 bh = vec2(0.0050, ROW_H * 0.37);
    vec2 qB = abs(vec2(p.x, py) - bc) - bh + 0.0013;
    float dB = length(max(qB, 0.0)) + min(max(qB.x, qB.y), 0.0) - 0.0015;

    vec2 hc = vec2(0.0165, 0.0);
    vec2 hh = vec2(0.0052, ROW_H * 0.28);
    vec2 qH = abs(vec2(p.x, py) - hc) - hh + 0.0019;
    float dH = length(max(qH, 0.0)) + min(max(qH.x, qH.y), 0.0) - 0.0023;

    float k = 0.0035;
    float blend = clamp(0.5 + 0.5 * (dH - dB) / k, 0.0, 1.0);
    float d = mix(dH, dB, blend) - k * blend * (1.0 - blend);

    vec2 nc = vec2(0.0220, 0.0);
    vec2 nh = vec2(0.0008, ROW_H * 0.14);
    vec2 qN = abs(vec2(p.x, py) - nc) - nh;
    float dN = length(max(qN, 0.0)) + min(max(qN.x, qN.y), 0.0) - 0.0006;
    d = max(d, -dN);

    return d;
  }

  // ==========================================================
  //  METAL SHADING
  // ==========================================================
  vec3 metalShade(vec3 n, float ao, vec2 pT) {
    vec3 V = vec3(0.0, 0.0, 1.0);

    vec3 L1 = normalize(vec3(-0.55,  0.65, 0.72));
    vec3 L2 = normalize(vec3( 0.60,  0.15, 0.85));
    vec3 L3 = normalize(vec3( 0.15, -0.40, 0.90));

    vec3 H1 = normalize(L1 + V);
    vec3 H2 = normalize(L2 + V);
    vec3 H3 = normalize(L3 + V);

    float NdL1 = max(dot(n, L1), 0.0);
    float NdL2 = max(dot(n, L2), 0.0);
    float NdL3 = max(dot(n, L3), 0.0);

    float brush = 0.5 + 0.5 * vnoise(vec2(pT.y * 280.0, pT.x * 12.0));

    float NdH1 = max(dot(n, H1), 0.0);
    float NdH2 = max(dot(n, H2), 0.0);
    float NdH3 = max(dot(n, H3), 0.0);

    float spec1 = pow(NdH1, 170.0 + brush * 80.0) * (1.9 + brush * 0.9);
    float spec2 = pow(NdH2,  55.0) * 0.70;
    float spec3 = pow(NdH3,  22.0) * 0.18;

    float fres = pow(1.0 - max(dot(n, V), 0.0), 3.2);

    vec3 base = vec3(0.78, 0.79, 0.83);
    vec3 warm = vec3(1.00, 0.96, 0.88);

    vec3 col = base * 0.08;
    col += base * (NdL1 * 0.55 + NdL2 * 0.30 + NdL3 * 0.18);
    col += warm * (spec1 + spec2 + spec3);
    col += base * fres * 0.55;

    col = mix(vec3(col.r * 0.90, col.g * 0.95, col.b * 1.05), col, 0.70);
    return col * ao;
  }

  // ==========================================================
  //  PREMULTIPLIED OVER
  // ==========================================================
  void over(inout vec3 col, inout float a, vec3 srcCol, float srcA) {
    col = srcCol * srcA + col * (1.0 - srcA);
    a   = srcA + a * (1.0 - srcA);
  }

  // ==========================================================
  //  MAIN
  // ==========================================================
  void main() {
    float asp    = uRes.x / uRes.y;
    float pxSize = 1.0 / uRes.y;

    vec2 q   = vec2((vUv.x - 0.5) * asp, vUv.y);
    vec2 qt  = vec2(q.x, q.y - uOffset);
    vec2 pix = vec2(gl_FragCoord.x, gl_FragCoord.y - uOffset * uRes.y);
    vec2 mq  = vec2((uMouse.x - 0.5) * asp, uMouse.y);

    // ----- Bordas do tecido -----
    vec2 ed = edges(q.y);
    float eL = ed.x;
    float eR = ed.y;

    // ----- Máscara de tecido -----
    float insideR = q.x - eR;
    float insideL = eL - q.x;
    float dn = max(insideR, insideL);

    float gradDn = length(vec2(dFdx(dn), dFdy(dn)));
    float aaW    = max(1.5 * gradDn, 0.5 * pxSize);
    float fabricMask = smoothstep(-aaW, aaW, dn);

    // Fecha o vão central onde o zíper está fechado
    float dSlider = q.y - uSliderY;
    float isClosed = 1.0 - smoothstep(0.0, 0.18, dSlider);
    float centerFill = smoothstep(0.018, 0.006, abs(q.x)) * isClosed;
    fabricMask = max(fabricMask, centerFill);

    // ----- Normais do tecido -----
    float e  = 0.002;
    float h0 = fabricHeight(q, mq);
    float hx = fabricHeight(q + vec2(e, 0.0), mq);
    float hy = fabricHeight(q + vec2(0.0, e), mq);
    vec3 nFabric = normalize(vec3(-(hx - h0) / e, -(hy - h0) / e, 1.0));

    // ----- Cor do tecido -----
    float threadH;
    float weaveLum = sampleWeave(pix, 2.6, threadH);

    float wash = fbm(qt * 4.0 + 3.0);

    vec3 baseCol = vec3(0.075, 0.078, 0.090);
    vec3 fabricColor = baseCol * (0.45 + 0.85 * weaveLum);
    fabricColor *= 0.85 + 0.30 * wash;

    float crown = smoothstep(0.70, 1.0, threadH);
    fabricColor += crown * vec3(0.055, 0.055, 0.065);

    vec3 L = normalize(vec3(-0.5, 0.7, 0.65));
    vec3 V = vec3(0.0, 0.0, 1.0);

    float NdL   = dot(nFabric, L);
    float lit   = 0.30 + 1.05 * pow(max(NdL * 0.5 + 0.5, 0.0), 1.6);
    float sheen = pow(1.0 - clamp(nFabric.z, 0.0, 1.0), 1.5) * 0.15;

    fabricColor = fabricColor * lit + sheen * vec3(0.90, 0.92, 1.00) * 0.6;
    fabricColor *= 1.0 + clamp(h0 * 12.0, -0.30, 0.25);

    float rim = 1.0 - smoothstep(0.0, 6.0 * aaW, dn);
    fabricColor += rim * vec3(0.55, 0.55, 0.62) * 0.10;

    fabricColor *= 1.0 - 0.30 * length(vUv - 0.5);

    // ==========================================================
    //  FITA DO ZÍPER  (CORRIGIDA: cada fita fica do seu lado)
    //  tapeR: 0 na borda direita, cresce para a DIREITA
    //  tapeL: 0 na borda esquerda, cresce para a ESQUERDA
    // ==========================================================
    float tapeR = q.x - eR;
    float tapeL = eL - q.x;

    float tapeMaskR = smoothstep(-aaW, aaW, tapeR)
                    * (1.0 - smoothstep(TAPE_WIDTH - aaW, TAPE_WIDTH + aaW, tapeR));
    float tapeMaskL = smoothstep(-aaW, aaW, tapeL)
                    * (1.0 - smoothstep(TAPE_WIDTH - aaW, TAPE_WIDTH + aaW, tapeL));
    float tapeMask = max(tapeMaskR, tapeMaskL);

    float tapeThreadH;
    float tapeWeave = sampleWeave(pix * 1.35 + vec2(31.0, 17.0), 2.0, tapeThreadH);

    vec3 tapeBase  = vec3(0.115, 0.120, 0.135);
    vec3 tapeColor = tapeBase * (0.55 + 0.75 * tapeWeave);
    tapeColor *= 0.55 + 0.45 * pow(max(dot(vec3(0.0, 0.5, 1.0), L), 0.0), 1.2);

    // Costura tracejada
    float stitchPos  = TAPE_WIDTH * STITCH_UV;
    float stitchDist = min(abs(tapeR - stitchPos), abs(tapeL - stitchPos));

    float stitchSpacing = ROW_H * 0.42;
    float stitchPhase   = fract((q.y - uOffset) / stitchSpacing);
    float stitchDash    = smoothstep(0.0, 0.08, stitchPhase)
                        * (1.0 - smoothstep(0.55, 0.68, stitchPhase));

    float stitchLine = 1.0 - smoothstep(0.0013, 0.0024, stitchDist);
    float stitch     = stitchLine * stitchDash * tapeMask;

    tapeColor = mix(tapeColor, tapeColor * 0.22, stitch);
    tapeColor *= 1.0 + 0.10 * stitchLine * tapeMask;

    // Sulco na borda externa da fita (onde ela encontra o tecido)
    float groove = 1.0 - smoothstep(0.0, 2.5 * aaW, abs(dn - TAPE_WIDTH));
    fabricColor *= 1.0 - 0.55 * groove;
    tapeColor   *= 1.0 - 0.40 * groove;

    // ==========================================================
    //  DENTES
    // ==========================================================
    float rowF = (q.y - uOffset) * TOOTH_ROWS;

    float lyR = fract(rowF)       - 0.5;
    float lyL = fract(rowF + 0.5) - 0.5;   // meia linha de offset -> intercalados

    vec2 pR = vec2(tapeR, lyR);
    vec2 pL = vec2(tapeL, lyL);

    float dTR = toothSDF(pR);
    float dTL = toothSDF(pL);

    float toothMaskR = 1.0 - smoothstep(-aaW, aaW, dTR);
    float toothMaskL = 1.0 - smoothstep(-aaW, aaW, dTL);

    // mantém cada dente dentro da sua própria fita
    toothMaskR *= smoothstep(-aaW, aaW, TAPE_WIDTH - tapeR);
    toothMaskL *= smoothstep(-aaW, aaW, TAPE_WIDTH - tapeL);
    float toothMask = max(toothMaskR, toothMaskL);

    // Sombra de contato do dente sobre a fita
    float contact = exp(-max(dTR, dTL) * 35.0) * 0.65;
    tapeColor *= 1.0 - contact * 0.75;

    vec3 toothColor = vec3(0.0);
    if (toothMask > 0.001) {
      bool right = toothMaskR > toothMaskL;
      vec2 pT    = right ? pR : pL;
      float dT   = right ? dTR : dTL;
      // direita: +x local = +x mundo | esquerda: +x local = -x mundo
      float side = right ? 1.0 : -1.0;

      float eps = 0.0004;
      vec2 g = vec2(
        toothSDF(pT + vec2(eps, 0.0)) - toothSDF(pT - vec2(eps, 0.0)),
        toothSDF(pT + vec2(0.0, eps)) - toothSDF(pT - vec2(0.0, eps))
      ) / (2.0 * eps);

      vec3 nTooth = normalize(vec3(g.x * side, g.y, 1.5));

      float R  = 0.0038;
      float hd = clamp(-dT, 0.0, R);
      float ao = 0.50 + 0.50 * (hd / R);
      ao *= 0.85 + 0.15 * smoothstep(0.0, 0.15, q.y - uSliderY);

      float toothId = floor(rowF + (right ? 0.0 : 0.5));
      float variation = vnoise(vec2(toothId * 1.7, right ? 3.1 : 7.9));

      toothColor = metalShade(nTooth, ao, pT);
      toothColor *= 0.92 + 0.16 * variation;

      float topGlint = smoothstep(0.70, 1.0, -dT / R);
      toothColor += vec3(1.0, 0.98, 0.94) * topGlint * 0.18;
    }

    // ==========================================================
    //  COMPOSIÇÃO  (premultiplied)
    // ==========================================================
    vec3 col = vec3(0.0);
    float a  = 0.0;

    // Sombra do tecido sobre o HTML
    float shadowA = exp(-max(-dn, 0.0) * 14.0) * 0.55 * (1.0 - fabricMask);
    over(col, a, vec3(0.0), shadowA);

    // Tecido
    over(col, a, fabricColor, fabricMask);

    // Fita
    over(col, a, tapeColor, tapeMask);

    // Dentes
    over(col, a, toothColor, toothMask);

    gl_FragColor = vec4(col, a);
  }
`;