const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());
const { interface, bytecode } = require("../compile");

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({
      data: bytecode
    })
    .send({
      from: accounts[0],
      gas: "1000000"
    });
});

describe("Lottery Contact", () => {
  it("deploys a contract", () => {
    assert.ok(lottery.options.address);
  });

  it("adds one address to the lottery", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei(".2", "ether")
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });

    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);
  });

  it("allows multiple players", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei(".2", "ether")
    });
    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei(".2", "ether")
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });

    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(2, players.length);
  });

  it("requires a min amount of ether to enter", async () => {
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: 10
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("only manager can call pickWinner", async () => {
    try {
      await lottery.methods.pickWinner().send({
        from: accounts[1]
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("gets the address of the winner", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether")
    });

    await lottery.methods.pickWinner().send({
      from: accounts[0]
    });

    const winner = await lottery.methods.getWinner().call({
      from: accounts[0]
    });

    assert.equal(accounts[0], winner);
  });

  it("sends money to the winner and resets the lottery", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether")
    });

    const initial_balance = await web3.eth.getBalance(accounts[0]);

    await lottery.methods.pickWinner().send({
      from: accounts[0]
    });

    const final_balance = await web3.eth.getBalance(accounts[0]);
    const difference = final_balance - initial_balance;
    assert(difference > web3.utils.toWei("1.8", "ether"));

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });
    assert.equal(0, players.length);

    const contract_balance = await lottery.methods.getBalance().call({
      from: accounts[0]
    });
    assert.equal(contract_balance, 0);
  });
});
