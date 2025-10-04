# DNS Server

This project is a simple DNS server implemented in TypeScript. It's designed to be a learning tool for understanding the DNS protocol.

## Features

* **DNS Forwarding:** The server acts as a DNS forwarder. It receives DNS queries and forwards them to an upstream resolver (e.g., Google's `8.8.8.8`) to get the answers.
* **UDP-based:** The server communicates using the UDP protocol, which is the standard for most DNS queries.
* **Binary Protocol Parsing:** The project includes code for parsing and building DNS packets according to the RFC 1035 specification. This includes handling the DNS header, questions, and answers, as well as domain name compression.

## Getting Started

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/AYGA2K/dns-server.git
    cd dns-server 
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

### Running the Server

1. Build the TypeScript code:

    ```bash
    npm run build
    ```

2. Start the server:

    ```bash
    npm run start
    ```

The DNS server will be listening on port `8080`.

### Development

```bash
npm run dev
```

## How to Use

You can test the DNS server using a command-line tool like `dig`.

```bash
dig @127.0.0.1 -p 8080 google.com
```

This command will send a DNS query for `google.com` to your local DNS server running on port `2053`. The server will then forward the query to Google's public DNS server and return the response to you.
