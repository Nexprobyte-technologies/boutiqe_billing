const LEFT_L = [
  '0001101', '0011001', '0010011', '0111101', '0100011',
  '0110001', '0101111', '0111011', '0110111', '0001011',
];
const LEFT_G = [
  '0100111', '0110011', '0011011', '0100001', '0011101',
  '0111001', '0000101', '0010001', '0001001', '0010111',
];
const RIGHT_R = LEFT_L.map((pattern) => pattern.replace(/[01]/g, (bit) => bit === '0' ? '1' : '0'));
const FIRST_DIGIT_PARITY = [
  'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
  'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL',
];

function decodeBits(bits: string, leftCount: number, firstDigit = true): string | null {
  const leftStart = firstDigit ? 3 : 3;
  const digits: number[] = [];
  let parity = '';

  for (let index = 0; index < leftCount; index += 1) {
    const pattern = bits.slice(leftStart + index * 7, leftStart + (index + 1) * 7);
    let digit = LEFT_L.indexOf(pattern);
    if (digit >= 0) {
      parity += 'L';
    } else {
      digit = LEFT_G.indexOf(pattern);
      parity += 'G';
    }
    if (digit < 0) return null;
    digits.push(digit);
  }

  const rightStart = firstDigit ? 50 : 3 + leftCount * 7 + 5;
  for (let index = 0; index < leftCount; index += 1) {
    const pattern = bits.slice(rightStart + index * 7, rightStart + (index + 1) * 7);
    const digit = RIGHT_R.indexOf(pattern);
    if (digit < 0) return null;
    digits.push(digit);
  }

  if (firstDigit) {
    const leading = FIRST_DIGIT_PARITY.indexOf(parity);
    if (leading < 0) return null;
    digits.unshift(leading);
  }

  return digits.join('');
}

function sampleLine(data: Uint8ClampedArray, width: number, threshold: number, start: number, moduleWidth: number, moduleCount: number): string | null {
  let bits = '';
  for (let index = 0; index < moduleCount; index += 1) {
    const x = Math.floor(start + (index + 0.5) * moduleWidth);
    if (x < 0 || x >= width) return null;
    const offset = x * 4;
    const gray = (data[offset] * 299 + data[offset + 1] * 587 + data[offset + 2] * 114) / 1000;
    bits += gray < threshold ? '1' : '0';
  }
  return bits;
}

function decodeRow(data: Uint8ClampedArray, width: number): string | null {
  let min = 255;
  let max = 0;
  for (let x = 0; x < width; x += 2) {
    const offset = x * 4;
    const gray = (data[offset] * 299 + data[offset + 1] * 587 + data[offset + 2] * 114) / 1000;
    min = Math.min(min, gray);
    max = Math.max(max, gray);
  }
  if (max - min < 50) return null;
  const threshold = (min + max) / 2;

  const runs: { black: boolean; start: number; length: number }[] = [];
  let previousBlack = ((data[0] * 299 + data[1] * 587 + data[2] * 114) / 1000) < threshold;
  let runStart = 0;
  for (let x = 1; x < width; x += 1) {
    const offset = x * 4;
    const gray = (data[offset] * 299 + data[offset + 1] * 587 + data[offset + 2] * 114) / 1000;
    const black = gray < threshold;
    if (black !== previousBlack) {
      runs.push({ black: previousBlack, start: runStart, length: x - runStart });
      runStart = x;
      previousBlack = black;
    }
  }
  runs.push({ black: previousBlack, start: runStart, length: width - runStart });

  for (let index = 0; index + 2 < runs.length; index += 1) {
    const first = runs[index];
    const second = runs[index + 1];
    const third = runs[index + 2];
    if (!first.black || second.black || !third.black) continue;

    const moduleWidth = (first.length + second.length + third.length) / 3;
    if (moduleWidth < 1 || Math.max(first.length, second.length, third.length) > moduleWidth * 1.6) continue;

    for (const scale of [0.92, 0.96, 1, 1.04, 1.08]) {
      for (const offset of [-0.25, 0, 0.25]) {
        const adjustedModule = moduleWidth * scale;
        const start = first.start + offset * adjustedModule;

        const ean13 = sampleLine(data, width, threshold, start, adjustedModule, 95);
        if (ean13?.startsWith('101') && ean13.slice(45, 50) === '01010' && ean13.slice(92) === '101') {
          const decoded = decodeBits(ean13, 6);
          if (decoded) return decoded;
        }

        const ean8 = sampleLine(data, width, threshold, start, adjustedModule, 67);
        if (ean8?.startsWith('101') && ean8.slice(31, 36) === '01010' && ean8.slice(64) === '101') {
          const decoded = decodeBits(ean8, 4, false);
          if (decoded) return decoded;
        }
      }
    }
  }
  return null;
}

/** Decode standard EAN-13, UPC-A, or EAN-8 bars from a live camera frame. */
export function decodeEanFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): string | null {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;

  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(video, 0, 0, width, height);

  for (const fraction of [0.44, 0.5, 0.56]) {
    const y = Math.min(height - 1, Math.max(0, Math.floor(height * fraction)));
    const pixels = context.getImageData(0, y, width, 1);
    const code = decodeRow(pixels.data, width);
    if (code) return code;
  }
  return null;
}
