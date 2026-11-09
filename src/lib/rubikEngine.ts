export type CubeFace = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

export interface CubeState {
  U: CubeFace[];
  D: CubeFace[];
  F: CubeFace[];
  B: CubeFace[];
  L: CubeFace[];
  R: CubeFace[];
}

export const RubikEngine = {
  FACE_COLORS: {
    U: '#f8fafc', // White
    D: '#eab308', // Yellow
    F: '#22c55e', // Green
    B: '#3b82f6', // Blue
    L: '#f97316', // Orange
    R: '#ef4444'  // Red
  } as Record<CubeFace, string>,

  generateScramble(length = 20): string {
    const faces: CubeFace[] = ['R', 'L', 'U', 'D', 'F', 'B'];
    const modifiers = ['', "'", '2'];
    const opposites: Record<string, string> = {
      R: 'L', L: 'R', U: 'D', D: 'U', F: 'B', B: 'F'
    };

    const moves: string[] = [];
    let lastFace = '';
    let secondLastFace = '';

    for (let i = 0; i < length; i++) {
      const validFaces = faces.filter(f => {
        if (f === lastFace) return false;
        if (f === secondLastFace && opposites[f] === lastFace) return false;
        return true;
      });

      const face = validFaces[Math.floor(Math.random() * validFaces.length)];
      const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
      moves.push(face + mod);

      secondLastFace = lastFace;
      lastFace = face;
    }

    return moves.join(' ');
  },

  createCubeState(): CubeState {
    return {
      U: Array(9).fill('U'),
      D: Array(9).fill('D'),
      F: Array(9).fill('F'),
      B: Array(9).fill('B'),
      L: Array(9).fill('L'),
      R: Array(9).fill('R')
    };
  },

  applySingleMove(faces: CubeState, face: CubeFace) {
    const f = faces[face];
    faces[face] = [f[6], f[3], f[0], f[7], f[4], f[1], f[8], f[5], f[2]];

    const { U, D, F, B, L, R } = faces;
    if (face === 'U') {
      const t = [F[0], F[1], F[2]];
      F[0] = R[0]; F[1] = R[1]; F[2] = R[2];
      R[0] = B[0]; R[1] = B[1]; R[2] = B[2];
      B[0] = L[0]; B[1] = L[1]; B[2] = L[2];
      L[0] = t[0]; L[1] = t[1]; L[2] = t[2];
    } else if (face === 'D') {
      const t = [F[6], F[7], F[8]];
      F[6] = L[6]; F[7] = L[7]; F[8] = L[8];
      L[6] = B[6]; L[7] = B[7]; L[8] = B[8];
      B[6] = R[6]; B[7] = R[7]; B[8] = R[8];
      R[6] = t[0]; R[7] = t[1]; R[8] = t[2];
    } else if (face === 'R') {
      const t = [U[2], U[5], U[8]];
      U[2] = F[2]; U[5] = F[5]; U[8] = F[8];
      F[2] = D[2]; F[5] = D[5]; F[8] = D[8];
      D[2] = B[6]; D[5] = B[3]; D[8] = B[0];
      B[6] = t[0]; B[3] = t[1]; B[0] = t[2];
    } else if (face === 'L') {
      const t = [U[0], U[3], U[6]];
      U[0] = B[8]; U[3] = B[5]; U[6] = B[2];
      B[8] = D[0]; B[5] = D[3]; B[2] = D[6];
      D[0] = F[0]; D[3] = F[3]; D[6] = F[6];
      F[0] = t[0]; F[3] = t[1]; F[6] = t[2];
    } else if (face === 'F') {
      const t = [U[6], U[7], U[8]];
      U[6] = L[8]; U[7] = L[5]; U[8] = L[2];
      L[8] = D[2]; L[5] = D[1]; L[2] = D[0];
      D[2] = R[0]; D[1] = R[3]; D[0] = R[6];
      R[0] = t[0]; R[3] = t[1]; R[6] = t[2];
    } else if (face === 'B') {
      const t = [U[2], U[1], U[0]];
      U[2] = R[8]; U[1] = R[5]; U[0] = R[2];
      R[8] = D[6]; R[5] = D[7]; R[2] = D[8];
      D[6] = L[0]; D[7] = L[3]; D[8] = L[6];
      L[0] = t[0]; L[3] = t[1]; L[6] = t[2];
    }
  },

  simulateScramble(scrambleStr: string): CubeState {
    const faces = this.createCubeState();
    if (!scrambleStr) return faces;

    const moves = scrambleStr.trim().split(/\s+/);
    moves.forEach(m => {
      if (!m) return;
      const face = m[0] as CubeFace;
      const mod = m.slice(1);
      const turns = mod === '2' ? 2 : mod === "'" ? 3 : 1;
      for (let i = 0; i < turns; i++) {
        this.applySingleMove(faces, face);
      }
    });
    return faces;
  },

  render2DNet(canvas: HTMLCanvasElement, scrambleStr: string) {
    if (!canvas) return;
    const faces = this.simulateScramble(scrambleStr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // HiDPI support
    const dpr = window.devicePixelRatio || 1;
    const baseWidth = 195;
    const baseHeight = 145;

    canvas.width = baseWidth * dpr;
    canvas.height = baseHeight * dpr;
    canvas.style.width = `${baseWidth}px`;
    canvas.style.height = `${baseHeight}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, baseWidth, baseHeight);

    const size = 13;
    const gap = 1.5;
    const blockSize = size * 3 + gap * 2;

    const layout: Record<CubeFace, { col: number; row: number }> = {
      U: { col: 1, row: 0 },
      L: { col: 0, row: 1 },
      F: { col: 1, row: 1 },
      R: { col: 2, row: 1 },
      B: { col: 3, row: 1 },
      D: { col: 1, row: 2 }
    };

    const startX = 6;
    const startY = 4;

    (Object.entries(layout) as [CubeFace, { col: number; row: number }][]).forEach(([faceKey, pos]) => {
      const fX = startX + pos.col * (blockSize + 3);
      const fY = startY + pos.row * (blockSize + 3);
      const stickers = faces[faceKey];

      ctx.fillStyle = '#0a0e17';
      ctx.fillRect(fX - 1, fY - 1, blockSize + 2, blockSize + 2);

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const idx = r * 3 + c;
          const colorKey = stickers[idx];
          const sX = fX + c * (size + gap);
          const sY = fY + r * (size + gap);

          ctx.fillStyle = this.FACE_COLORS[colorKey] || '#fff';
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(sX, sY, size, size, 1.5);
          } else {
            ctx.rect(sX, sY, size, size);
          }
          ctx.fill();
        }
      }
    });
  }
};
