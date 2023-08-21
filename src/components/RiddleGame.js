import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Leaderboard from './Leaderboard';
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: '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',
});
delete configuration.baseOptions.headers['User-Agent'];

const openai = new OpenAIApi(configuration);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
  padding: 10px;
  overflow-y: auto;
  padding-bottom: 60px; // space for the input bar
`;

const Message = styled.div`
  padding: 10px 15px;
  margin: 5px;
  border-radius: 15px;
  max-width: 70%;
  align-self: ${props => props.sender === 'user' ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.sender === 'user' ? '#4CAF50' : '#E0E0E0'};
  color: ${props => props.sender === 'user' ? 'white' : 'black'};
`;

const InputContainer = styled.form`
  display: flex;
  position: fixed;
  bottom: 10px;
  width: 95%;
  background-color: white;
  border-radius: 20px;
  padding: 5px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
`;

const TextInput = styled.input`
  flex: 4;
  padding: 10px;
  font-size: 16px;
  border: none;
  border-radius: 15px;
  outline: none;
`;

const SendButton = styled.button`
  flex: 1;
  margin-left: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 15px;
  padding: 10px;
  cursor: pointer;
`;

const SkipStage = styled.button`
  background-color: red;
  color: white;
  border: none;
  border-radius: 15px;
  padding: 10px;
  cursor: pointer;
`;

function RiddleGame() {
  const [messages, setMessages] = useState();
  const [input, setInput] = useState('');
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const stages = ["easy", "medium", "hard"];
  const [currentStage, setCurrentStage] = useState(0);  // starting with 'easy'
  const [points, setPoints] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [opacity, setOpacity] = useState(1);
  const [storeNewPoints, setStoreNewPoints] = useState(0);
  const [finish, setFinish] = useState(false)
  const [loading, setLoading] = useState(false)
  const riddles = {
    easy: [
      {
        role: 'system',
        content: 'Assume the role of the Riddler. Come up with a riddle where the answer to the riddle is PIANO. Do not mention any game rules, stay in character. say yes if the player correctly guesses the answer. They will ask you for hints and you should provide them in the most subtle, unobvious ways possible. To begin the game, give only the riddle with no other information about the game.'
      }
    ],
    medium: [{ role: 'system', content: 'Assume the role of the Riddler. Come up with a riddle where the answer to the riddle is ECHO. Do not mention any game rules, stay in character. say yes if the player correctly guesses the answer. They will ask you for hints and you should provide them in the most subtle, unobvious ways possible. Give no preamble before posing the riddle. To begin the game, give only the riddle with no other information about the game.' }],
    hard: [{ role: 'system', content: 'Assume the role of the Riddler. Come up with a riddle where the answer to the riddle is MOUNTAINS. Do not mention any game rules, stay in character. say yes if the player correctly guesses the answer. They will ask you for hints and you should provide them in the most subtle, unobvious ways possible. Give no preamble before posing the riddle. To begin the game, give only the riddle with no other information about the game.' }],
  };

  useEffect(() => {
    async function fetchRiddleResponse() {
      try {
        const completion = await openai.createChatCompletion({
          model: "gpt-4",
          messages: riddles[stages[currentStage]],
        });
        console.log(completion.data.choices[0].message.content);
        let firstAssistantMessage = { role: 'assistant', content: completion.data.choices[0].message.content };
        const newMessages = [...riddles[stages[currentStage]], firstAssistantMessage];
        setMessages(newMessages);
        setIsTimerActive(true); // Start the timer when messages load
      } catch (error) {
        console.error("Failed to get response from OpenAI in useEffect first call:", error);
      } finally {
        setShowSplash(false); // Hide the splash screen once the data is loaded
      }
    }
    fetchRiddleResponse();
  }, []);


  useEffect(() => {
    let interval;

    if (isTimerActive) {
      interval = setInterval(() => {
        setTimer(prevTime => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval); // Clean up the interval when the component unmounts
  }, [isTimerActive]);

  const formattedTime = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleInputChange = e => {
    setInput(e.target.value);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const newUserMessage = { role: 'user', content: input };
    setInput('');
    setMessages(prevMessages => [...prevMessages, newUserMessage]);

    try {
      // Make the API call
      const completion = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [...messages, newUserMessage],
      });

      const assistantMessage = { role: 'assistant', content: completion.data.choices[0].message.content };
      if (completion.data.choices[0].message.content.toLowerCase().includes("yes")) {
        setIsTimerActive(false);
        calculatePoints();
      }

      // Update the state with both user's and assistant's messages
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error("Error while sending message:", error);
    }
  };


  const calculatePoints = () => {
    console.log("Calculating points...");

    let baseScore;
    switch (stages[currentStage]) {
      case "easy":
        baseScore = 100;
        break;
      case "medium":
        baseScore = 200;
        break;
      case "hard":
        baseScore = 300;
        break;
      default:
        baseScore = 0;
        break;
    }

    // Subtract 1 for the first message, then multiply by 10 for the penalty.
    const userMessages = messages.filter(message => message.role === 'user').length;
    const messagePenalty = (userMessages > 1) ? (userMessages - 1) * 10 : 0;

    // Directly use the timer value for time penalty since it's 1 point per second.
    const timePenalty = timer;

    let pointsAwarded = baseScore - (messagePenalty + timePenalty);

    // Ensure the player doesn't receive negative points.
    pointsAwarded = Math.max(pointsAwarded, 0);

    setStoreNewPoints(pointsAwarded);

    setPoints(prevPoints => {
      const newPoints = prevPoints + pointsAwarded;
      console.log("Previous Points:", prevPoints, "New Points:", newPoints);
      return newPoints;
    });
  };

  const nextStage = async () => {
    if (currentStage < stages.length - 1) {
      const newStage = currentStage + 1;
      setCurrentStage(newStage);
      setLoading(true)
      await fetchNextRiddleResponse(newStage);
      // Reset the timer and messages for the new stage...
      setTimer(0);
      setStoreNewPoints(0);
    } else {
      // Game finished
      console.log("game finished");
      setFinish(true);
    }
  };

  const skipToNextStage = () => {
    setIsTimerActive(false);
    setTimer(0);
    setStoreNewPoints(0);
  }

  async function fetchNextRiddleResponse(nextStageIndex) {
    try {
      const completion = await openai.createChatCompletion({
        model: "gpt-4",
        messages: riddles[stages[nextStageIndex]],
      });
      const firstAssistantMessage = { role: 'assistant', content: completion.data.choices[0].message.content };
      setMessages([...riddles[stages[nextStageIndex]], firstAssistantMessage]);
      setLoading(false)
      setIsTimerActive(true);
    } catch (error) {
      console.error("Error fetching next riddle:", error);
    }
  }


  const containerRef = useRef(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    showSplash ? (
      <header className="App-header" style={{ opacity: opacity }}>
        <h1>Riddlr</h1>
      </header>
    ) : loading ? (   // <-- Loading check added here
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Loading...</h2>
      </div>
    ) : (
      <>
        <div>{stages[currentStage]}</div>
        <>
          <Container ref={containerRef}>
            <div>
              {formattedTime()}
            </div>
            {isTimerActive ? (
              messages.slice(1).map((message, index) => (
                <Message key={index} sender={message.role}>{message.content}</Message>
              ))
            ) : (
              <>
                {
                  finish || stages[currentStage] === "hard" ?
                    <div>Game Completed</div>
                    :
                    <>
                      {storeNewPoints > 0 ?
                        <>
                          <div>YOU WIN</div>
                          <button onClick={nextStage}>Continue to next stage</button>
                        </>
                        :
                        <>
                          <div>oh well...</div>
                          <button onClick={nextStage}>Continue to next stage</button>
                        </>
                      }
                    </>
                }
                <Leaderboard userPoints={points} />
              </>
            )}
          </Container>
          {isTimerActive && (
            <InputContainer onSubmit={sendMessage}>
              <SkipStage type="button" onClick={skipToNextStage}>Skip Stage</SkipStage>
              <TextInput
                value={input}
                onChange={handleInputChange}
                placeholder="Type your answer or ask for a hint..."
                onFocus={scrollToBottom}
              />
              <SendButton type="submit">Send</SendButton>
            </InputContainer>
          )}
        </>
      </>
    )
  )
}

export default RiddleGame;