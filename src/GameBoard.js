import React, { useState, useEffect } from 'react';
import { socket } from './socket';

function GameBoard({ nickname, room, onEndGame, roomLanguage }) {
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
    const [isHost, setIsHost] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    
    const buttonColors = ['#00ff2f', '#ff2f00', '#2f00ff', '#ff00ff'];
    
    // 背景影片樣式
    const videoBackgroundStyle = {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "100vw",
        height: "100vh",
        transform: "translate(-50%, -50%)",
        objectFit: "cover",
        zIndex: -1,
        display: isVideoLoaded ? 'block' : 'none',
    };

    // 遊戲開始按鈕處理
    const handleStartGame = () => {
        socket.emit('startGame', room,roomLanguage);
    };

    // 監聽 Socket 事件
    useEffect(() => {
        let isSubscribed = true;

        // 更新分數事件
        socket.on('updateScore', (scoreData) => {
            if (!isSubscribed) return;
            setScores(prevScores => ({ ...prevScores, [scoreData.player]: scoreData.score }));
        });

        // 設置主機狀態
        socket.on('setHost', (isHost) => setIsHost(isHost));

        // 新玩家加入房間事件
        socket.on('playerJoined', (data) => setIsHost(nickname === data.host));

        // 播放歌曲事件
        const handlePlaySong = (songData) => {
            if (!isSubscribed) return;
            setCurrentRound(prev => {
                const newRound = prev + 1;
                if (newRound > 10) {
                    onEndGame(scores); 
                }
                return newRound;
            });
            if (audioInstance) audioInstance.pause();
            const newAudio = new Audio(songData.url);
            setAudioInstance(newAudio);
            setCurrentSong(songData);
            setOptions(songData.options);
            setIsPlaying(true);
            newAudio.play().catch((error) => setIsPlaying(false));
            newAudio.addEventListener('ended', () => setIsPlaying(false));
        };

        // 停止歌曲事件
        const handleStopSong = () => {
            if (audioInstance) {
                audioInstance.pause();
                setAudioInstance(null);
                setCurrentSong(null);
                setOptions([]);
                setIsPlaying(false);
            }
        };

        // 回合結束事件
        const handleRoundEnded = () => {
            if (audioInstance) audioInstance.pause();
            setAudioInstance(null);
        };

        socket.on('playSong', handlePlaySong);
        socket.on('stopSong', handleStopSong);
        socket.on('roundEnded', handleRoundEnded);

        // 更新玩家列表事件
        socket.on('updatePlayerList', (playerList) => {
            if (!isSubscribed) return;
            setPlayers(playerList);
            setScores(prevScores => playerList.reduce((newScores, player) => ({ ...newScores, [player]: prevScores[player] || 0 }), {}));
        });

        // 遊戲開始事件
        socket.on('gameStarted', () => {
            if (!isSubscribed) return;
            setGameStarted(true);
            setCurrentRound(0);
            setScores(players.reduce((initialScores, player) => ({ ...initialScores, [player]: 0 }), {}));
        });

        // 倒數計時事件
        socket.on('countdown', (time) => {
            if (!isSubscribed) return;
            setCountdown(time === 0 ? null : time);
        });

        // 清理事件監聽器
        return () => {
            isSubscribed = false;
            socket.off('playSong', handlePlaySong);
            socket.off('stopSong', handleStopSong);
            socket.off('roundEnded', handleRoundEnded);
            socket.off('updateScore');
            socket.off('updatePlayerList');
            socket.off('gameStarted');
            socket.off('countdown');
            if (audioInstance) {
                audioInstance.pause();
                setAudioInstance(null);
            }
        };
    }, [audioInstance, nickname, room, players, roomLanguage, onEndGame, scores]);

    // 音樂播放錯誤處理
    useEffect(() => {
        if (audioInstance) {
            const handleAudioError = () => setIsPlaying(false);
            audioInstance.addEventListener('error', handleAudioError);
            return () => audioInstance.removeEventListener('error', handleAudioError);
        }
    }, [audioInstance]);

    // 選項點擊處理
    const handleOptionClick = (option) => {
        socket.emit('submitAnswer', { room, selectedOption: option, player: nickname });
        setIsProcessingSong(true);
        setTimeout(() => setIsProcessingSong(false), 1000);
    };

    return (
        <div>
            <video style={videoBackgroundStyle} autoPlay loop muted onLoadedData={() => setIsVideoLoaded(true)}>
                <source src={"ingame-background.mp4"} type='video/mp4' />
            </video>
            <div className='gameContainer'>
                <div className='gamingArea'>
                    {countdown && <div className="fullscreen-countdown">{countdown}</div>}
                    
                    {!gameStarted && players.length > 1 && (
                        isHost ? (
                            <button className="startGameBtn" onClick={handleStartGame}>開始遊戲</button>
                        ) : (
                            <button disabled>等待房主開始遊戲...</button>
                        )
                    )}

                    {!gameStarted && players.includes("practice") && (
                        <button onClick={handleStartGame}>開始遊戲</button>
                    )}

                    {!gameStarted && (
                        <div className='rule'>
                            <h3>遊戲規則 : </h3>
                            <ul>
                                <li>1. 每位玩家需在最短時間內猜出正確的歌曲名稱。</li>
                                <li>2. 第一位猜中加30分，第二位加20分，第三位加10分。</li>
                                <li>3. 總共10回合，每回合會隨機播放一段音樂片段。</li>
                                <li>4. 玩家在每回合中僅有一次猜測機會，答錯或超時不加分。</li>
                                <li>5. 最終分數最高的玩家將成為贏家！</li>
                            </ul>
                        </div>
                    )}
                    {options.length > 0 && (
                    <div>
                        <h3 style={{ textAlign: 'center',color:'black'}}>選擇一個正確答案</h3>
                        <div className='button-container'>
                            {options.map((option, index) => (
                                <button
                                    className='optionButton'
                                    key={index}
                                    onClick={() => handleOptionClick(option)}
                                    style={{ backgroundColor: buttonColors[index % buttonColors.length] }}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                </div>

                <div className='div-line'></div>

                <div className='leaderBoard'>
                    <h2>{room}</h2>
                    <p>回合數:{currentRound}/10</p>
                    <h3>排行榜</h3>
                    <ul>
                        {Object.entries(scores)
                            .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                            .map(([player, score], index) => (
                                <li key={player} className="leaderboard-item">
                                    {index + 1}. {player}: {score} 分
                                    {index === 0 && <img src='crown.png' alt='icon-top' />}
                                </li>
                            ))}
                    </ul>
                    <h3>房間成員</h3>
                    <ul>
                        {players.map((player, index) => (
                            <li key={index}>{player}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default GameBoard;
