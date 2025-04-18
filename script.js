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