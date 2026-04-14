# Influence Ethereum - Codebase Summary

Smart contracts for **Influence** -- a grand strategy game set in an asteroid belt, built on Ethereum with Starknet L2 integration. Developed by Unstoppable Games, Inc. using the Truffle framework with Solidity 0.8.19.

---

## Folder & File Hierarchy

```
influence-ethereum/
├── bin/                              # CLI scripts & data exporters
│   ├── exporter/
│   │   ├── lib/
│   │   │   ├── utils.js              # Random crew feature generation helpers
│   │   │   └── web3.js               # Web3 WebSocket provider setup
│   │   ├── asteroids.js              # Export all 250k asteroids to JSON
│   │   ├── crew_credit_features.js   # Export crew credit features to JSON
│   │   └── crewmates.js              # Export all crewmates to JSON
│   ├── generateAbis.js               # Extract ABIs from compiled contracts
│   ├── printEnv.js                   # Print deployed contract addresses as env vars
│   ├── seedAsteroids.js              # Import asteroid snapshot to chain
│   ├── seedChain.js                  # Populate dev chain with test data
│   └── seedCrewmates.js              # Import crewmate snapshot to chain
│
├── contracts/                        # Solidity smart contracts
│   ├── asteroids/
│   │   ├── AsteroidBridge.sol        # L1<->L2 Starknet bridge for asteroids
│   │   ├── AsteroidFeatures.sol      # Procedural generation of asteroid properties
│   │   ├── AsteroidNames.sol         # User-settable asteroid naming system
│   │   ├── AsteroidScans.sol         # Scan ordering & randomized bonus generation
│   │   └── AsteroidToken.sol         # ERC721 token (250,000 max supply)
│   ├── crew/
│   │   ├── Crew.sol                  # ERC721Upgradeable crew contract (v2)
│   │   └── CrewBridge.sol            # L1<->L2 Starknet bridge for crew
│   ├── crewmates/
│   │   ├── ArvadCitizenGenerator.sol # Feature generator for Citizens (collection 2)
│   │   ├── ArvadCrewGenerator.sol    # Base class with shared generation logic
│   │   ├── ArvadLeadersGenerator.sol # Hardcoded 13 department heads (collection 0)
│   │   ├── ArvadSpecialistGenerator.sol # Feature generator for Specialists (collection 1)
│   │   ├── CrewFeatures.sol          # Pluggable feature generation manager
│   │   ├── CrewmateBridge.sol        # L1<->L2 bridge (supports both token versions)
│   │   ├── CrewmateToken.sol         # ERC721Upgradeable crewmate token (v2)
│   │   ├── CrewNames.sol             # One-time crew naming (immutable after set)
│   │   └── CrewToken.sol             # Legacy ERC721 crew token (v1)
│   ├── interfaces/                   # Contract interfaces
│   │   ├── IAsteroidFeatures.sol
│   │   ├── IAsteroidNames.sol
│   │   ├── IAsteroidScans.sol
│   │   ├── IAsteroidToken.sol
│   │   ├── ICrew.sol
│   │   ├── ICrewFeatures.sol
│   │   ├── ICrewGenerator.sol
│   │   ├── ICrewmateToken.sol
│   │   ├── ICrewNames.sol
│   │   ├── ICrewToken.sol
│   │   ├── IPlanets.sol
│   │   ├── IShip.sol
│   │   ├── IStarknetCore.sol
│   │   ├── ISwayToken.sol
│   │   └── ISwayVolumeSource.sol
│   ├── lib/                          # Shared libraries
│   │   ├── InfluenceRoles.sol        # Role constants (GOVERNOR, MANAGER, TRANSFERRER)
│   │   ├── InfluenceSettings.sol     # Game constants (MASTER_SEED, MAX_RADIUS, etc.)
│   │   ├── InfluenceUtils.sol        # Utility functions (bit-packing, string conversion)
│   │   └── Procedural.sol            # Deterministic RNG using ABDK fixed-point math
│   ├── mocks/                        # Test doubles
│   │   ├── InfluenceUtilsMock.sol
│   │   ├── ProceduralMock.sol
│   │   ├── ScansMock.sol
│   │   ├── StarknetcoreMock.sol
│   │   └── StarknetcoreMockWithFail.sol
│   ├── sales/
│   │   ├── ArvadCrewSale.sol         # Combined asteroid + crew sale (11,100 units)
│   │   └── AsteroidSale.sol          # Initial asteroid sale (area-based pricing)
│   ├── ships/
│   │   ├── Ship.sol                  # ERC721Upgradeable ship token
│   │   └── ShipBridge.sol            # L1<->L2 Starknet bridge for ships
│   ├── sway/
│   │   ├── StarknetSwayVolume.sol    # L2 volume reporter for governance
│   │   ├── SwayBridge.sol            # L1<->L2 bridge for SWAY token
│   │   ├── SwayGovernor.sol          # Velocity-based emission & claim distribution
│   │   └── SwayToken.sol             # ERC20 governance token (97.5B supply, 6 decimals)
│   ├── Migrations.sol                # Truffle migration tracker
│   └── Planets.sol                   # Hardcoded orbital mechanics for 5 planets
│
├── migrations/                       # 27 Truffle deployment scripts (ordered)
│   ├── 1_initial_migration.js
│   ├── 2_libraries.js                # ABDKMath64x64, Procedural, InfluenceSettings
│   ├── 3_planets.js
│   ├── 4_asteroid_features.js
│   ├── 5_asteroid_token.js
│   ├── 6_asteroid_scans.js
│   ├── 7_asteroid_sale.js
│   ├── 8_asteroid_names.js
│   ├── 9_arvad_specialist_generator.js
│   ├── 10_arvad_citizen_generator.js
│   ├── 11_crew_features.js
│   ├── 12_crew_token.js
│   ├── 13_crew_names.js
│   ├── 14_arvad_crew_sale.js
│   ├── 15_arvad_leaders_generator.js
│   ├── 16_sway_token.js
│   ├── 17_sway_token_governor.js     # Upgradeable proxy
│   ├── 18_crewmate_token.js          # Upgradeable proxy
│   ├── 19_asteroid_bridge.js         # Upgradeable proxy
│   ├── 20_crewmate_bridge.js         # Upgradeable proxy
│   ├── 21_upgrade_governor.js        # Proxy upgrade
│   ├── 22_sway_bridge.js
│   ├── 23_crew.js                    # Upgradeable proxy
│   ├── 24_crew_bridge.js             # Upgradeable proxy
│   ├── 25_ship.js                    # Upgradeable proxy
│   ├── 26_ship_bridge.js             # Upgradeable proxy
│   └── 27_starknet_sway_volume.js    # Upgradeable proxy
│
├── test/                             # JavaScript test suite (Truffle)
│   ├── asteroids/
│   │   ├── TestAsteroidBridge.js
│   │   ├── TestAsteroidFeatures.js
│   │   ├── TestAsteroidNames.js
│   │   ├── TestAsteroidScans.js
│   │   └── TestAsteroidToken.js
│   ├── crew/
│   │   ├── TestCrew.js
│   │   └── TestCrewBridge.js
│   ├── crewmates/
│   │   ├── TestArvadCitizenGenerator.js
│   │   ├── TestArvadLeadersGenerator.js
│   │   ├── TestArvadSpecialistGenerator.js
│   │   ├── TestCrewFeatures.js
│   │   ├── TestCrewmateBridge.js
│   │   ├── TestCrewmateToken.js
│   │   ├── TestCrewNames.js
│   │   └── TestCrewToken.js
│   ├── helpers/
│   │   ├── blockchain.js             # EVM time/block manipulation helpers
│   │   └── Math64.js                 # Fixed-point <-> float conversion
│   ├── lib/
│   │   ├── constants.js              # Role hashes, zero address
│   │   ├── TestProcedural.js
│   │   ├── TestScansMock.js
│   │   └── TestUtils.js
│   ├── sales/
│   │   ├── TestArvadCrewSale.js
│   │   └── TestAsteroidSale.js
│   ├── ships/
│   │   ├── TestShip.js
│   │   └── TestShipBridge.js
│   ├── sway/
│   │   ├── TestStarknetSwayVolume.js
│   │   ├── TestSwayBridge.js
│   │   ├── TestSwayGovernor.js
│   │   └── TestSwayToken.js
│   └── TestPlanets.js
│
├── .openzeppelin/                    # Proxy deployment state
│   ├── goerli.json
│   ├── mainnet.json
│   └── sepolia.json
│
├── index.js                          # Exports compiled contract ABIs as a module
├── package.json                      # Node deps (Truffle, OpenZeppelin, ABDK math)
├── truffle-config.js                 # Network config (dev, goerli, sepolia, mainnet)
├── .travis.yml                       # CI config
├── .eslintrc.json
├── .solhint.json
├── .nvmrc                            # Node version
└── README.md                         # Setup instructions
```

---

## Top-Level Summary

This repo contains the **Ethereum L1 smart contracts** for Influence. The game revolves around four on-chain asset types:

| Asset | Contract | Type | Notes |
|-------|----------|------|-------|
| **Asteroids** | `AsteroidToken` | ERC721 | 250,000 total, procedurally generated |
| **Crewmates** | `CrewToken` (v1) / `CrewmateToken` (v2) | ERC721 | Three tiers: Leaders, Specialists, Citizens |
| **Crew** | `Crew` | ERC721Upgradeable | Newer crew system |
| **Ships** | `Ship` | ERC721Upgradeable | In-game vessels |
| **SWAY** | `SwayToken` | ERC20 | Governance token, 97.5B supply, 6 decimals |

All NFT assets can be **bridged to Starknet L2** (where the actual game runs) and back via dedicated bridge contracts that use the Starknet Core messaging protocol.

---

## Key Architectural Patterns

### Procedural Generation
All game content is **deterministically generated from seeds** using the `Procedural` library (SHA256 + ABDK fixed-point math). Given the same asteroid ID, you always get the same radius, spectral type, and orbital elements. Same for crew features. No explicit storage is needed for base properties.

### Upgradeable vs Non-Upgradeable
- **Upgradeable** (OpenZeppelin proxy): `CrewmateToken`, `Crew`, `Ship`, all Bridges, `SwayGovernor`, `StarknetSwayVolume`
- **Non-upgradeable**: `AsteroidToken`, `CrewToken`, `SwayToken`, Sales, Features, Generators

### Access Control (Manager Pattern)
Most contracts use a manager whitelist (`addManager`/`removeManager`) for privileged operations like minting and burning, separate from owner-only admin functions (pause, withdraw, set parameters).

### Role-Based Access (SWAY ecosystem)
- `GOVERNOR_ROLE` -- can mint SWAY tokens
- `MANAGER_ROLE` -- can mint/burn NFTs
- `TRANSFERRER_ROLE` -- can transfer SWAY before public launch

### Bit-Packing
Features are packed into single `uint256` values to minimize storage. Asteroid scans pack scan order + bonuses + block hash. Crew features pack sex, body, class, job, clothes, hair, facial features, hair color, headpiece, and item into one word.

### L1/L2 Bridging (Starknet)
All NFT bridges follow the same pattern:
1. **L1 -> L2**: Burn token on Ethereum, send message to Starknet (batch up to 25)
2. **L2 -> L1**: Consume Starknet message, mint token on Ethereum
3. **Cancellation**: Start cancel -> wait delay -> finish cancel (re-mints on L1)

---

## Main Flows

### 1. Asteroid Purchase & Scanning

```
Player pays ETH
    -> AsteroidSale.purchase()
        -> AsteroidToken.mint(asteroidId)       # NFT minted to buyer
        -> AsteroidScans.recordScanOrder()       # Track purchase order
    -> Owner calls AsteroidScans.startScan()     # Initiate scan
    -> Wait 1+ blocks
    -> Owner calls AsteroidScans.finalizeScan()  # Random bonuses generated from blockhash
```

**Pricing**: `basePrice + (radius^2 / 250,000) * lotPrice` (area-based).
**Bonuses**: Earlier scan orders get higher bonus multipliers (4x for first 100, 3x for 101-1100, 2x for 1101-11100).

### 2. Crew Minting via Asteroid Ownership

```
Player owns asteroid with scan order in valid range
    -> ArvadCrewSale.mintCrewWithAsteroid(asteroidId)
        -> Determines collection based on scan order:
             Scan order 1-100:      Specialist (collection 1, higher rarity)
             Scan order 101-1100:   Specialist
             Scan order 1101-11100: Citizen (collection 2, lower rarity)
        -> Calculates modifier from asteroidId: (250000 - id)^2 / 25000000
        -> CrewFeatures.setFeatures() with appropriate generator
        -> CrewToken.mint()          # One crew per asteroid, one-time only
```

### 3. Crew Feature Generation

```
CrewFeatures.getFeatures(tokenId)
    -> Looks up collection & generator for token
    -> Generator.getFeatures(crewId, modifier)
        -> Deterministic RNG from seed + crewId:
             Sex, Body, Class (Pilot/Engineer/Miner/Merchant/Scientist),
             Job (52 possibilities), Clothes, Hair, Facial Features,
             Hair Color, Headpiece, Item (Specialists only)
        -> Higher modifier = better chance at rare jobs/headpieces
    -> Returns bit-packed uint256
```

**Three tiers**:
- **Leaders** (collection 0): 13 hardcoded department heads with fixed features
- **Specialists** (collection 1): Procedurally generated, +2500 base rarity modifier, includes items
- **Citizens** (collection 2): Procedurally generated, no rarity boost, no items

### 4. SWAY Token Economics

```
Launch:
    SwayToken deployed with 97.5B supply (32.5B minted at launch)
    SwayGovernor manages ongoing emissions

Per-period emission (1 period = ~11.6 days):
    -> Governor.processPeriod()
        -> Collect volumes from L1 SwayToken + L2 StarknetSwayVolume
        -> velocity = totalVolume / totalSupply
        -> avgVelocity = trailing 30-period average
        -> emission = supply * MAX_EMISSION * SENSITIVITY^(1/(avgVelocity - velocity))
        -> Distribute to beneficiaries (minimum rates first, then excess pro-rata)

Player claims:
    -> Governor.claimAssignmentSway(asteroidIds[], crewIds[])
        -> Asteroid reward = 4pi * radius^2 (in km^2) * 6922 SWAY
        -> Crew reward = 650,000 SWAY per token
        -> Only first 11,100 scan orders eligible
        -> One claim per token, one claim per address
```

### 5. Bridging Assets to Starknet L2

```
L1 -> L2 (Deposit):
    Player calls Bridge.depositTokens(tokenIds[], starknetRecipient)
        -> Tokens burned on Ethereum
        -> Message sent to Starknet Core with payload
        -> Tokens minted on Starknet (handled by L2 contract)

L2 -> L1 (Withdrawal):
    L2 contract sends message to L1
    Player calls Bridge.withdrawTokens(tokenIds[], recipient)
        -> Consumes Starknet message
        -> Tokens minted on Ethereum

Cancellation (if L2 doesn't process):
    -> Bridge.startCancelDeposit()   # Initiate cancel
    -> Wait for delay period
    -> Bridge.finishCancelDeposit()  # Re-mint tokens on L1
```

### 6. Data Export Pipeline

```
For game client/server consumption:
    bin/exporter/asteroids.js
        -> Queries all 250k asteroids from chain
        -> Outputs build/asteroids.json (owned asteroids with names, scans, features)
        -> Outputs build/crew_credit_features.json (unused crew credits)

    bin/exporter/crewmates.js
        -> Queries all crewmates from chain
        -> Outputs build/crew.json (owned crewmates with names, features)
```

---

## Contract Dependency Graph

```
Shared Libraries
  ABDKMath64x64 + Procedural + InfluenceSettings
         |
         v
  Planets (orbital data)
         |
    +----+----+
    v         v
AsteroidFeatures    ArvadCrewGenerator (base)
    |                  |        |         |
    v                  v        v         v
AsteroidToken    Specialist  Citizen   Leaders
    |            Generator  Generator Generator
    v                  \      |       /
AsteroidScans           CrewFeatures
    |                       |
    v                       v
AsteroidSale --------> ArvadCrewSale ----> CrewToken
    |                                         |
    v                                         v
AsteroidNames                            CrewNames

SwayToken ----> SwayGovernor <---- StarknetSwayVolume
                    |
                    v
            (references AsteroidToken, AsteroidFeatures,
             AsteroidScans, CrewToken for claim calculations)

Bridges (all follow same pattern):
  AsteroidBridge, CrewmateBridge, CrewBridge, ShipBridge, SwayBridge
  Each uses IStarknetCore for L1<->L2 messaging
```

---

## Development Setup

```bash
# Install dependencies
npm install

# Start local chain
ganache-cli --host localhost

# Deploy all contracts
truffle migrate

# Seed dev chain with test data
truffle exec ./bin/seedChain.js

# Run tests
npm test

# Generate ABIs for client/server
node ./bin/generateAbis.js > contracts.json

# Print env vars for deployed contracts
truffle exec ./bin/printEnv.js
```

**Networks**: development (localhost:8545), goerli, sepolia, production (mainnet via Infura).

**Key env vars**: `MNEMONIC`, `INFURA_ID`, `TEST_ADDRESS`, `DEPLOY_ADDRESS`, `DEPLOY_GAS_PRICE`, `ETHERSCAN_API_KEY`, `STARKNET_CORE_ADDRESS`, and per-bridge Starknet addresses.
