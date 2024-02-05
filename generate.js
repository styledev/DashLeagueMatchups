const maxRounds  = 500000,
      seedrandom = require("./seedrandom");
      
/* Randomize array using Durstenfeld shuffle algorithm */
function shuffle(a) {
  const array = [...a];
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

function getRngSeed(tiers) {
  return Object.values(tiers)
    .map((t) => t.join(""))
    .join("");
}

function addMatchup(matchups, team, opponent) {
  if (!matchups[team]) matchups[team] = [];
  if (!matchups[opponent]) matchups[opponent] = [];
  
  matchups[team].push(opponent);
  matchups[opponent].push(team);
}

function genMatchups(matchups, tiers, tier, maxRematches, opponents) {
  const newMatchups = {}, rematchesAdded = [];
  
  /* Need to figure out why previous matchups is not being taken into account. */
    // console.log(matchups);
  
  const findMatchups = (team) => Object.values(newMatchups).filter((matches) => matches.includes(team));
  
  const findUnfinishedMatchups = () => tiers[tier].filter(
    (team) => !newMatchups[team] || newMatchups[team].length < opponents
  );
  
  for ( const team of shuffle(tiers[tier]) ) {
    if ( !newMatchups[team] ) newMatchups[team] = [];
    
    if ( newMatchups[team].length === opponents ) continue;
    
    const otherTeams = shuffle(tiers[tier].filter((t) => t !== team));
    
    const rematches = otherTeams.filter(
      (t) =>
        ((matchups[t] || []).includes(team) ||
          (matchups[team] || []).includes(t)) &&
        findMatchups(t).length < opponents
    );
    
    const newOpponents = otherTeams.filter(
      (opponent) =>
        !rematches.includes(opponent) && findMatchups(opponent).length < opponents
    );
    
    const matchupsLeft = opponents - (newMatchups[team] || []).length;
    
    if ( matchupsLeft > newOpponents.length ) {
      // if no opponents are found, try adding rematches
      if (rematches.length > 0 && rematchesAdded.length < maxRematches) {
        const opponent = rematches.pop();
        
        addMatchup(newMatchups, team, opponent);
        
        rematchesAdded.push([team, opponent]);
        
        continue;
      }
      
      break;
    }
    
    for ( let a = matchupsLeft; a > 0; a-- ) addMatchup(newMatchups, team, newOpponents.pop());
  }
  
  if ( findUnfinishedMatchups().length === 0 ) {
    const rematchList = rematchesAdded
      .map((m) => `${m[0]} vs ${m[1]}`)
      .join(", ");
      
    if ( rematchesAdded.length > 0 ) {
      console.log(
        `${tier} has ${rematchesAdded.length} rematches`,
        rematchesAdded.length > 0 ? rematchList : ""
      );
    }
    
    return newMatchups;
  }
}

function tiers( tiers, matchups, opponents ) {
  Math.seedrandom(getRngSeed(tiers));
  
  const allMatchups = {};
  
  for (const tier in tiers) {
    let done = false, maxRematches = 0;
    
    while ( !done ) {
      for (let rounds = maxRounds; rounds > 0; rounds--) {
        const newMatchups = genMatchups(matchups, tiers, tier, maxRematches, opponents);
        
        if ( newMatchups ) {
          done = true;
          
          allMatchups[tier] = newMatchups;
          
          break;
        }
      }
      
      // creating matches with the allowed number of rematches failed, try again
      // with 1 more rematch allowed
      if ( maxRematches < 6 ) maxRematches += 1;
      else done = true;
    }
  }
  
  return allMatchups;
}

function generate( teams, matchups, opponents = 2 ) {
  teams = teams[0] === undefined ? teams : {'default': teams};
  
  return tiers(teams, matchups, opponents);
}

module.exports = generate