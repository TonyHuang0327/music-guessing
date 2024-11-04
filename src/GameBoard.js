    import React, { useState, useEffect } from 'react';
    import { socket } from './socket';

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
        const [isHost, setIsHost] = useState(false);
        const buttonColors = ['#00ff2f', '#ff2f00', '#2f00ff', '#ff00ff'];
        const videoBackgroundStyle = {
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "100vw",
            height: "100vh",
            transform: "translate(-50%, -50%)",
            objectFit: "cover",
            zIndex: -1,
        };

        const handleStartGame = () => {
            socket.emit('startGame', room);
        };

        useEffect(() => {
            let isSubscribed = true;

            socket.on('updateScore', (scoreData) => {
                if (!isSubscribed) return;
                console.log('Received score update:', scoreData);

                setIsProcessingSong(false);
                
                setScores(prevScores => {
                    const newScores = {
                        ...prevScores,
                        [scoreData.player]: scoreData.score
                    };
                    console.log('Updated scores:', newScores);
                    return newScores;
                });
            });

            socket.on('setHost', (isHost) => {
                setIsHost(isHost);
                console.log(`Host status set to: ${isHost}`);
            });

            socket.on('playerJoined', (data) => {
                const { host } = data;
                setIsHost(nickname === host);
            });

            const handlePlaySong = (songData) => {
                if (!isSubscribed) return;

                setIsProcessingSong(true);
                setCurrentRound(prev => prev + 1);

                if (audioInstance) {
                    audioInstance.pause();
                    audioInstance.src = '';
                }

                const newAudio = new Audio(songData.url);
                setAudioInstance(newAudio);
                setCurrentSong(songData);
                setOptions(songData.options);
                setIsPlaying(true);

                newAudio.play().catch((error) => {
                    console.log('Play error:', error);
                    setIsProcessingSong(false);
                });

                newAudio.addEventListener('ended', () => {
                    console.log(`Playback ended for: ${songData.title}`);
                    setIsPlaying(false);
                    setIsProcessingSong(false);
                });
            };

            const handleStopSong = () => {
                if (audioInstance) {
                    audioInstance.pause();
                    audioInstance.src = '';
                    setIsProcessingSong(false);
                    setAudioInstance(null);
                    setCurrentSong(null);
                    setOptions([]);
                    setIsPlaying(false);
                }
            };

            const handleRoundEnded = () => {
                if (audioInstance) {
                    audioInstance.pause();
                    setAudioInstance(null);
                }
            };

            socket.on('playSong', handlePlaySong);
            socket.on('stopSong', handleStopSong);
            socket.on('roundEnded', handleRoundEnded);

            socket.on('updateScore', (scoreData) => {
                if (!isSubscribed) return;
                console.log('Received score update:', scoreData); // 添加日誌
                setScores((prevScores) => {
                    const newScores = {
                        ...prevScores,
                        [scoreData.player]: scoreData.score,
                    };
                    console.log('Updated scores:', newScores); // 添加日誌
                    return newScores;
                });
            });

            socket.on('updatePlayerList', (playerList) => {
                if (!isSubscribed) return;
                console.log('Updated player list:', playerList); // 添加日誌
                setPlayers(playerList);
                
                // 確保每個玩家都有初始分數
                setScores(prevScores => {
                    const newScores = { ...prevScores };
                    playerList.forEach(player => {
                        if (!(player in newScores)) {
                            newScores[player] = 0;
                        }
                    });
                    return newScores;
                });
            });

            socket.on('gameStarted', () => {
                if (!isSubscribed) return;
                setGameStarted(true);
                setCurrentRound(0);
                
                // 遊戲開始時初始化所有玩家分數為0
                const initialScores = {};
                players.forEach(player => {
                    initialScores[player] = 0;
                });
                setScores(initialScores);
            });

            socket.on('countdown', (time) => {
                if (!isSubscribed) return;
                setCountdown(time);
                if (time === 0) setCountdown(null);
            });

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
        }, [audioInstance, nickname, room, players]);

        useEffect(() => {
            if (audioInstance) {
                const handleAudioError = () => {
                    console.log('Audio error occurred');
                    setIsPlaying(false);
                    setAudioInstance(null);
                };

                audioInstance.addEventListener('error', handleAudioError);
                return () => {
                    audioInstance.removeEventListener('error', handleAudioError);
                };
            }
        }, [audioInstance]);

        const handleOptionClick = (option) => {
            console.log('Option clicked:', option);
            console.log('isProcessingSong:', isProcessingSong);
            console.log('Current player:', nickname);
            
            // 移除 isProcessingSong 檢查，或確保它在適當的時機被重置
            socket.emit('submitAnswer', { 
                room, 
                selectedOption: option, 
                player: nickname 
            });
            console.log(`${nickname} 選擇了 ${option}`);
            
            // 可以設置一個短暫的處理狀態來防止重複點擊
            setIsProcessingSong(true);
            setTimeout(() => setIsProcessingSong(false), 1000);
        };

        // 添加一個 useEffect 來監視 scores 的變化
        useEffect(() => {
            console.log('Scores updated:', scores);
        }, [scores]);

        return (
            <div>
                <video style={videoBackgroundStyle} autoPlay loop muted>
                    <source src={"ingame-background.mp4"} type='video/mp4' />
                </video>
                <div className='gameContainer'>
                    <div className='gamingArea'>
                        <h2>房間:{room}</h2>
                        <p>當前回合: {currentRound} / 10</p>
                        {countdown && <p>遊戲開始倒數: {countdown} 秒</p>}
                        {!gameStarted && players.length > 1 && (
                            isHost ? (
                                <button onClick={handleStartGame}>開始遊戲</button>
                            ) : (
                                <button disabled>等待房主開始遊戲...</button>
                            )
                        )}
                        {isPlaying &&(
                            <p>第{currentRound}題</p>
                        )}
                        {!gameStarted && players.find(player => player === "practice") &&(
                            <button onClick={handleStartGame}>開始遊戲</button>
                        )}
                        {options.length > 0 && (
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
                        )} 
                    </div>
                    <div className='leaderBoard'>
                        <div>
                            <h3>排行榜</h3>
                            <ul>
                                {Object.entries(scores)
                                    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                                    .map(([player, score], index) => (
                                        <li key={player} className="leaderboard-item">
                                            {index + 1}. {player}: {score} 分
                                        </li>
                                    ))}
                            </ul>
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
                </div>
            </div>
        );
    }

    export default GameBoard;