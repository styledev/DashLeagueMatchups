const axios    = require("axios"),
      generate = require("./generate");

if (!process.argv[2]) {
  console.error("Missing cycle argument.");
  console.error("Usage: node matchupsGenerator.js <cycle>");
  process.exit(1);
}

const cycle = process.argv[2];

const apiMatchups = 'https://dashleague.games/wp-json/api/v1/public/data?data=matchups',
      apiTiers    = `https://dashleague.games/wp-json/api/v1/public/data?data=tiers&cycle=${cycle}`;

async function main() {
  const matchups = (await axios.get(apiMatchups)).data.data,
        tiers    = (await axios.get(apiTiers)).data.data,
        data     = generate(tiers, matchups);
        
  for (const tier in data) {
    console.log(`\n${tier[0].toUpperCase()}${tier.slice(1)}`);
    for (const team of tiers[tier]) {
      console.log(`  ${team}: ${data[tier][team].join(", ")}`);
    }
  }
}

main();