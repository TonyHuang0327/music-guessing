const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');

const app = express();

app.use(express.static('music-database'));

app.use(cors({
    origin: "https://music-guessing.vercel.app/",
    methods: ["GET", "POST"],
    credentials: true
}));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://music-guessing.vercel.app/",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Spotify API 設置
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

const playlists = {
  ch:'16jltto6nfMRPONB8hzKQ4',//中文
  kp:'37i9dQZF1EIVNsGbEqyF9o',//kpop
  jp:'37i9dQZF1DXdbRLJPSmnyq',//jpop
  en:'37i9dQZF1DX5Ejj0EkURtP',//英文
};

// 取得 Spotify token
spotifyApi.clientCredentialsGrant().then(
  function(data) {
    console.log('Spotify access token 獲取成功：' + data.body['access_token']);
    spotifyApi.setAccessToken(data.body['access_token']);
  },
  function(err) {
    console.log('獲取 Spotify access token 出錯', err);
  }
);

const rooms = new Map();
const activeRooms = new Set();

// 修改 stopCurrentSong 函數，確保徹底停止當前歌曲並清理狀態
function stopCurrentSong(room) {
  const roomData = rooms.get(room);
  if (roomData) {
    // 清除計時器
    if (roomData.timer) {
      clearTimeout(roomData.timer);
      roomData.timer = null;
    }
    
    // 發送停止信號給客戶端
    io.to(room).emit('stopSong');
    
    // 清除當前歌曲資訊
    roomData.currentSong = null;
  }
}

io.on('connection', (socket) => {
  console.log('New player connected');

  socket.on('joinRoom', ({ room, nickname }) => {
    console.log(`Player ${nickname} is trying to join room ${room}`);
    
    socket.join(room);
    // 判斷房間是否已存在
  if (!rooms.has(room)) {
    console.log(`Room ${room} does not exist. Creating new room and setting host.`);
    rooms.set(room, { players: new Map(), currentSong: null, timer: null, submittedAnswers: [], gameStarted: false, host: socket.id,roomLanguage: null });
    activeRooms.add(room);
    io.to(socket.id).emit('setHost', true); // 通知該玩家是房主
    console.log(`Player ${nickname} is joining as a host.`);
  } else {
    console.log(`Room ${room} already exists. Player ${nickname} joining as a participant.`);
    io.to(socket.id).emit('setHost', false); // 不是房主
  }
  
    // 新玩家加入房間
    rooms.get(room).players.set(socket.id, { nickname, score: 0 });
  
    const playerList = Array.from(rooms.get(room).players.values()).map(p => p.nickname);
    io.to(room).emit('updatePlayerList', playerList);
    io.to(room).emit('userJoined', `${nickname}已加入房間`);
  });
  

  socket.on('startGame', (room,roomLanguage) => {
    const roomData = rooms.get(room);
    if (roomData && !roomData.gameStarted) {
      roomData.roomLanguage = roomLanguage;
      roomData.gameStarted = true;
      startCountdown(room,roomLanguage);
    }
  });

  // 倒數計時功能
  function startCountdown(room) {
    let countdownTime = 3;
    const countdownInterval = setInterval(() => {
      io.to(room).emit('countdown', countdownTime);
      countdownTime -= 1;

      if (countdownTime < 0) {
        clearInterval(countdownInterval);
        stopCurrentSong(room);
        io.to(room).emit('gameStarted');
        startNewRound(room);
      }
    }, 1000); // 每秒更新倒數
  }

  socket.on('getActiveRooms', () => {
    socket.emit('activeRooms', Array.from(activeRooms));
  });

  socket.on('submitAnswer', ({ room, selectedOption, player}) => {
    const roomData = rooms.get(room);
    if (roomData && roomData.currentSong) {
        const isCorrect = roomData.currentSong.correctAnswer === selectedOption;
        const playerData = Array.from(roomData.players.values()).find(p => p.nickname === player);
        
        // 確保找到玩家數據
        if (!playerData) {
            console.log(`Player ${player} not found in room ${room}`);
            return;
        }
        
        // 確保每個玩家只能提交一次答案
        if (!roomData.submittedAnswers.find(answer => answer.player === player)) {
            roomData.submittedAnswers.push({ player, isCorrect });
            
            console.log(`Player ${player} submitted answer. Correct: ${isCorrect}`);
            
            // 如果答案正確，根據提交順序給予不同分數
            if (isCorrect) {
                const correctAnswers = roomData.submittedAnswers.filter(a => a.isCorrect);
                const correctRank = correctAnswers.length;
                const score = correctRank === 1 ? 30 : (correctRank === 2 ? 20 : 10);
                
                // 更新玩家分數
                playerData.score += score;
                console.log(`Player ${player} score updated to ${playerData.score}`);
                
                // 發送更新後的分數給所有客戶端
                io.to(room).emit('updateScore', {
                    player: player,
                    score: playerData.score
                });
            }
            
            // 檢查是否所有玩家都已提交答案
            if (roomData.submittedAnswers.length === roomData.players.size) {
                stopCurrentSong(room);
                setTimeout(() => {
                    startNewRound(room);
                }, 1000);
            }
        }
    }
});

  socket.on('endGame', (room) => {
    const roomData = rooms.get(room);
    if (roomData) {
      const finalScores = Array.from(roomData.players.values()).map(({ nickname, score }) => ({ nickname, score }));
      io.to(room).emit('gameEnded', finalScores);
      
      // 清理房間數據
      rooms.delete(room);
      activeRooms.delete(room);
    }
  });  

  socket.on('checkRoomExists', (room, callback) => {
    callback(rooms.has(room));
  });
  

  socket.on('disconnect', () => {
    for (const [room, data] of rooms.entries()) {
      if (data.players.has(socket.id)) {
        const playerData = data.players.get(socket.id);
        playerData.disconnected = true;
  
        setTimeout(() => {
          // 如果該玩家沒有在一段時間內重新連接，則從房間中移除
          if (playerData.disconnected) {
            data.players.delete(socket.id);
            const playerList = Array.from(data.players.values()).map(p => p.nickname);
            io.to(room).emit('updatePlayerList', playerList);
  
            if (data.players.size === 0) {
              stopCurrentSong(room);
              rooms.delete(room);
              activeRooms.delete(room);
            }
          }
        }, 10000); // 給予玩家 10 秒重新連接的時間
      }
    }
  });
  
  socket.on('reconnectPlayer', ({ room, nickname }) => {
    const roomData = rooms.get(room);
    if (roomData) {
      const player = Array.from(roomData.players.values()).find(p => p.nickname === nickname);
      if (player) {
        player.disconnected = false;
        socket.join(room);
        const playerList = Array.from(roomData.players.values()).map(p => p.nickname);
        io.to(room).emit('updatePlayerList', playerList);
      }
    }
  });
})  

// 修改 startNewRound 函數，確保在開始新回合前停止當前歌曲
function startNewRound(room) {
  const roomData = rooms.get(room);
  const playlistId = playlists[roomData.roomLanguage];
  if (roomData) {
    // 確保先停止當前歌曲
    stopCurrentSong(room);
    
    // 等待一小段時間再開始新回合，確保音樂完全停止
    setTimeout(() => {
      // 重置提交答案列表
      roomData.submittedAnswers = [];

      spotifyApi.getPlaylistTracks(playlistId)
        .then(data => {
          const tracks = data.body.items
            .filter(item => item.track)
            .map(item => ({
              title: item.track.name,
              artist: item.track.artists.map(artist => artist.name).join(', '),
              url: item.track.preview_url
            }))
            .filter(track => track.url !== null);

          if (tracks.length > 0) {
            const randomSong = tracks[Math.floor(Math.random() * tracks.length)];
            
            // 設置新的當前歌曲
            roomData.currentSong = {
              ...randomSong,
              correctAnswer: randomSong.title
            };
            
            generateOptions(randomSong, room);
            console.log(`Selected song: ${randomSong.title}`);

            // 設置回合計時器
            roomData.timer = setTimeout(() => {
              io.to(room).emit('roundEnded', roomData.currentSong);
              // 確保先停止當前歌曲再開始下一回合
              startNewRound(room);
            }, 10000); // 10 seconds per round
          }
        })
        .catch(err => {
          console.log('Error fetching Spotify tracks:', err);
        });
    }, 1000); // 等待1秒確保音樂完全停止
  }
}


function generateOptions(correctSong, room) {
  const options = [correctSong.title]; // 包含正確答案
  const roomData = rooms.get(room);
  if (!roomData || !roomData.roomLanguage) {
    console.log('Missing room data or language for generating options');
    return;
  }
  const playlistId = playlists[roomData.roomLanguage];

  // 獲取歌曲的其他選項
  spotifyApi.getPlaylistTracks(playlistId) // 使用你的播放列表 ID
    .then(data => {
      const tracks = data.body.items
        .filter(item => item.track)
        .map(item => item.track.name); // 只獲取歌曲標題

      console.log('Available tracks:', tracks); // 日誌輸出可用的歌曲

      // 從播放列表中隨機選擇錯誤答案
      while (options.length < 4) {
        const randomOption = tracks[Math.floor(Math.random() * tracks.length)];
        if (!options.includes(randomOption)) {
          options.push(randomOption);
        }
      }
      // 隨機打亂選項順序
      const shuffledOptions = shuffleArray(options);
      roomData.currentSong.options = shuffledOptions; // 將隨機選項賦值給當前歌曲
      console.log('Generated options:', shuffledOptions); // 日誌輸出生成的選項
      io.to(room).emit('playSong', { title: correctSong.title, url: correctSong.url, options: shuffledOptions });
    })
    .catch(err => {
      console.log('Error fetching Spotify tracks:', err);
    });

    console.log(`Now playing: ${correctSong.title}, URL: ${correctSong.url}`);
}

function shuffleArray(array) {
  // 打亂數組的通用函數
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});