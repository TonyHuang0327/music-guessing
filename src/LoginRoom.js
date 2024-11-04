import React, { useState } from 'react';
import { socket } from './socket';
import ActiveRooms from './ActiveRooms';

function LoginRoom({ onStartGame, onJoinRoom }) {
  const [nickname, setNickname] = useState('');
  const [room, setRoom] = useState('');
  const [showActiveRooms, setShowActiveRooms] = useState(false);
  const backgroundStyle = {
    backgroundImage:("url('background.jpg')"),
    backgroundSize: "cover",
    backgroundPosition: "center",
  }

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

  const practiceMode = () => {
    setNickname('practice');
    setRoom('practice');
    onStartGame('practice', 'practice');
  }

  const handleJoinRoomClick = () => {
    setShowActiveRooms(true); // 顯示房間列表
  };

  const closeRoomList = () => {
    setShowActiveRooms(false); // 關閉
  };

  return (
    <div style={backgroundStyle}>
      <h2>M-uziq</h2>
      <h3> A music quizzing game</h3>
      <div className='inputBox-div'>
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
      </div>
      <div className='buttonDiv'>
        <button onClick={handleStart}>創建房間</button>
        <button onClick={practiceMode}>練習模式</button>
        <button onClick={handleJoinRoomClick}>加入房間</button>

        {showActiveRooms && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeRoomList}>&times;</span>
            <ActiveRooms onJoinRoom={onJoinRoom} />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
export { LoginRoom as default, LoginRoom };