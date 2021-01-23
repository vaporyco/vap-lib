const F = require("forall");
const A = require("./array");
const B = require("./bytes");
const Account = require("./account");

F.Bytes = F(F.Type, {
  form: "a JavaScript String starting with a `0x`, followed by an even number of low-case hex chars (i.e., `0123456789abcdef`)",
  rand: () => "0x" + A.generate((Math.random() * 16 | 0) * 2, () => (Math.random() * 16 | 0).toString(16)).join(""),
  test: value => typeof value === "string" && /^0x([0-9a-f][0-9a-f])*$/.test(value),
}).__name("Bytes").__desc("any arbitrary data");

F.NBytes = bytes => F(F.Type, {
  form: "a JavaScript String starting with a `0x`, followed by " + (bytes * 2) + " low-case hex chars (i.e., `0123456789abcdef`)",
  test: value => F.Bytes.test(value) && value.length === (bytes * 2 + 2),
  rand: () => "0x" + A.generate(bytes * 2, () => (Math.random() * 16 | 0).toString(16)).join("")
})
.__name("NBytes(" + bytes + ")")
.__desc("any arbitrary data of exactly " + bytes + "-byte" + (bytes > 1 ? "s" : ""));

F.Nat = F(F.Type, {
  form: "a JavaScript String starting with a `0x`, followed by at least one low-case hex char different from 0, followed by any number of low-case hex chars (i.e., `0123456789abcdef`)",
  test: value => typeof value === "string" && /^0x[1-9a-f]([0-9a-f])*$/.test(value),
  rand: () => "0x" + (Math.random() * Math.pow(2,50) | 0).toString(16)
})
.__name("Nat")
.__desc("an arbitrarily long non-negative integer number");

F.Address = F(F.Type, {
  form: "a JavaScript String starting with a `0x`, followed by 40 hex chars (i.e., `0123456789abcdefABCDEF`), with the nth hex being uppercase iff the nth hex of the keccak256 of the lowercase address in ASCII is > 7",
  test: address => /^(0x)?[0-9a-f]{40}$/i.test(address) && Account.toChecksum(address.toLowerCase()) === address,
  rand: () => F.Account.rand().address
})
.__name("Address")
.__desc("an Vapory public address");

F.Hash = F(F.Type, {
  form: F.NBytes(32).form,
  test: F.NBytes(32).test,
  rand: F.NBytes(32).rand
})
.__name("Hash")
.__desc("a Keccak-256 hash");

F.PrivateKey = F(F.Type, {
  form: F.NBytes(32).form,
  test: F.NBytes(32).test,
  rand: F.NBytes(32).rand
})
.__name("PrivateKey")
.__desc("an Vapory private key");

F.Account = (() => {
  const base = F.Struct({
    address: F.Address,
    privateKey: F.PrivateKey,
  });
  return F(F.Type, {
    form: base.form,
    test: base.test,
    rand: () => Account.create("")
  });
})()
.__name("Account")
.__desc("an Vapory account");

F.BytesTree = F(F.Type, {
  form: "either " + F.Bytes.form + ", or a tree of nested JavaScript Arrays of BytesTrees",
  test: value => F.Bytes.test(value) || value instanceof Array && value.reduce((r,v) => F.BytesTree.test(v) && r, true),
  rand: () => {
    let list = [];
    while (Math.random() < 0.8) {
      if (Math.random() < 0.8)
        list.push(F.Bytes.rand());
      else
        list.push(F.BytesTree.rand());
    }
    return list;
  }
})
.__name("BytesTree")
.__desc("a tree of arbitrary binary data");

module.exports = F;
