import { MultisigAccount, NormalAccount } from "./ckb_account";

// https://ckb.tools/generator
const normalAccount = {
  privateKey:
    "0x13b08bb054d5dd04013156dced8ba2ce4d8cc5973e10d905a228ea1abc267e60",
  address:
    "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqw0q40f6t2slk2pyraxmxqh9z5mu4dl7wc2y595g",
  lockArgs: "0xcf055e9d2d50fd94120fa6d981728a9be55bff3b",
};

const multisigAccount = {
  input: {
    privateKeys: [
      "0x13b08bb054d5dd04013156dced8ba2ce4d8cc5973e10d905a228ea1abc267e60",
      "0x5368b818f59570b5bc078a6a564f098a191dcb8938d95c413be5065fd6c42d32",
    ],
    R: 2,
    M: 2,
  },
  output: {
    address:
      "ckt1qpw9q60tppt7l3j7r09qcp7lxnp3vcanvgha8pmvsa3jplykxn32sqgzvufpl4t0yks2uwyzx82cdlscmglxl0svza0k8",
    lockArgs: "0x0267121fd56f25a0ae388231d586fe18da3e6fbe",
  },
};

test("normal account", () => {
  const account = new NormalAccount(normalAccount.privateKey);
  expect(account.address).toBe(normalAccount.address);
  expect(account.lockScript.args).toBe(normalAccount.lockArgs);
});

test("multisig account", () => {
  const account = new MultisigAccount(
    multisigAccount.input.privateKeys,
    multisigAccount.input.R,
    multisigAccount.input.M
  );
  expect(account.address).toBe(multisigAccount.output.address);
  expect(account.lockScript.args).toBe(multisigAccount.output.lockArgs);
});
