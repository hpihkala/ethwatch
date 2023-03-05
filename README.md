# Look ma, no RPC!

EthWatch is a decentralized distribution network for EVM smart contract events. It allows apps to listen to events in a scalable and secure way, instead of polling a blockchain node via RPC or other centralized API.

EthWatch is great for oracles, bridges, and other blockchain-adjacent backends, as well as DEXes, DeFi pools, and other dapp frontends that wish to improve UX by displaying chain events in realtime.

EthWatch is currently heavily WIP. It shouldn't be relied on by anything valuable.

# Live playground

Check out a live demo [here](https://hpihkala.github.io/ethwatch/).

# Components

- [ethwatch-client](ethwatch-client) is the library that apps use to subscribe to events via EthWatch
- [ethwatch-node](ethwatch-node) is the program that seed nodes run to read events from a real RPC and broadcast them over EthWatch
- [ethwatch-site](ethwatch-site) is a live demo React app
