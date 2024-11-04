import React from 'react';

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

export default ResultBoard;
