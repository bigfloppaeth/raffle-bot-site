// Minimal ZIP (STORE) writer with CRC32, no dependencies.
// This creates standard .zip files that Windows/macOS can open.

const textEncoder = new TextEncoder();

function u16le(n: number) {
  return Uint8Array.of(n & 0xff, (n >>> 8) & 0xff);
}

function u32le(n: number) {
  return Uint8Array.of(
    n & 0xff,
    (n >>> 8) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 24) & 0xff,
  );
}

function concat(chunks: Uint8Array[]) {
  const total = chunks.reduce((s, c) => s + c.byteLength, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.byteLength;
  }
  return out;
}

// CRC32 (IEEE) implementation
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export type ZipFileInput = {
  path: string; // use forward slashes, no leading slash
  data: Uint8Array | string;
};

function normalizePath(p: string) {
  const s = p.replace(/\\/g, "/").replace(/^\/+/, "");
  // ZIP readers hate backtracking segments.
  const safe = s
    .split("/")
    .filter((seg) => seg && seg !== "." && seg !== "..")
    .join("/");
  return safe;
}

function toBytes(data: Uint8Array | string) {
  return typeof data === "string" ? textEncoder.encode(data) : data;
}

export function createZipStore(files: ZipFileInput[]) {
  // ZIP structure:
  // [local file header + filename + file bytes] * N
  // [central directory] * N
  // [end of central directory]
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];

  let offset = 0;

  for (const f of files) {
    const path = normalizePath(f.path);
    if (!path) continue;
    const nameBytes = toBytes(path);
    const dataBytes = toBytes(f.data);

    const crc = crc32(dataBytes);
    const compSize = dataBytes.byteLength; // STORE
    const uncompSize = dataBytes.byteLength;

    // Local file header (30 bytes + filename + extra)
    // signature        4  0x04034b50
    // ver needed       2
    // flags            2
    // compression      2  0 (store)
    // mod time         2
    // mod date         2
    // crc32            4
    // comp size        4
    // uncomp size      4
    // file name len    2
    // extra len        2
    const localHeader = concat([
      u32le(0x04034b50),
      u16le(20),
      u16le(0),
      u16le(0),
      u16le(0),
      u16le(0),
      u32le(crc),
      u32le(compSize),
      u32le(uncompSize),
      u16le(nameBytes.byteLength),
      u16le(0),
    ]);

    const localRecord = concat([localHeader, nameBytes, dataBytes]);
    localParts.push(localRecord);

    // Central directory header (46 bytes + filename + extra + comment)
    // signature          4  0x02014b50
    // ver made by        2
    // ver needed         2
    // flags              2
    // compression        2
    // mod time           2
    // mod date           2
    // crc32              4
    // comp size          4
    // uncomp size        4
    // file name len      2
    // extra len          2
    // comment len        2
    // disk start         2
    // int attrs          2
    // ext attrs          4
    // local header off   4
    const centralHeader = concat([
      u32le(0x02014b50),
      u16le(0x0314), // "made by" (arbitrary)
      u16le(20),
      u16le(0),
      u16le(0),
      u16le(0),
      u16le(0),
      u32le(crc),
      u32le(compSize),
      u32le(uncompSize),
      u16le(nameBytes.byteLength),
      u16le(0),
      u16le(0),
      u16le(0),
      u16le(0),
      u32le(0),
      u32le(offset),
    ]);

    const centralRecord = concat([centralHeader, nameBytes]);
    centralParts.push(centralRecord);

    offset += localRecord.byteLength;
  }

  const localBlob = concat(localParts);
  const centralBlob = concat(centralParts);

  const centralOffset = localBlob.byteLength;
  const centralSize = centralBlob.byteLength;
  const entries = centralParts.length;

  // End of central directory (22 bytes)
  // signature        4  0x06054b50
  // disk no          2
  // disk cd start    2
  // entries on disk  2
  // total entries    2
  // cd size          4
  // cd offset        4
  // comment len      2
  const eocd = concat([
    u32le(0x06054b50),
    u16le(0),
    u16le(0),
    u16le(entries),
    u16le(entries),
    u32le(centralSize),
    u32le(centralOffset),
    u16le(0),
  ]);

  return concat([localBlob, centralBlob, eocd]);
}

