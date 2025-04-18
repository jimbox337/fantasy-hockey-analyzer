function analyzePlayer() {
    const playerName = document.getElementById('playerInput').value.trim();
    const resultsDiv = document.getElementById('results');
    
    if (!playerName) {
        resultsDiv.innerHTML = '<p>Please enter a player name to analyze.</p>';
        return;
    }
    
    // This is a mock analysis - in a real app, you'd call an API here
    const randomAnalysis = Math.random();
    
    if (randomAnalysis > 0.7) {
        resultsDiv.innerHTML = `
            <h2>${playerName}</h2>
            <p>🔥 This player is on a hot streak!</p>
            <p>Consider starting them in your lineup.</p>
        `;
    } else if (randomAnalysis > 0.3) {
        resultsDiv.innerHTML = `
            <h2>${playerName}</h2>
            <p>🟡 This player is performing at average levels.</p>
            <p>They might be worth starting depending on your other options.</p>
        `;
    } else {
        resultsDiv.innerHTML = `
            <h2>${playerName}</h2>
            <p>❄️ This player is in a cold streak.</p>
            <p>You might want to bench them until their performance improves.</p>
        `;
    }
}

// Add event listener for Enter key
document.getElementById('playerInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        analyzePlayer();
    }
});
// Cache player IDs to reduce API calls
const playerCache = new Map();

async function searchPlayerId(playerName) {
  if (playerCache.has(playerName)) {
    return playerCache.get(playerName);
  }

  const response = await fetch(
    `https://statsapi.web.nhl.com/api/v1/people?name=${encodeURIComponent(playerName)}`
  );
  const data = await response.json();
  
  if (!data.people || data.people.length === 0) {
    throw new Error("Player not found. Check spelling or try full name (e.g., 'Auston Matthews')");
  }

  const player = data.people[0];
  playerCache.set(playerName, player.id);
  return player.id;
}

async function getPlayerStats(playerId) {
  const [currentRes, gameLogRes] = await Promise.all([
    fetch(`https://statsapi.web.nhl.com/api/v1/people/${playerId}/stats?stats=statsSingleSeason`),
    fetch(`https://statsapi.web.nhl.com/api/v1/people/${playerId}/stats?stats=gameLog`)
  ]);

  const [currentData, gameLogData] = await Promise.all([
    currentRes.json(),
    gameLogRes.json()
  ]);

  return {
    currentSeason: currentData.stats[0]?.splits[0]?.stat || {},
    lastFiveGames: gameLogData.stats[0]?.splits?.slice(0, 5) || []
  };
}

function calculateTrend(lastFiveGames) {
  const points = lastFiveGames.reduce((sum, game) => sum + (game.stat.points || 0), 0);
  return {
    points,
    trend: points >= 8 ? '🔥 Hot Streak' : points <= 2 ? '❄️ Cold Streak' : '🟡 Average'
  };
}

async function analyzePlayer() {
  const playerName = document.getElementById('playerInput').value.trim();
  if (!playerName) return;

  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '<div class="loading">⏳ Loading player data...</div>';

  try {
    const playerId = await searchPlayerId(playerName);
    const { currentSeason, lastFiveGames } = await getPlayerStats(playerId);
    const { trend, points } = calculateTrend(lastFiveGames);

    resultsDiv.innerHTML = `
      <div class="player-card">
        <h2>${playerName}</h2>
        <p class="trend ${trend.includes('Hot') ? 'hot' : trend.includes('Cold') ? 'cold' : 'avg'}">${trend}</p>
        <div class="stats-grid">
          <div>📊 <strong>Points:</strong> ${currentSeason.points || 0}</div>
          <div>🥅 <strong>Goals:</strong> ${currentSeason.goals || 0}</div>
          <div>🎯 <strong>Assists:</strong> ${currentSeason.assists || 0}</div>
          <div>📈 <strong>Last 5 GP:</strong> ${points} pts</div>
        </div>
        <button id="compareBtn">Compare With Another Player</button>
      </div>
    `;

    // Add comparison functionality
    document.getElementById('compareBtn').addEventListener('click', comparePlayers);
  } catch (error) {
    resultsDiv.innerHTML = `<div class="error">❌ ${error.message}</div>`;
  }
}
let firstPlayerData = null;

async function comparePlayers() {
  const playerName = prompt("Enter another player to compare:");
  if (!playerName) return;

  try {
    const playerId = await searchPlayerId(playerName);
    const { currentSeason } = await getPlayerStats(playerId);
    
    if (!firstPlayerData) {
      firstPlayerData = {
        name: document.getElementById('playerInput').value.trim(),
        stats: JSON.parse(document.querySelector('.stats-grid').dataset.stats)
      };
      alert(`Now comparing with ${playerName}...`);
      return;
    }

    // Render comparison table
    document.getElementById('results').innerHTML = `
      <div class="comparison-table">
        <h3>Player Comparison</h3>
        <table>
          <tr>
            <th>Stat</th>
            <th>${firstPlayerData.name}</th>
            <th>${playerName}</th>
          </tr>
          ${Object.keys(firstPlayerData.stats).map(stat => `
            <tr>
              <td>${stat}</td>
              <td>${firstPlayerData.stats[stat]}</td>
              <td>${currentSeason[stat] || 0}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
    
    firstPlayerData = null;
  } catch (error) {
    alert(error.message);
  }
}
function calculateAdvancedMetrics(stats) {
  const pdo = (stats.shootingPercentage + stats.savePercentage) || 'N/A';
  const xGF = stats.xGoalsFor || 'N/A';
  return { pdo, xGF };
}
async function getTeamRoster(teamId) {
  const res = await fetch(`https://statsapi.web.nhl.com/api/v1/teams/${teamId}/roster`);
  return await res.json();
}
