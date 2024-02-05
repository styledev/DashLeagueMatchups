// https://developers.google.com/sheets/api/quickstart/nodejs

const generate   = require("./generate"),
      fs         = require('fs').promises,
      path       = require('path'),
      {google}   = require('googleapis'),
      TOKEN_PATH = path.join(process.cwd(), 'token.json');
      
let args     = { 'id': 2, 'season': 3, 'cycle': 4, 'opponents': 5 },
    sheets   = null,
    matchups = {},
    teams    = [];
    
for ( const arg of Object.entries(args) ) {
  if ( !process.argv[arg[1]] ) {
    console.error(`Missing ${arg[0]} argument.`);
    console.error("Usage: node googlesheet.js <googlesheet id> <season> <cycle> <num_of_opponents>");
    process.exit(1);
  }
  else {
    args[arg[0]] = process.argv[arg[1]];
  }
}

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  
  if ( client ) {
    return client;
  }
  else {
    console.error("You must first authorize the app with your Google Account.");
    console.error("Usage: node googleapi.js");
    process.exit(1);
  }
}

async function listData(auth) {
  sheets = google.sheets({version: 'v4', auth});
  
  const col = String.fromCharCode(97 + parseInt(args.cycle) - 1);
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: args.id, //1u7IhCtWhfBJbCesWs0-e9zpGQFbdEB_lOKCkp1iHCzg
    range: `S${args.season}!A2:${col}`,
  });
  
  const rows = res.data.values;
  
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  
  rows.forEach((row, index) => {
    const team = row[0];
    
    teams.push(team);
    
    let matches = [];
    
    row.forEach((r, k) => {
      if ( k == 0 ) return;
      
      r = r.split(',');
      
      matches = [...matches, ...r];
    })
    
    matchups[team] = matches;
  });
}

async function matchupData() {
  const data = generate(teams, matchups, args.opponents).default,
        rows = {};
        
  teams.forEach((team) => {
    rows[team] = [data[team].join(', ')];
  })
  
  console.log(rows);
  
  return Object.values(rows);
}

async function updateData( data ) {
  const col = String.fromCharCode(97 + parseInt(args.cycle));
  
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId: '1u7IhCtWhfBJbCesWs0-e9zpGQFbdEB_lOKCkp1iHCzg',
    range: `S${args.season}!${col}2`, //'S1!B2',
    valueInputOption: "RAW",
    resource: {
      values: data
    }
  });
  
  console.log(JSON.stringify(res.data, null, 2));
}

authorize().then(listData).then(matchupData).then(updateData).catch(console.error);
// authorize().then(listData).then(matchupData).catch(console.error); // for testing purposes

/*
  Need to build matchups like https://dashleague.games/wp-json/api/v1/public/data?data=matchups&season=6&cycle=2
  {
    "data": {
      "EMU": [ "HAXX", "LMB0" ],
      "ENVY": [ "AESR", "OTHR" ],
      "F1R3": [ "HAXX", "NOC" ],
      "HAXX": [ "EMU", "F1R3" ],
      "L1FE": [ "AESR", "LOOP" ],
      "LMB0": [ "EMU", "NOC" ],
      "SITH": [ "IMTL", "THVS" ],
      "SKY": [ "BSRK", "D" ],
      "SPNV": [ "HUSH", "V" ],
      "STHX": [ "BNDT", "V" ],
      "TBDi": [ "UNSC", "ZT" ],
      "UNSC": [ "TBDi", "ZT" ]
    }
  }
*/