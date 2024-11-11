import React, { useState } from 'react';
import GameBoard from './GameBoard';
import ResultBoard from './ResultBoard';
import { socket } from './socket';
import LoginRoom from './LoginRoom';

function App() {
  const [gameState, setGameState] = useState('login');
  const [nickname, setNickname] = useState('');
  const [room, setRoom] = useState('');
  const [roomLanguage, setRoomLanguage] = useState(''); // 新增 roomLanguage 狀態
  const [scores, setScores] = useState({});

  const handleStartGame = (name, roomName, selectedLanguage, isPractice = false) => {
    setNickname(name);
    setRoom(roomName);
    setRoomLanguage(selectedLanguage);
    
    if (!isPractice) {
        // 只有在非練習模式時才發送 joinRoom 事件
        socket.emit('joinRoom', { room: roomName, nickname: name });
    }
    
    setGameState('game');
};

  // 新增 handleJoinRoom 函數
  const handleJoinRoom = (name, roomName) => {
    setNickname(name);
    setRoom(roomName);
    setGameState('game');
  };

  const handleEndGame = (finalScores) => {
    setScores(finalScores);  // 將分數存到 scores 狀態
    socket.emit('endGame', { room, finalScores });
    setGameState('result');
};

  const handlePlayAgain = () => {
    setGameState('login');
    setNickname('');
    setRoom('');
    setRoomLanguage(''); // 重置 roomLanguage
    setScores({});
  };

  return (
    <div className="app-container">
      {gameState === 'login' && (
        <div className="login-container">
          <LoginRoom onStartGame={handleStartGame} onJoinRoom={handleJoinRoom} />
        </div>
      )}
      {gameState === 'game' && (
        <GameBoard
          nickname={nickname}
          room={room}
          roomLanguage={roomLanguage} // 傳遞 roomLanguage 給 GameBoard
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
