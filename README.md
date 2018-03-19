# TOR Onion Transport Showdown

This test specifically examines connections to an Onion Service by repeatedly transfering a 32kB buffer of an image file from server to client. There are three comparisons:
- WebSockets vs Req-Res
- gRPC vs Req-Res
- WebSockets vs gRPC

The test is designed to give equal opportunity to all scenarios under varying network conditions.

## Live test results:

http://oniontests.openpoint.ie

http://flhqvb2425keopts.onion/

## Methodology

Each protocol has two dedicated TOR instances running, a client and a onion service server. Clients connect through their own localhost TOR proxy

The work cycle consists of the client sending the server a timestamp and the server responding with a 32kB data buffer, which repeats upon completion of the buffer being fully received. Latency is measured on the timestamp from client to server while trip time is the total time, including data transfer.

The connection quality for a circuit can be a lottery, so every two hours all the clients reboot from a TOR OS level and establish new connections.

**UpTime**: The amount of time that the connection has actively been engaged in transferring data.

**DownTime**: The amount of time that the connection has spent in error recovery.

**Round Trips**: The number of cycles (send timestamp, receive data) that have successfully completed.

**Trip Time**: The time taken for a cycle, including transfer of buffer data.

**Latency**: The time taken for a timestamp to travel from client to server.

## Install

**Requirements**: [Tor](https://www.torproject.org/docs/tor-doc-unix.html.en) and Npm/NodeJs >= 8

Clone this repo and cd into directory.
```aidl
npm install
```
First, run in dev mode to create some setup files:
```aidl
NODE_ENV=development node Main.js
```
React will open a local instance of the site at `http://localhost:3000`.

The .onion address for the website will be in `<directory>/tor/keys/public/hostname`.

Build the React website code and start in production mode:
```aidl
npm run build
node Main.js
```