import type { DnsAnswer, DnsHeader, DnsQuestion } from "./types";

function encodeDomainName(name: string): Buffer {
  const parts = name.split(".");
  const buffers = parts.map(label => {
    const len = Buffer.alloc(1);
    len[0] = label.length;
    return Buffer.concat([len, Buffer.from(label)]);
  });
  return Buffer.concat([...buffers, Buffer.alloc(1)]);
}

export function buildDNSHeader(header: DnsHeader, qdcount: number, ancount: number): Buffer {
  const buf = Buffer.alloc(12);

  buf.writeUInt16BE(header.packetId, 0);

  let flags = 0;
  flags |= header.qr << 15;
  flags |= header.opcode << 11;
  flags |= header.aa << 10;
  flags |= header.tc << 9;
  flags |= header.rd << 8;
  flags |= header.ra << 7;
  flags |= header.z << 4;
  flags |= header.rcode;

  buf.writeUInt16BE(flags, 2);

  buf.writeUInt16BE(qdcount, 4);
  buf.writeUInt16BE(ancount, 6);
  buf.writeUInt16BE(header.nscount, 8);
  buf.writeUInt16BE(header.arcount, 10);

  return buf;
}


export function buildQuestionSection(questions: DnsQuestion[]): Buffer {
  return Buffer.concat(
    questions.map(q => {
      const name = encodeDomainName(q.name);
      const buf = Buffer.alloc(4);
      buf.writeUInt16BE(q.qtype, 0);
      buf.writeUInt16BE(q.qclass, 2);
      return Buffer.concat([name, buf]);
    })
  );
}

export function buildAnswerSection(answers: DnsAnswer[]): Buffer {
  return Buffer.concat(
    answers.map(a => {
      const name = encodeDomainName(a.name);
      const buf = Buffer.alloc(10);
      buf.writeUInt16BE(a.type, 0);
      buf.writeUInt16BE(a.class, 2);
      buf.writeUInt32BE(a.ttl, 4);
      buf.writeUInt16BE(a.rdlength, 8);
      return Buffer.concat([name, buf, a.rdata]);
    })
  );
}
