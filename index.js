const Discord = require('discord.js');
const rn = require('random-number');

const config = require('./config.json');
const Dungeon = require('./map');
const Enemy = require('./enemies')

const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content === `<@${client.user.id}> start`){
    start()
  }
});

async function start() {
  var doQuit = false
  var dungeon = Dungeon.generateDungeon();
  console.log(dungeon.length);
  console.log(dungeon[0].length);
  getChannel().send("You are trapped in the Lincoln Castle Dungeons! See if you can make it out alive, together!")
  while (true) {
    Dungeon.parseDungeon(dungeon, client).forEach(message => getChannel().send(message));
    var msg = await getChannel().send("Vote on **this** message to move the player.\n* Either ⬆️ ➡️ ⬇️ or ⬅️.")
    dungeon = await performVote(msg, dungeon);
    dungeon = moveEnemies(dungeon);
  }
}

function performVote(msg, dungeon) {
  var timerStarted = false;
  const collector = msg.createReactionCollector((reaction, user) => true, {});
  const testStr = "⬆️➡️⬇️⬅️";

  return new Promise(function(resolve) {
    collector.on('collect', (reaction, collector) => {
      if (!timerStarted && testStr.includes(reaction.emoji.name)) {
        msg.edit(msg.content + "\n**Someone has voted, 15 second timer stating.**");
        setTimeout(() => {collector.stop()}, 15000)
        timerStarted = true;
        console.log(`Collected ${reaction.emoji.name}`);
      }
    });

    collector.on('end', collected => {
      var results = [];
      collected.forEach(emoji => {
        if (testStr.includes(emoji.emoji.name)) {
          console.log(`Collected ${emoji.emoji.name}  ${emoji.count}  times`);
          results.push({"emoji":emoji.emoji.name,"count":emoji.count});
        }
      });
      max = results[0]
      for (i=0; i<results.length; i++){
        if (max.count < results[i].count){
          max = results[i]
        }
      }
      console.log(max.emoji, " wins the vote!");
      getChannel().send(`${max.emoji} wins the vote!`);
      resolve(movePlayer(max.emoji, dungeon));
    });
  })
}

function movePlayer(emoji, dungeon){
  // dungeon is just an array
  switch(emoji){
    case '⬅️':
      var playerCurrI = 0; var playerCurrJ = 0; var playerNewI = 0; var playerNewJ = 0;
      // find 9 (player) in dungeon array
      for (i=0; i < dungeon.length; i++){
        if (playerCurrI != 0 || playerCurrJ != 0){
          break;
        }
        for (j=0; j < dungeon[i].length; j++){
          if (dungeon[i][j] === '9'){
            playerCurrI = i;
            playerCurrJ = j;
            playerNewI = i;
            playerNewJ = j-1;
          }
        }
      }
      if (dungeon[playerNewI][playerNewJ] === 0){
        dungeon[playerNewI][playerNewJ] = 9;
        dungeon[playerCurrI][playerCurrJ] = 0;
      }
  }
  return dungeon;
}

function moveEnemies(dungeon) {
  for (y = 1; y < dungeon.length - 1; ++y){
    for (x = 1; x < dungeon[y].length - 1; ++x){
      console.log(dungeon[y][x]);
      if (!(dungeon[y][x] instanceof Enemy)) continue;
      console.log(`moving enemy ${dungeon[y][x].constructor.name}`);
      var randomDir = rn({min:0, max:3, integer:true});
      for (i = 0; i < 4; ++i) {
        // Next direction
        randomDir += i;
        randomDir = randomDir % 4;
        if (randomDir == 0) { //up
          if (dungeon[y-1][x] !== 0) continue;
          var temp = dungeon[y-1][x];
          dungeon[y-1][x] = dungeon[y][x];
          dungeon[y][x] = temp;
          console.log("up");
          break;
        } else if (randomDir == 1) { // right
          if (dungeon[y][x+1] !== 0) continue;
          var temp = dungeon[y][x+1];
          dungeon[y][x+1] = dungeon[y][x];
          dungeon[y][x] = temp;
          console.log("down");
          break;
        } else if (randomDir == 2) { // down
          if (dungeon[y+1][x] !== 0) continue;
          var temp = dungeon[y+1][x];
          dungeon[y+1][x] = dungeon[y][x];
          dungeon[y][x] = temp;
          console.log("left");
          break;
        } else { // left
          if (dungeon[y][x-1] !== 0) continue;
          var temp = dungeon[y][x-1];
          dungeon[y][x-1] = dungeon[y][x];
          dungeon[y][x] = temp;
          console.log("right");
          break;
        }
      }
    }
  }
  return dungeon;
}


function getChannel() {
  return client.channels.get("510773738393042986");
}

client.login(config.token);
