// app.js
// app.js (add these at the top)
const historyBtn = document.getElementById('history-btn');
const historySection = document.getElementById('history-section');
const historyList = document.getElementById('history-list');
const usernameEl = document.getElementById('username');
const balanceEl = document.getElementById('balance');
const avatarEl = document.getElementById('avatar');

document.addEventListener('DOMContentLoaded', () => {
    // ⚠️ CRITICAL STEP ⚠️
    // You will replace this with your LIVE backend URL from Render.com later.
    const API_URL = 'https://stake-backend-ruwf.onrender.com/'; 

    // --- DOM Elements ---
    const streakCounter = document.getElementById('streak-counter');
    const betStatus = document.getElementById('bet-status');
    const placeBetBtn = document.getElementById('place-bet-btn');
    const listeningStatus = document.getElementById('listening-status');
    
    // --- Telegram Web App SDK ---
    const tg = window.Telegram.WebApp;
    tg.ready(); // Let Telegram know the app is ready
    tg.expand(); // Make the app full-screen

    let pollerInterval = null; // Variable to hold our polling timer

    // --- Functions ---

    // Fetches the current streak and status from our backend
    const fetchStatus = async () => {
        try {
            const response = await fetch(`${API_URL}/api/status`);
            const data = await response.json();
            streakCounter.textContent = data.streak;
            betStatus.textContent = data.status;
        } catch (error) {
            betStatus.textContent = "Could not connect to server.";
        }
    };

    // The main function that starts the process
    const startBettingProcess = () => {
        // 1. Open Stake.com in Telegram's built-in browser
        tg.openLink('https://stake.com/sports/soccer');
        
        // 2. Update the UI to show we're "listening"
        placeBetBtn.disabled = true;
        listeningStatus.textContent = "Listening for your bet...";
        listeningStatus.style.display = 'block';

        // 3. Start polling the backend every 10 seconds to check for a new bet
        let attempts = 0;
        const maxAttempts = 30; // Stop after 5 minutes (30 * 10s)

        pollerInterval = setInterval(async () => {
            if (attempts >= maxAttempts) {
                stopPolling("Polling timed out. Did you place a bet?");
                return;
            }
            
            try {
                console.log(`Polling attempt #${attempts + 1}`);
                const response = await fetch(`${API_URL}/api/check-new-bet`);
                const result = await response.json();

                if (result.newBet) {
                    // SUCCESS! A new bet was found.
                    tg.HapticFeedback.notificationOccurred('success');
                    tg.showAlert(`✅ Bet detected! Your streak is now ${result.bet.streak || streakCounter.textContent + 1}.`);
                    stopPolling();
                    await fetchStatus(); // Refresh the main status display with the new data
                }
            } catch (error) {
                stopPolling("Error checking for bet.");
            }
            attempts++;
        }, 10000); // Check every 10 seconds
    };

    // Stops the polling and resets the UI
    function stopPolling(message = "") {
        if (pollerInterval) {
            clearInterval(pollerInterval);
            pollerInterval = null;
        }
        placeBetBtn.disabled = false;
        if (message) {
            listeningStatus.textContent = message;
        } else {
            listeningStatus.style.display = 'none';
        }
    }

    // --- Event Listeners ---
    placeBetBtn.addEventListener('click', startBettingProcess);

    // Initial load when the app opens
    fetchStatus();
    fetchUserProfile(); // Fetch user profile data on load
    // app.js (add this new function)
const fetchUserProfile = async () => {
    try {
        const response = await fetch(`${API_URL}/api/user-profile`);
        const profile = await response.json();
        
        usernameEl.textContent = profile.name;
        // Format the balance to 2 decimal places
        balanceEl.textContent = `USDT: ${profile.usdt.toFixed(2)}`; 
        avatarEl.src = profile.avatarUrl;
    } catch (error) {
        usernameEl.textContent = 'Error';
        balanceEl.textContent = 'Could not load balance.';
    }
};
// app.js (add this new function/event listener)

historyBtn.addEventListener('click', async () => {
    // Toggle visibility of the history section
    const isHidden = historySection.classList.toggle('hidden');
    historyBtn.textContent = isHidden ? 'View History' : 'Hide History';

    // If we are showing the section, fetch the data
    if (!isHidden) {
        historyList.innerHTML = '<li>Loading history...</li>'; // Show loading indicator
        try {
            const response = await fetch(`${API_URL}/api/bet-history`);
            const history = await response.json();

            if (history.length === 0) {
                historyList.innerHTML = '<li>No bets placed yet.</li>';
                return;
            }

            // Clear the list and build the new items
            historyList.innerHTML = '';
            history.forEach(bet => {
                const li = document.createElement('li');
                // Add a class based on the bet status (won, lost, pending)
                li.className = `history-item ${bet.status.toLowerCase()}`;
                
                li.innerHTML = `
                    <p><strong>Bet ID:</strong> ${bet.id}</p>
                    <p><strong>Amount:</strong> ${bet.amount} ${bet.currency?.symbol || 'USD'}</p>
                    <p><strong>Odds:</strong> x${bet.potentialMultiplier}</p>
                    <p><strong>Status:</strong> ${bet.status}</p>
                `;
                historyList.appendChild(li);
            });

        } catch (error) {
            historyList.innerHTML = '<li>Failed to load history.</li>';
        }
    }
});
});