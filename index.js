// Places contracts ABIs into easy to retrieve object

const fs = require('fs');
let contracts = {};
const files = fs.readdirSync(`${__dirname}/build/contracts/`);
let abi, file, contractName;

for (let i = 0; i < files.length; i++) {
  file = files[i];
  contractName = file.split('.')[0];
  abi = require(`./build/contracts/${file}`);
  contracts[contractName] = abi;
}

module.exports = contracts;
