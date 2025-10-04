import type { DnsHeader, DnsQuestion, DnsAnswer } from "./types";

// Read more here: https://www.rfc-editor.org/rfc/rfc1035#section-4.1.1
export function parseDNSHeader(data: Buffer): DnsHeader {
  const packetId = data.readUInt16BE(0);
  const flags = data.readUInt16BE(2);

  return {
    packetId,
    qr: (flags >> 15) & 0b1,
    opcode: (flags >> 11) & 0b1111,
    aa: (flags >> 10) & 0b1,
    tc: (flags >> 9) & 0b1,
    rd: (flags >> 8) & 0b1,
    ra: (flags >> 7) & 0b1,
    z: (flags >> 4) & 0b111,
    rcode: flags & 0b1111,
    qdcount: data.readUInt16BE(4),
    ancount: data.readUInt16BE(6),
    nscount: data.readUInt16BE(8),
    arcount: data.readUInt16BE(10),
  };
}

// NOTE: Compression is used in DNS to save space by allowing repeated domain names to reference
// a previous occurrence instead of being repeated.
export function parseDomainName(
  data: Buffer,
  offset: number,
): { name: string; length: number } {
  const labels: string[] = [];
  let jumped = false;
  let consumed = 0;

  while (true) {
    const length = data[offset];

    // pointer (compression)
    // The first two bits are ones.  This allows a pointer to be distinguished
    // from a label, since the label must begin with two zero bits
    // Read more here: https://www.rfc-editor.org/rfc/rfc1035#section-4.1.4
    if ((length & 0b11000000) === 0b11000000) {
      // Extract the lower 6 bits (remove the top 2 '11' bits)
      const high6Bits = length & 0b00111111;

      // Shift the 6 bits left by 8 to make space for the next byte
      const highBitsShifted = high6Bits << 8;

      // Combine the high 6 bits (shifted) with the low 8 bits using bitwise OR
      const pointer = highBitsShifted | data[offset + 1];

      if (!jumped) consumed += 2;

      offset = pointer;
      jumped = true;

      // Continue form the pointer location
      continue;
    }

    // End of domain name
    if (length === 0) {
      if (!jumped) consumed++;
      break;
    }

    labels.push(
      data.subarray(offset + 1, offset + 1 + length).toString("ascii"),
    );

    if (!jumped) consumed += length + 1;
    offset += length + 1;
  }

  return { name: labels.join("."), length: consumed };
}

// Read more here: https://www.rfc-editor.org/rfc/rfc1035#section-4.1.2
export function parseDNSQuestions(
  data: Buffer,
  offset: number,
  count: number,
): { questions: DnsQuestion[]; offset: number } {
  const questions: DnsQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const { name, length } = parseDomainName(data, offset);
    offset += length;

    const qtype = data.readUInt16BE(offset);
    const qclass = data.readUInt16BE(offset + 2);
    offset += 4;

    questions.push({ name, qtype, qclass });
  }

  return { questions, offset };
}

export function parseDNSAnswers(
  data: Buffer,
  offset: number,
  count: number,
): { answers: DnsAnswer[]; offset: number } {
  const answers: DnsAnswer[] = [];

  for (let i = 0; i < count; i++) {
    const { name, length } = parseDomainName(data, offset);
    offset += length;

    const type = data.readUInt16BE(offset);
    const qclass = data.readUInt16BE(offset + 2);
    const ttl = data.readUInt32BE(offset + 4);
    const rdlength = data.readUInt16BE(offset + 8);
    const rdata = data.subarray(offset + 10, offset + 10 + rdlength);
    offset += 10 + rdlength;

    answers.push({ name, type, class: qclass, ttl, rdlength, rdata });
  }

  return { answers, offset };
}
