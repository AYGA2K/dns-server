import dgram from "dgram";
import { buildDNSHeader, buildQuestionSection } from "./builder";
import type { DnsHeader, DnsQuestion } from "./types";

// Forwards a DNS query to a resolver and returns the response.
export async function forwardQuery(
  resolverIp: string,
  resolverPort: number,
  header: DnsHeader,
  questions: DnsQuestion[]
): Promise<Buffer> {
  // Create a new header for the query to the resolver.
  // We are the client, so QR is 0.
  const queryHeader: DnsHeader = { ...header, qr: 0, qdcount: questions.length, ancount: 0, nscount: 0, arcount: 0 };
  const questionBuffer = buildQuestionSection(questions);
  const headerBuffer = buildDNSHeader(queryHeader, questions.length, 0);
  const query = Buffer.concat([headerBuffer, questionBuffer]);

  return new Promise<Buffer>((resolve, reject) => {
    const client = dgram.createSocket("udp4");

    // Set a timeout for the query.
    const timeout = setTimeout(() => {
      client.close();
      reject(new Error("DNS query timed out"));
    }, 5000);

    client.on("message", (res) => {
      clearTimeout(timeout);
      resolve(res);
      client.close();
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
      client.close();
    });

    // Send the query to the resolver.
    client.send(query, resolverPort, resolverIp);
  });
}
