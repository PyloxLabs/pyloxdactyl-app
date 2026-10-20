export type ConsoleSpan = {
  text: string;
  color?: string;
  background?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  dim?: boolean;
};

const ANSI_COLORS: Record<number, string> = {
  30: '#3f3f46',
  31: '#ef4444',
  32: '#22c55e',
  33: '#eab308',
  34: '#3b82f6',
  35: '#a855f7',
  36: '#06b6d4',
  37: '#e4e4e7',
  90: '#71717a',
  91: '#f87171',
  92: '#4ade80',
  93: '#facc15',
  94: '#60a5fa',
  95: '#c084fc',
  96: '#22d3ee',
  97: '#ffffff',
};

const BRAND_PURPLE = '#a855f7';
const SGR_PATTERN = /\x1b\[([0-9;]*)m/g;
const BRAND_PATTERN = /\[(?:Panel|Pylox)\]|container@pylox~?/g;

function xterm256(input: number): string | undefined {
  const n = Number(input);
  if (n < 8) return ANSI_COLORS[30 + n];
  if (n < 16) return ANSI_COLORS[90 + (n - 8)];
  if (n >= 232) {
    const v = 8 + (n - 232) * 10;
    return `rgb(${v},${v},${v})`;
  }
  const c = n - 16;
  const conv = (x: number) => (x === 0 ? 0 : 55 + x * 40);
  return `rgb(${conv(Math.floor(c / 36))},${conv(Math.floor((c % 36) / 6))},${conv(c % 6)})`;
}

type Style = Omit<ConsoleSpan, 'text'>;

function isPlain(style: Style): boolean {
  return !style.color && !style.background && !style.bold && !style.italic && !style.underline && !style.dim;
}

function applySgr(state: Style, codes: number[]) {
  if (codes.length === 0) codes.push(0);
  for (let j = 0; j < codes.length; j++) {
    const c = codes[j];
    if (c === 0) {
      state.color = undefined;
      state.background = undefined;
      state.bold = undefined;
      state.italic = undefined;
      state.underline = undefined;
      state.dim = undefined;
    } else if (c === 1) state.bold = true;
    else if (c === 2) state.dim = true;
    else if (c === 3) state.italic = true;
    else if (c === 4) state.underline = true;
    else if ((c >= 30 && c <= 37) || (c >= 90 && c <= 97)) state.color = ANSI_COLORS[c];
    else if (c === 39) state.color = undefined;
    else if (c === 49) state.background = undefined;
    else if (c === 38 || c === 48) {
      let color: string | undefined;
      if (codes[j + 1] === 5) {
        color = xterm256(codes[j + 2]);
        j += 2;
      } else if (codes[j + 1] === 2) {
        color = `rgb(${codes[j + 2]},${codes[j + 3]},${codes[j + 4]})`;
        j += 4;
      }
      if (color) {
        if (c === 38) state.color = color;
        else state.background = color;
      }
    }
  }
}

export function rebrand(line: string): string {
  return line.replace(/container@pterodactyl/g, 'container@pylox');
}

export function parseConsoleLine(line: string): ConsoleSpan[] {
  const spans: ConsoleSpan[] = [];
  const state: Style = {};

  const append = (text: string, style: Style) => {
    if (!text) return;
    const previous = spans[spans.length - 1];
    if (previous && isPlain(style) && isPlain(previous)) {
      previous.text += text;
      return;
    }
    spans.push({ text, ...style });
  };

  const appendChunk = (chunk: string) => {
    if (!chunk) return;
    BRAND_PATTERN.lastIndex = 0;
    let cursor = 0;
    let match: RegExpExecArray | null;
    while ((match = BRAND_PATTERN.exec(chunk)) !== null) {
      append(chunk.slice(cursor, match.index), state);
      spans.push({ text: match[0], color: BRAND_PURPLE, bold: true });
      cursor = match.index + match[0].length;
    }
    append(chunk.slice(cursor), state);
  };

  const text = rebrand(String(line));
  let cursor = 0;
  SGR_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SGR_PATTERN.exec(text)) !== null) {
    appendChunk(text.slice(cursor, match.index));
    applySgr(state, match[1].split(';').filter((x) => x !== '').map(Number));
    cursor = match.index + match[0].length;
  }
  appendChunk(text.slice(cursor));

  return spans;
}
