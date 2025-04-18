/*********************
 *  CORE CONSTANTS   *
 *********************/
const API_BASE = 'https://statsapi.web.nhl.com/api/v1';
const playerCache = new Map();
let comparisonCache = null;

/*********************
 *  CORE FUNCTIONS   *
 *********************/
async function fetchWithDelay(url, delayMs = 300) {
  await new Promise(resolve => setTimeout(resolve, delayMs)); // Avoid rate limits
  const response = await fetch(url);
  return response.json();
}

async function getPlayerId(name) {
  if (playerCache.has(name)) return playerCache.get(name);
  
  const data = await fetchWithDelay(`${API_BASE}/people?name=${encodeURIComponent(name)}`);
  if (!data.people?.length) throw new Error(`Player "${name}" not found. Try full names like "Nathan MacKinnon"`);
  
  playerCache.set(name, data.people[0].id);
  return data.people[0].id;
}

async function getPlayerData(playerId) {
  const [currentSeason, gameLog, details] = await Promise.all([
    fetchWithDelay(`${API_BASE}/people/${playerId}/stats?stats=statsSingleSeason`),
    fetchWithDelay(`${API_BASE}/people/${playerId}/stats?stats=gameLog`),
    fetchWithDelay(`${API_BASE}/people/${playerId}`)
  ]);
  
  return {
    currentStats: currentSeason.stats[0]?.splits[0]?.stat || {},
    lastFiveGames: gameLog.stats[0]?.splits?.slice(0, 5) || [],
    details: details.people[0]
  };
}

/*********************
 *  ANALYSIS TOOLS   *
 *********************/
function calculateFantasyPoints(stats) {
  // Standard fantasy point calculation (adjust as needed)
  return (stats.goals || 0) * 2 + (stats.assists || 0) * 1 + (stats.shots || 0) * 0.1;
}

function analyzeTrend(games) {
  const points = games.reduce((sum, game) => sum + (game.stat.points || 0), 0);
  return {
    level: points >= 8 ? '🔥 Hot' : points <= 2 ? '❄️ Cold' : '🟡 Neutral',
    points
  };
}

/*********************
 *  UI INTERACTIONS  *
 *********************/
function displayPlayer(data) {
  const { details, currentStats, lastFiveGames } = data;
  const trend = analyzeTrend(lastFiveGames);
  
  document.getElementById('results').innerHTML = `
    <div class="player-card">
      <h2>${details.fullName} <span class="position">${details.primaryPosition.abbreviation}</span></h2>
      <p class="team">${details.currentTeam?.name || 'No team data'}</p>
      
      <div class="trend-indicator ${trend.level.includes('Hot') ? 'hot' : trend.level.includes('Cold') ? 'cold' : 'neutral'}">
        ${trend.level} Streak (${trend.points} pts in last 5 GP)
      </div>
      
      <div class="stats-grid">
        <div><span>🏒 GP:</span> ${currentStats.games || 0}</div>
        <div><span>🥅 G:</span> ${currentStats.goals || 0}</div>
        <div><span>🎯 A:</span> ${currentStats.assists || 0}</div>
        <div><span>📊 PTS:</span> ${currentStats.points || 0}</div>
        <div><span>🎮 FP:</span> ${calculateFantasyPoints(currentStats).toFixed(1)}</div>
        <div><span>💪 +/-:</span> ${currentStats.plusMinus || 0}</div>
      </div>
      
      <button class="compare-btn" onclick="prepareComparison(this)" 
        data-name="${details.fullName}"
        data-stats='${JSON.stringify(currentStats)}'>
        Compare Player
      </button>
    </div>
  `;
}

/*********************
 *  COMPARISON MODE  *
 *********************/
function prepareComparison(button) {
  comparisonCache = {
    name: button.dataset.name,
    stats: JSON.parse(button.dataset.stats)
  };
  document.getElementById('playerInput').placeholder = "Enter player to compare...";
}

function displayComparison(player2Data) {
  const p1 = comparisonCache;
  const p2 = {
    name: player2Data.details.fullName,
    stats: player2Data.currentStats
  };
  
  document.getElementById('results').innerHTML = `
    <div class="comparison">
      <h3>${p1.name} vs ${p2.name}</h3>
      <table>
        <tr><th>Stat</th><th>${p1.name}</th><th>${p2.name}</th></tr>
        ${['goals', 'assists', 'points', 'plusMinus'].map(stat => `
          <tr>
            <td>${stat}</td>
            <td class="${p1.stats[stat] > p2.stats[stat] ? 'leader' : ''}">${p1.stats[stat] || 0}</td>
            <td class="${p2.stats[stat] > p1.stats[stat] ? 'leader' : ''}">${p2.stats[stat] || 0}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;
  comparisonCache = null;
}

/*********************
 *  MAIN CONTROLLER  *
 *********************/
async function analyzePlayer() {
  const name = document.getElementById('playerInput').value.trim();
  if (!name) return;
  
  try {
    const playerId = await getPlayerId(name);
    const playerData = await getPlayerData(playerId);
    
    if (comparisonCache) {
      displayComparison(playerData);
    } else {
      displayPlayer(playerData);
    }
    
  } catch (error) {
    document.getElementById('results').innerHTML = `
      <div class="error">⚠️ ${error.message}</div>
    `;
  } finally {
    document.getElementById('playerInput').value = '';
  }
}

/*********************
 *  INITIALIZATION   *
 *********************/
document.getElementById('playerInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') analyzePlayer();
});
