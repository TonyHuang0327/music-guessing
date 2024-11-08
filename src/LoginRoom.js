import React, { useState } from 'react';
import { socket } from './socket';
import ActiveRooms from './ActiveRooms';

function LoginRoom({ onStartGame, onJoinRoom }) {
  const [nickname, setNickname] = useState('');
  const [room, setRoom] = useState('');
  const [showActiveRooms, setShowActiveRooms] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);  
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [roomLanguage,setRoomLanguage] = useState(null);
  const backgroundStyle = {
    backgroundImage:("url('background.jpg')"),
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "100vh",
  }

  const handleOpenCreateRoom = () => {
    setShowCreateRoomModal(true); // 打開創建房間的彈窗
  };

  const closeCreateRoomModal = () => {
    setShowCreateRoomModal(false); // 關閉創建房間彈窗
  };

  const handleCreateRoom = () => {
    if (nickname && room && roomLanguage) {
      socket.emit('checkRoomExists', room, (exists) => {
        if (exists) {
          alert('房間名稱已經存在，請選擇其他房間名稱');
        } else {
          onStartGame(nickname, room, roomLanguage);
          setShowCreateRoomModal(false); // 關閉彈窗
        }
      });
    } else {
      alert('請輸入暱稱、房間名稱並選擇題庫');
    }
  };

  const practiceMode = () => {
    setShowPracticeModal(true);
  }

  const handleJoinRoomClick = () => {
    setShowActiveRooms(true); // 顯示房間列表
  };

  const closeRoomList = () => {
    setShowActiveRooms(false); // 關閉
  };

  const handlePracticeModeStart = () => {
    if (roomLanguage) {
      setNickname('practice');
      setRoom('practice');
      onStartGame('practice', 'practice', roomLanguage);
      setShowPracticeModal(false); // 關閉彈窗
    } else {
      alert('請選擇題庫');
    }
  };

  const closePracticeModal = () => {
    setShowPracticeModal(false); // 關閉練習模式彈窗
  };

  return (
    <div style={backgroundStyle}>
      <h2>M-uziq</h2>
      <h3> A music quizzing game</h3>
      <div className='buttonDiv'>
        <button onClick={handleOpenCreateRoom}>創建房間</button>
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
       {showCreateRoomModal && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={closeCreateRoomModal}>&times;</span>
              <h3>創建新房間</h3>
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
              <select value={roomLanguage} onChange={(e) => setRoomLanguage(e.target.value)}>
                <option value= "">選擇題庫語言</option>
                <option value="ch">中文</option>
                <option value="kp">KPOP</option>
                <option value="jp">JPOP</option>
                <option value="en">英文</option>
            </select>
              <button onClick={handleCreateRoom}>確認創建</button>
            </div>
          </div>
        )}
        {showPracticeModal && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={closePracticeModal}>&times;</span>
              <h3>選擇題庫語言</h3>
              <select value={roomLanguage} onChange={(e) => setRoomLanguage(e.target.value)}>
                <option value="">選擇題庫語言</option>
                <option value="ch">中文</option>
                <option value="kp">KPOP</option>
                <option value="jp">JPOP</option>
                <option value="en">英文</option>
              </select>
              <button onClick={handlePracticeModeStart}>開始練習</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export { LoginRoom as default, LoginRoom };