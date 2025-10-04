export type DnsHeader = {
  packetId: number; // 16 bits
  qr: number; // 1 bit, Query/Response Indicator
  opcode: number; // 4 bits
  aa: number; // 1 bit, Authoritative Answer
  tc: number; // 1 bit, Truncation
  rd: number; // 1 bit, Recursion Desired
  ra: number; // 1 bit, Recursion Available
  z: number; // 3 bits, Reserved
  rcode: number; // 4 bits, Response Code
  qdcount: number; // 16 bits, Question Count
  ancount: number; // 16 bits, Answer Record Count
  nscount: number; // 16 bits, Authority Record Count
  arcount: number; // 16 bits, Additional Record Count
};

export type DnsQuestion = {
  name: string; // variable length, domain encoded as a sequence of labels
  qtype: number; // 16 bits Question Type
  qclass: number; // 16 bits Question Class
};

export type DnsAnswer = {
  name: string;     // same as question name 
  type: number;     // 16 bits (1 = A)
  class: number;    // 16 bits (1 = IN)
  ttl: number;      // 32 bits
  rdlength: number; // 16 bits
  rdata: Buffer;    // variable (IPv4 = 4 bytes)
};
