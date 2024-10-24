import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  withCredentials: true,
  transports: ['websocket']
});

function LoginRoom({ onStartGame }) {
  const [nickname, setNickname] = useState('');
  const [room, setRoom] = useState('');

  const handleStart = () => {
    if (nickname && room) {
      socket.emit('checkRoomExists', room, (exists) => {
        if (exists) {
          alert('房間名稱已經存在，請選擇其他房間名稱');
        } else {
          onStartGame(nickname, room);
        }
      });
    } else {
      alert('請輸入暱稱和房間名稱');
    }
  };  

  return (
    <div>
      <h2>之後放logo</h2>
      <input
        type="text"
        placeholder="暱稱"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <input
        type="text"
        placeholder="房間名稱"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />
      <button onClick={handleStart}>創建房間</button>
      <button onClick={ActiveRooms}>加入房間</button>
    </div>
  );
}

function GameBoard({ nickname, room, onEndGame }) {
  const [currentSong, setCurrentSong] = useState(null);
  const [scores, setScores] = useState({});
  const [players, setPlayers] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [options, setOptions] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [audioInstance, setAudioInstance] = useState(null);
  const [isProcessingSong, setIsProcessingSong] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [isHost, setIsHost] = useState(false); // 記錄是否為房主

  // 開始遊戲按鈕
  const handleStartGame = () => {
    socket.emit('startGame', room);
  };

  // 清理音頻函數
  const cleanupAudio = () => {
    console.log('Cleaning up audio...');
    if (audioInstance) {
      console.log('Pausing audio...');
      audioInstance.pause(); // 暫停播放
      audioInstance.currentTime = 0; // 重置播放時間
      console.log('Audio paused. Current time reset.');
      
      audioInstance.src = ''; // 移除音頻源
      console.log('Audio source removed.');

      audioInstance.remove(); // 移除音頻元素（如果適用）
      console.log('Audio element removed.');

      setAudioInstance(null);
      console.log('Audio instance reset.');
    }
    setIsPlaying(false);
    setIsProcessingSong(false);
    console.log('Audio cleanup completed.');
  };

  useEffect(() => {
    let isSubscribed = true; // 用於防止在組件卸載後設置狀態

    socket.on('playerJoined', (data) => {
      const { host } = data; 
      setIsHost(nickname === host); // 如果當前玩家是房主，設置 isHost 為 true
    })

    const handlePlaySong = (songData) => {
      if (!isSubscribed) return;
      if (isProcessingSong) {
        console.log('Already processing a song, ignoring new song data');
        return;
      }

      console.log(`Processing new song: ${songData.title} for round ${currentRound + 1}`);
      setIsProcessingSong(true);
      setCurrentRound(prev => prev + 1);

      // 清理之前的音頻
      cleanupAudio();

      // 設置新的歌曲數據
      setCurrentSong(songData);
      setOptions(songData.options);

      // 創建新的音頻實例
      const newAudio = new Audio();
      
      const handleCanPlay = () => {
        if (!isSubscribed) return;
        console.log(`Starting playback for: ${songData.title}`);
        newAudio.play().catch((error) => {
          console.log('Play error:', error);
        });
        setIsPlaying(true);
        setIsProcessingSong(false);
      };

      const handleEnded = () => {
        if (!isSubscribed) return;
        console.log(`Playback ended for: ${songData.title}`);
        setIsPlaying(false);
      };

      const handleError = (error) => {
        console.log(`Audio error for ${songData.title}:`, error);
        setIsProcessingSong(false);
      };

      newAudio.addEventListener('canplay', handleCanPlay);
      newAudio.addEventListener('ended', handleEnded);
      newAudio.addEventListener('error', handleError);

      // 設置音頻源
      newAudio.src = songData.url;
      setAudioInstance(newAudio);
    };

    const handleStopSong = () => {
      console.log('Stop song event received');
      cleanupAudio();
      setCurrentSong(null);
      setOptions([]);
    };

    const handleRoundEnded = () => {
      console.log('Round ended event received');
      cleanupAudio();
    };

    // 設置事件監聽
    socket.on('playSong', handlePlaySong);
    socket.on('stopSong', handleStopSong);
    socket.on('roundEnded', handleRoundEnded);

    // 其他事件監聽保持不變...
    socket.on('updateScore', (scoreData) => {
      if (!isSubscribed) return;
      setScores((prevScores) => ({
        ...prevScores,
        [scoreData.player]: scoreData.score,
      }));
    });

    socket.on('updatePlayerList', (playerList) => {
      if (!isSubscribed) return;
      setPlayers(playerList);
    });

    socket.on('gameStarted', () => {
      if (!isSubscribed) return;
      setGameStarted(true);
      setCurrentRound(0); // 重置回合計數
    });

    socket.on('countdown', (time) => {
      if (!isSubscribed) return;
      setCountdown(time);
      if (time === 0) {
        setCountdown(null);
      }
    });

    // 清理函數
    return () => {
      isSubscribed = false;
      socket.off('playSong');
      socket.off('stopSong');
      socket.off('roundEnded');
      socket.off('updateScore');
      socket.off('updatePlayerList');
      socket.off('gameStarted');
      socket.off('countdown');
      cleanupAudio();
    };
  }, []); // 移除所有依賴

  // 處理選項點擊事件
  const handleOptionClick = (option) => {
    if (!isProcessingSong) {
      socket.emit('submitAnswer', { room, selectedOption: option, player: nickname });
    }
  };

  // 處理播放/暫停
  const handlePlayPause = () => {
    if (audioInstance && !isProcessingSong) {
      if (isPlaying) {
        audioInstance.pause();
      } else {
        audioInstance.play().catch((error) => {
          console.log('Play/Pause error:', error);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div>
      <h2>遊戲房間: {room}</h2>
      <p>玩家暱稱: {nickname}</p>
      <p>當前回合: {currentRound} / 10</p>
      <p>當前分數: {scores[nickname] || 0}</p>
      {countdown && <p>遊戲開始倒數: {countdown} 秒</p>}
      {!gameStarted && players.length > 1 && (
          <button onClick={handleStartGame}>開始遊戲</button>
      )}
      {currentSong && (
        <div>
          <p>正在播放: {currentSong.title}</p>
          <button onClick={handlePlayPause} disabled={isProcessingSong}>
            {isPlaying ? '暫停' : '播放'}
          </button>
        </div>
      )}
      {options.length > 0 && (
        <div>
          <h3>選擇答案</h3>
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionClick(option)}
              disabled={isProcessingSong}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      <button onClick={onEndGame}>結束遊戲</button>
      <div>
        <h3>分數</h3>
        {Object.entries(scores).map(([player, score]) => (
          <p key={player}>{player}: {score}</p>
        ))}
      </div>
      <div>
        <h3>房間成員</h3>
        <ul>
          {players.map((player, index) => (
            <li key={index}>{player}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ResultBoard({ scores, onPlayAgain }) {
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h2>遊戲結束</h2>
      <h3>最終排行榜</h3>
      {sortedScores.map(([player, score], index) => (
        <p key={player}>{index + 1}. {player}: {score}</p>
      ))}
      <button onClick={onPlayAgain}>再玩一次</button>
    </div>
  );
}

function ActiveRooms({ onJoinRoom }) {
  const [activeRooms, setActiveRooms] = useState([]);

  useEffect(() => {
    socket.on('activeRooms', (rooms) => {
      setActiveRooms(rooms);
    });

    socket.emit('getActiveRooms');

    return () => {
      socket.off('activeRooms');
    };
  }, []);

  const handleJoinRoom = (roomName) => {
    const confirmed = window.confirm(`確定加入 ${roomName} ?`);
    if (confirmed) {
      const nickname = prompt("請輸入你的暱稱：");
      if (nickname) {
        socket.emit('joinRoom', { room: roomName, nickname });
        onJoinRoom(nickname, roomName);
      }
    }
  };

  return (
    <div>
      <ul>
        {activeRooms.map((room, index) => (
          <li key={index} onClick={() => handleJoinRoom(room)} style={{ cursor: 'pointer' }}>
            {room}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
    <div>
      {gameState === 'login' && (
        <>
          <ActiveRooms onJoinRoom={handleStartGame} />
          <LoginRoom onStartGame={handleStartGame} />
        </>
      )}
      {gameState === 'game' && (
        <GameBoard
          nickname={nickname}
          room={room}
          onEndGame={handleEndGame}
        />
      )}
      {gameState === 'result' && (
        <ResultBoard scores={scores} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
