import { createDnsServer } from "../src/main";
import dgram from "dgram";
import { buildDNSHeader, buildQuestionSection } from "../src/builder";
import { parseDNSHeader, parseDNSQuestions, parseDNSAnswers } from "../src/parser";
import type { DnsHeader, DnsQuestion } from "../src/types";

describe("DNS Server", () => {
  const PORT = 2053;
  const HOST = "127.0.0.1";
  let server: dgram.Socket;

  beforeAll(async () => {
    server = createDnsServer();
    server.bind(PORT);
    await new Promise<void>((resolve) => {
      server.on("listening", () => {
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
    await new Promise((resolve) => setTimeout(resolve, 500)); // Give some time for resources to be released
  }); it("should resolve a known domain (google.com)", async () => {
    const queryHeader: DnsHeader = {
      packetId: 5678,
      qr: 0,
      opcode: 0,
      aa: 0,
      tc: 0,
      rd: 1,
      ra: 0,
      z: 0,
      rcode: 0,
      qdcount: 1,
      ancount: 0,
      nscount: 0,
      arcount: 0,
    };

    const queryQuestion: DnsQuestion = {
      name: "google.com",
      qtype: 1, // A record
      qclass: 1, // IN class
    };

    const questionBuffer = buildQuestionSection([queryQuestion]);
    const headerBuffer = buildDNSHeader(queryHeader, 1, 0);

    const fullQuery = Buffer.concat([headerBuffer, questionBuffer]);

    const client = dgram.createSocket("udp4");

    const response: Buffer = await new Promise((resolve, reject) => {
      client.send(fullQuery, PORT, HOST, (err) => {
        if (err) {
          return reject(err);
        }
      });

      const timeoutId = setTimeout(() => {
        reject(new Error("DNS query timed out"));
      }, 5000);

      client.on("message", (msg) => {
        clearTimeout(timeoutId);
        resolve(msg);
      });

      client.on("error", (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });

    client.close();

    const responseHeader = parseDNSHeader(response);
    expect(responseHeader.qr).toBe(1); // Should be a response
    expect(responseHeader.ancount).toBeGreaterThan(0); // Should have answers

    const { offset: questionsOffset } = parseDNSQuestions(response, 12, responseHeader.qdcount);
    const { answers } = parseDNSAnswers(response, questionsOffset, responseHeader.ancount);

    const googleComIp = answers.find(
      (answer) => answer.name === "google.com" && answer.type === 1
    );

    expect(googleComIp).toBeDefined();
    const receivedIp = googleComIp?.rdata.join(".");
    expect(receivedIp).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
  });
});
