const HDWalletProvider = require("truffle-hdwallet-provider");
const Web3 = require("web3");
const { interface, bytecode } = require("./compile.js");
require("dotenv").load();

const provider = new HDWalletProvider(
  process.env.mnemonic,
  "https://ropsten.infura.io/pzx45jOdl5HjHSvm8DcM"
);
const web3 = new Web3(provider);

let accounts;
let inbox;
const initial_string = "Hi there!";

const deploy = async () => {
  //Get a list of all the accounts
  accounts = await web3.eth.getAccounts();

  //Use one of those accounts to deploy the contract
  const result = (inbox = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({
      data: bytecode
    })
    .send({
      from: accounts[0],
      gas: "5000000"
    }));

  console.log(interface);
  console.log("Contract deployed to: ", result.options.address);
};

deploy();
