export class PEMSyntaxError extends Error {}
export class InvalidPemHeader extends Error {}

export function parsePEM(pem: string) {
  const parts = pem.split("-----");
  const typeLineIndex = parts.findIndex((part) => part.startsWith("BEGIN"));
  if (typeLineIndex === -1) {
    throw new Error("No PEM content found");
  }
  const typePart = parts[typeLineIndex];
  const type = typePart.slice(6);
  const typeEndPart = parts[typeLineIndex + 2];
  if (typeEndPart !== `END ${type}`) {
    throw new PEMSyntaxError(`Invalid PEM Type End: ${typeEndPart}. Expected: END ${type}`);
  }

  const { header, body } = parsePEMBody(parts[typeLineIndex + 1], 0);
  return {
    type,
    header,
    body,
  };
}
function PEMHeaderParser() {
  const header: Record<string, string[]> = {};
  let currentKey: string | undefined = undefined;
  let currentValueLines: string[] = [];

  function flush() {
    if (currentKey) {
      header[currentKey] = currentValueLines
        .join("\n")
        .split(",")
        .map((v) => v.trim());
      currentKey = undefined;
      currentValueLines = [];
    }
  }
  function open(key: string, value: string) {
    flush();
    currentKey = key.trim();
    currentValueLines = [value.trim()];
  }
  function next(line: string): boolean {
    if (line.trim() === "") {
      // reached end of header
      flush();
      return true;
    }
    if (line[0] === " " || line[0] === "\t") {
      // should be continuation line
      if (currentKey) {
        currentValueLines.push(line.trim());
        return false;
      }
      throw new InvalidPemHeader(`Unexpected continuation line: "${line}"`);
    }
    // here this line is not starting with space or tab
    const parts = line.split(":");
    if (parts.length === 1) {
      // reached end of header and start of body
      // this is unexpected, but we could loosely accept it
      flush();
      return true;
    }
    open(parts[0], parts[1]);
    return false;
  }
  function getAll() {
    return header;
  }
  return {
    getAll,
    next,
  };
}

function parsePEMBody(body: string, startColumn = 0) {
  body = body.trim();
  const lines = body.split(/\r\n|\n|\r/);
  const headerParser = PEMHeaderParser();
  if (lines.length === 0) {
    return { header: headerParser.getAll(), body: new Uint8Array(0) };
  }
  let contentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].slice(startColumn);
    const end = headerParser.next(line);
    if (end) {
      contentStart = i;
      break;
    }
  }
  const base64Content = lines
    .slice(contentStart)
    .map((line) => line.slice(startColumn).trim())
    .join("");
  return {
    header: headerParser.getAll(),
    body: Uint8Array.from(atob(base64Content), (c) => c.charCodeAt(0)),
  };
}
