import React, { useState } from 'react';
import GameBoard from './GameBoard';
import ResultBoard from './ResultBoard';
import { socket } from './socket';
import LoginRoom from './LoginRoom';
import ActiveRooms from './ActiveRooms';

function App() {
  const [gameState, setGameState] = useState('login');
  const [nickname, setNickname] = useState('');
  const [room, setRoom] = useState('');
  const [scores, setScores] = useState({});

  const handleStartGame = (name, roomName) => {
    setNickname(name);
    setRoom(roomName);
    socket.emit('joinRoom', { room: roomName, nickname: name });
    setGameState('game');
  };

  const handleEndGame = () => {
    socket.emit('endGame', room);
    setGameState('result');
  };  

  const handlePlayAgain = () => {
    setGameState('login');
    setNickname('');
    setRoom('');
    setScores({});
  };

  return (
    <div className="app-container">
      {gameState === 'login' && (
        <div className="login-container">
          <LoginRoom onStartGame={handleStartGame} onJoinRoom={handleStartGame} />
        </div>
      )}
      {gameState === 'game' && (
        <GameBoard
          nickname={nickname}
          room={room}
          onEndGame={handleEndGame}
        />
      )}
      {gameState === 'result' && (
        <ResultBoard 
          scores={scores} 
          onPlayAgain={handlePlayAgain} 
        />
      )}
    </div>
  );
}

export default App;