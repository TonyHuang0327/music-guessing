import React, { useState, useEffect } from 'react';
import { socket } from './socket';

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
      <p>目前可加入的房間:</p>
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

export { ActiveRooms as default, ActiveRooms };
