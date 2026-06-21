export const publicResolverAbi = [
  { inputs: [{ name: "name", type: "string" }, { name: "chain", type: "string" }, { name: "addr", type: "string" }], name: "setAddress", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "name", type: "string" }, { name: "hash", type: "string" }], name: "setContentHash", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "user", type: "address" }, { name: "name", type: "string" }], name: "setReverse", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "name", type: "string" }, { name: "key", type: "string" }, { name: "value", type: "string" }], name: "setText", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "name", type: "string" }, { name: "chain", type: "string" }], name: "getAddress", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "name", type: "string" }], name: "getContentHash", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "getReverse", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "name", type: "string" }, { name: "key", type: "string" }], name: "getText", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
] as const;