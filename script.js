let timer;
let timeLeft = 60;
let score = 1000;
let movieTitle = "";
let displayedTitle = "";
let cluesGiven = 0;
let leaderboard = [];
let clue1 = ""; // Release Date
let clue2 = ""; // Starring

function loadRandomMovie() {
    fetch('2022 all telugu.csv')
        .then(response => response.text())
        .then(data => {
            const rows = data.split('\n'); // Split into rows
            const headers = rows[0].split(',').map(header => header.trim().toLowerCase()); // Normalize headers

            // Dynamically map column indices based on headers
            const monthIndex = headers.indexOf('month');
            const dateIndex = headers.indexOf('date');
            const titleIndex = headers.indexOf('title');
            const castIndex = headers.indexOf('cast');
            const yearIndex = headers.indexOf('year');

            // Check if all required columns exist
            if (
                monthIndex === -1 ||
                dateIndex === -1 ||
                titleIndex === -1 ||
                castIndex === -1 ||
                yearIndex === -1
            ) {
                console.error("CSV does not have the required columns.");
                return;
            }

            // Parse movie data
            const movies = rows.slice(1).map(row => {
                const columns = row.split(',');

                return {
                    title: columns[titleIndex]?.trim(),
                    releaseDate: `${capitalizeFirstLetter(columns[monthIndex]?.trim())} ${columns[dateIndex]?.trim()}, ${columns[yearIndex]?.trim()}`,
                    cast: columns[castIndex]?.trim()
                };
            }).filter(movie => movie.title); // Filter out invalid rows

            // Select a random movie
            const randomMovie = movies[Math.floor(Math.random() * movies.length)];

            // Set global variables for the game
            movieTitle = randomMovie.title;
            displayedTitle = "-".repeat(movieTitle.length);
            clue1 = `Release Date: ${randomMovie.releaseDate}`;
            clue2 = `Starring: ${randomMovie.cast}`;

            // Enable start button once movie is loaded
            document.getElementById('startButton').disabled = false;
        })
        .catch(error => console.error('Error loading movies:', error));
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

window.onload = function() {
    // Disable start button until movie is loaded
    document.getElementById('startButton').disabled = true;
    loadRandomMovie();
};

function updateDisplayedTitle(title) {
    return title.split('').map(char => {
        if (char === ' ') return ' '; // Always reveal spaces
        if (/[^a-zA-Z0-9]/.test(char)) return '-'; // Hide special characters
        return '-'; // Hide letters and numbers
    }).join('');
}


function startGame() {
    if (!movieTitle) {
        console.error('No movie title loaded');
        return;
    }
    document.getElementById('page1').style.display = 'none';
    document.getElementById('page2').style.display = 'block';
    document.getElementById('movieTitle').innerText = displayedTitle;
    document.getElementById('timer').innerText = `${timeLeft} Sec`;
    startTimer();
}

function startTimer() {
    timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            endGame(false);
        } else {
            timeLeft--;
            score -= 10;
            document.getElementById('timer').innerText = `${timeLeft} Sec`;
            document.getElementById('score').innerText = `${score} Pts`;
        }
    }, 1000);
}

function submitGuess() {
    const guess = document.getElementById('guessInput').value;
    document.getElementById('guessInput').value = '';

    // Single letter guess
    if (guess.length === 1) {
        let letterFound = false;
        let newDisplay = '';

        for (let i = 0; i < movieTitle.length; i++) {
            if (movieTitle[i] === ' ') {
                newDisplay += ' '; // Preserve spaces
            } else if (/[^a-zA-Z0-9]/.test(movieTitle[i])) {
                newDisplay += '-'; // Keep special characters hidden
            } else if (movieTitle[i].toLowerCase() === guess.toLowerCase()) {
                newDisplay += movieTitle[i]; // Reveal correct letter
                letterFound = true;
            } else {
                newDisplay += displayedTitle[i]; // Keep existing revealed letters or dashes
            }
        }

        if (letterFound) {
            displayedTitle = newDisplay;
            document.getElementById('movieTitle').innerText = displayedTitle;
            document.getElementById('feedback').innerText = '';

            // Check if all alphabetic characters are revealed
            const remainingDashes = displayedTitle.split('').filter(char => char === '-').length;
            const hiddenSpecials = movieTitle.split('').filter(char => /[^a-zA-Z0-9]/.test(char)).length;

            if (remainingDashes === 0) {
                endGame(true);
            }
        } else {
            document.getElementById('feedback').innerText = 'Letter not present';
        }
    } 
    // Full title guess
    else {
        if (guess.toLowerCase() === movieTitle.toLowerCase()) {
            displayedTitle = movieTitle; // Show the full title
            document.getElementById('movieTitle').innerText = displayedTitle;
            document.getElementById('feedback').innerText = '';
            endGame(true);
        } else {
            document.getElementById('feedback').innerText = 'Title is wrong';
        }
    }
}

function giveClue() {
    const clues = [clue1, clue2];
    const cluesElement = document.getElementById('clues');

    if (cluesGiven < clues.length) {
        // Add the next clue
        cluesElement.innerText += (cluesGiven === 0 ? '' : '\n') + clues[cluesGiven];
        cluesGiven++;
        score -= 100;
        document.getElementById('score').innerText = `${score} Pts`;
    } else {
        // Display "No more clues" in red
        if (!document.getElementById('noMoreClues')) {
            const noMoreCluesMessage = document.createElement('p');
            noMoreCluesMessage.id = 'noMoreClues';
            noMoreCluesMessage.style.color = 'red';
            noMoreCluesMessage.innerText = 'No more clues';
            cluesElement.appendChild(noMoreCluesMessage);
        } else {
            // Blink "No more clues" if it already exists
            const noMoreCluesMessage = document.getElementById('noMoreClues');
            noMoreCluesMessage.style.animation = 'blink 0.5s linear 2';
        }
    }
}

function endGame(success) {
    clearInterval(timer);
    const finalScore = score;

    if (success) {
        triggerConfetti();
        document.getElementById('page2').style.display = 'none';
        document.getElementById('congratulationsPage').style.display = 'flex';
        document.getElementById('finalScore').innerText = `Your Score: ${finalScore} Pts`
        document.getElementById('movieTitleDisplay').innerText = `The Movie Title was: ${movieTitle}`;

        // Remove any existing event listeners
        const form = document.getElementById('usernameForm');
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            if (username) {
                updateLeaderboard(username, finalScore);
            }
        });
    } else {
        document.getElementById('movieTitle').innerText = movieTitle;
        document.getElementById('feedback').innerText = `Time's up! The answer was ${movieTitle}`;
        setTimeout(() => {
            location.reload();
        }, 3000);
    }
}

function updateLeaderboard(username, score) {
    // Use the raw score number directly
    const newEntry = {
        username: username,
        score: score  // No parsing needed as we're using the original number
    };

    leaderboard.push(newEntry);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5);

    document.getElementById('congratulationsPage').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'flex';

    const leaderboardHTML = leaderboard
        .map((entry, index) => 
            `<div class="leaderboard-entry">
                ${index + 1}. ${entry.username}: ${entry.score} Pts
            </div>`
        ).join('');

    document.getElementById('leaderboardList').innerHTML = leaderboardHTML;
}

function triggerConfetti() {
    // Add confetti animation library implementation here
    console.log('Confetti!');
}

document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('submitGuess').addEventListener('click', submitGuess);
document.getElementById('clueButton').addEventListener('click', giveClue);
document.getElementById('guessInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitGuess();
});