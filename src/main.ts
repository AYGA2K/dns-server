import dgram from "dgram";
import { parseDNSHeader, parseDNSQuestions, parseDNSAnswers } from "./parser";
import { buildDNSHeader, buildQuestionSection, buildAnswerSection } from "./builder";
import type { DnsAnswer, DnsHeader, DnsQuestion } from "./types";
import { forwardQuery } from "./forwarder";

const RESOLVER_ADDRESS = "8.8.8.8:53";

export function createDnsServer() {
  const server = dgram.createSocket("udp4");

  server.on("message", async (msg, rinfo) => {
    try {
      const [resolverIp, resolverPort] = RESOLVER_ADDRESS.split(":");

      const incomingHeader = parseDNSHeader(msg);
      const { questions } = parseDNSQuestions(msg, 12, incomingHeader.qdcount);

      const allAnswers: DnsAnswer[] = [];
      let responseHeader: DnsHeader | null = null;

      for (const question of questions) {
        const response = await forwardQuery(resolverIp, Number(resolverPort), incomingHeader, [question]);
        const resHeader = parseDNSHeader(response);
        if (!responseHeader) {
          responseHeader = resHeader;
        }
        const { offset: resQuestionsOffset } = parseDNSQuestions(response, 12, resHeader.qdcount);
        const { answers } = parseDNSAnswers(response, resQuestionsOffset, resHeader.ancount);
        allAnswers.push(...answers);
      }

      if (responseHeader) {
        const finalHeader: DnsHeader = {
          ...responseHeader,
          packetId: incomingHeader.packetId,
          qr: 1,
          qdcount: questions.length,
          ancount: allAnswers.length,
        };

        const responseBuffer = Buffer.concat([
          buildDNSHeader(finalHeader, questions.length, allAnswers.length),
          buildQuestionSection(questions),
          buildAnswerSection(allAnswers),
        ]);

        server.send(responseBuffer, rinfo.port, rinfo.address);
      }
    } catch (error) {
      console.error("Error handling DNS query:", error);
    }
  });

  server.on("listening", () => {
    console.log("DNS server listening on port 8080");
  });

  return server;
}

function startDnsServer() {
  const server = createDnsServer();
  server.bind(8080);
}

startDnsServer();
