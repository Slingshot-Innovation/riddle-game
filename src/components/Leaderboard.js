import React from 'react';
import styled from 'styled-components';

const LeaderboardContainer = styled.div`
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 10px;
  max-width: 500px;
  margin: 20px auto;
`;

const LeaderboardTitle = styled.h2`
  text-align: center;
  margin-bottom: 20px;
`;

const LeaderboardRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
`;

const PlayerName = styled.span``;
const PlayerScore = styled.span``;

function Leaderboard({ userPoints }) {

  const leaderboardData = [
    { name: 'Flynn', score: 597 },
    { name: 'Porter', score: 595 },
    { name: 'Moe', score: 594 },
  ];

  // In a real scenario, the user's score should be inserted in the right position.
  // For this example, we'll assume the current user is always at the top:
  const currentUser = { name: 'You', score: userPoints };
  leaderboardData.unshift(currentUser);

  return (
    <LeaderboardContainer>
      <LeaderboardTitle>Leaderboard</LeaderboardTitle>
      {leaderboardData.map((player, index) => (
        <LeaderboardRow key={index}>
          <PlayerName>{player.name}</PlayerName>
          <PlayerScore>{player.score}</PlayerScore>
        </LeaderboardRow>
      ))}
    </LeaderboardContainer>
  );
}

export default Leaderboard;