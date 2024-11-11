import React from 'react';

function ResultBoard({ scores, onPlayAgain }) {
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const backgroundStyle = {
      backgroundImage:("url('background.jpg')"),
      backgroundSize: "cover",
      backgroundPosition: "center",
      height: "100vh",
    }
  
    return (
      <div style={backgroundStyle}>
        <h2>遊戲結束</h2>
        <h3>最終排行榜</h3>
        <div className='resultArea'>
          <ul>
            {sortedScores.map(([player, score], index) => (
              <li key={player}>{index + 1}. {player}: {score}</li>
            ))}
          </ul>
          <button onClick={onPlayAgain}>再玩一次</button>
        </div>
      </div>
    );
  }

export default ResultBoard;
