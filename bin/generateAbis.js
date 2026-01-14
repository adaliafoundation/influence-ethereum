// Places contracts ABIs into easy to retrieve object

const fs = require('fs');
const contractsToExport = [
  'ArvadCitizenGenerator',
  'ArvadCrewGenerator',
  'ArvadLeadersGenerator',
  'ArvadSpecialistGenerator',
  'ArvadCrewSale',
  'AsteroidBridge',
  'AsteroidFeatures',
  'AsteroidNames',
  'AsteroidSale',
  'AsteroidScans',
  'AsteroidToken',
  'ArvadCrewSale',
  'CrewFeatures',
  'CrewNames',
  'CrewToken',
  'CrewmateBridge',
  'CrewmateToken',
  'Crew',
  'CrewBridge',
  'IStarknetCore',
  'Planets',
  'Ship',
  'ShipBridge',
  'StarknetSwayVolume',
  'SwayBridge',
  'SwayGovernor',
  'SwayToken'
];

let file;
const output = {};

for (let c of contractsToExport) {
  file = require(`../build/contracts/${c}.json`);
  output[c] = file.abi;
}

process.stdout.write(JSON.stringify(output));
