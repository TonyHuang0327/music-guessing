# Music Guessing Game 🎶

A multiplayer music guessing game built with Node.js, Express, Socket.IO, and the Spotify Web API. The game plays music previews from Spotify playlists, and players try to guess the correct song from multiple options.

## Features
- Multiplayer rooms for competitive play
- Host-controlled game start and room management
- Language-specific playlists (Chinese, Korean, Japanese, English)
- Score-based leaderboard with ranking for correct answers
- Countdown and timed rounds

## Requirements
- Node.js and npm
- Spotify Developer account (for API keys)

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/TonyHuang0327/music-guessing.git
   cd music-guessing
   
2. **Install dependencies**
    ```bash
   npm install
    
3. **Set up Spotify API keys**
- Register your application on the Spotify Developer Dashboard.
- Obtain your clientId and clientSecret.
- Create a .env file in the project root and add your Spotify credentials:
   ```bash
   SPOTIFY_CLIENT_ID=your-client-id
   SPOTIFY_CLIENT_SECRET=your-client-secret
   
5. **Start the server**
   ```bash
   npm start
The server will run on http://localhost:3001 by default.

## Environment Variables
- SPOTIFY_CLIENT_ID - Your Spotify API client ID
- SPOTIFY_CLIENT_SECRET - Your Spotify API client secret
- PORT - The port the server runs on (default: 3001)

## Game Rules
1. Players join a room and wait for the host to start the game.
2. The game plays a short music preview.
3. Players have limited time to select the correct song from four options.
4. Points are awarded based on speed and accuracy.
5. The game continues for 10 rounds.

## Contributing
Feel free to fork this repository and submit pull requests. Contributions are welcome!

##License
   ```bash
   This `README.md` is now ready to be added to your GitHub repository. Let me know if you want any further customization!
