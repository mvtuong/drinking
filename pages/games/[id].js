import Head from 'next/head'
import styles from '../../styles/Home.module.css'
import playerStyles from '../../styles/Player.module.css';
import Player from '../../components/Player';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Modal from '../../components/Modal';
import Footer from '../../components/Footer';
import { v4 as uuidv4 } from 'uuid';
import { useChannel } from "../../components/AblyReactEffect";
import ImgView from '../../components/ImgView';

// TODO: update help text

const TOTAL_IMAGES = 19;
const ICON_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80];

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const delay = ms => new Promise(res => setTimeout(res, ms));

const timingFunc = x => x < 0.3 ? -(Math.cos(Math.PI * (0.7 - x)) - 1) / 2 : -(Math.cos(Math.PI * x) - 1) / 2;

const shuffleArray = (arrayInput) => {
  const array = [...arrayInput];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default function Game() {
  const router = useRouter();
  const { id } = router.query;
  const context = useRef();
  const isUnmounted = useRef();

  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showColorsModal, setShowColorsModal] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const [randomNumber, setRandomNumber] = useState(1);
  const [sound, setSound] = useState('triangle');

  // global state
  const [gameState, setGameState] = useState({
    players: [],
    destinationIndex: -1,
    imgIndex: 1,
    selectedPlayerIds: [],
    showImageModal: false,
    showWinLocation: false,
  });
  // local state
  const [currentActiveIndex, setCurrentActiveIndex] = useState(-1);
  const [myPlayerId, setMyPlayerId] = useState();

  // Subscribe to the channel id from the url
  const [channel, ably] = useChannel(id, (message) => {
    setGameState(message.data);
    setShowWinModal(message.data.winPlayerName);
  });

  const syncGameState = (newState) => {
    channel.publish({ name: "game-state", data: newState });
  }

  const updateGameState = (newState) => {
    setGameState(newState);
    syncGameState(newState);
  };

  const onPlayerRemove = (id) => {
    const newState = {
      ...gameState,
      players: gameState.players.filter(player => player.id !== id),
    };

    updateGameState(newState);
  };

  const onPlayerAdd = () => {
    if (!playerName.trim()) {
      setError('Name cannot be empty!');
      return;
    }

    setShowPlayerModal(false);

    const playerToAdd = {
      name: playerName,
      iconNumber: randomNumber,
      id: myPlayerId,
      role: 'player',
      location: [0,0]
    };

    const newState = {
      ...gameState,
      players: [...gameState.players, playerToAdd],
    };

    updateGameState(newState);
  };

  const onShuffleBtnClick = () => {
    const newState = {
      ...gameState,
      players: shuffleArray(gameState.players),
    };

    updateGameState(newState);
  };

  const onClearBtnClick = () => {
    const newState = {
      ...gameState,
      players: [],
      showWinLocation: false
    };

    setMyPlayerId('');
    updateGameState(newState);
  };

  const onStartBtnClick = () => {
    const destination = getRandomInt(gameState.players.length * 4, gameState.players.length * 5);
    const randomImage = getRandomInt(1, TOTAL_IMAGES);
    const players = gameState.players.map(player => ({ ...player, location: [] }));
    const totalPlayers = gameState.players.length;
    const newState = {
      ...gameState,
      imgIndex: randomImage,
      destinationIndex: destination,
      luckyPlayerId: (gameState.players[destination % totalPlayers] || {}).id,
      selectedPlayerIds: [],
      players,
      showWinLocation: false,
      pickedColor: 'rgb(255,255,255)',
    };

    updateGameState(newState);
  };

  useEffect(async () => {
    if (isUnmounted.current || gameState.destinationIndex === -1) {
      return;
    }

    // Round ended
    if (currentActiveIndex === gameState.destinationIndex) {
      setIsStopping(true);
      if (sound !== 'none') {
        playSound(sound, 174.6);
        await delay(500);
        playSound(sound, 260.0);
        await delay(500);
        playSound(sound, 440.0);
        await delay(1200);
        playSound(sound, 840.0, 3);
      }

      const newState = {
        ...gameState,
        destinationIndex: -1,
      }
      if (myPlayerId === gameState.luckyPlayerId) {
        setShowPlayersModal(true);
      }

      updateGameState(newState);
      return;
    }

    if (sound !== 'none') {
      playSound(sound);
    }

    const factor = currentActiveIndex / gameState.destinationIndex;
    const delayTime = 300 * timingFunc(factor);
    await delay(delayTime);

    setCurrentActiveIndex(currentActiveIndex + 1);

    return () => {
      isUnmounted.current = true;
    };
  }, [currentActiveIndex]);

  useEffect(async () => {
    if (gameState.destinationIndex > -1) {
      setCurrentActiveIndex(0);
      setIsStopping(false);
    }
  }, [gameState.destinationIndex]);

  const generateImage = () => {
    const playerNumbers = gameState.players.map(player => player.iconNumber);
    const numbers = ICON_NUMBERS.filter(number => !playerNumbers.includes(number));
    const random = getRandomInt(0, numbers.length - 1);
    setRandomNumber(numbers[random]);
  };

  const onUserLocationPick = () => {
    playSound(sound, 440.0);
    syncGameState(gameState);
  }

  // Pre-set the random number for the next player icon
  useEffect(() => {
    generateImage();
  }, [gameState.players]);

  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext || false;
    if (AudioContext) {
      context.current = new AudioContext();
    }

    const savedPlayerId = localStorage.getItem('myPlayerId');
    let playerId;
    if (savedPlayerId) {
      playerId = savedPlayerId;
    } else {
      playerId = uuidv4();
      localStorage.setItem('myPlayerId', playerId);
    }

    setMyPlayerId(playerId);
  }, []);

  const playSound = (type = 'triangle', frequency = 260.0, time = 1) => {
    if (!context.current) {
      return;
    }
    // square, triangle, sine, sawtooth
    const o = context.current.createOscillator();
    const g = context.current.createGain();
    g.gain.value = 0.1;
    o.connect(g);
    o.type = type;
    o.frequency.value = frequency;
    g.connect(context.current.destination);
    o.start(0);
    g.gain.exponentialRampToValueAtTime(0.00001, context.current.currentTime + time);
  };

  const handleShowWinLocation = () => {
    const newState = {
      ...gameState,
      showWinLocation: true
    };
    updateGameState(newState);
  }

  const handleControllerCheckboxChange = (event) => {
    const { checked } = event.target;
    if (!checked) {
      const newState = {
        ...gameState,
        players: gameState.players.map(player => {
          if (player.id === myPlayerId && player.role === 'controller') {
            return {
              ...player,
              role: 'player',
            }
          }

          return player;
        }),
      };

      updateGameState(newState);
    } else {
      if (gameState.players.some(player => player.role === 'controller')) {
        console.error('There has been a controller already!');
        return;
      }

      const newState = {
        ...gameState,
        players: gameState.players.map(player => {
          if (player.id === myPlayerId) {
            return {
              ...player,
              role: 'controller',
            }
          }

          return player;
        }),
      };

      updateGameState(newState);
    }
  }

  const onImageModalClose = () => {
    const newState = {
      ...gameState,
      showImageModal: false,
    };

    updateGameState(newState);
  };

  const onImageBtnClick = () => {
    const newState = {
      ...gameState,
      showImageModal: true,
    };

    updateGameState(newState);
  };

  const onAddPlayerModalShow = () => {
    setShowPlayerModal(true);
    setPlayerName('');
    setError('');
  };

  const onPlayerNameChange = (event) => {
    setPlayerName(event.target.value);
  };

  const onPlayerClick = (id) => {
    let newSelectedIds;
    if (gameState.selectedPlayerIds.includes(id)) {
      newSelectedIds = gameState.selectedPlayerIds.filter(_id => _id !== id);
    } else {
      newSelectedIds = [...gameState.selectedPlayerIds, id];
    }

    const newState = {
      ...gameState,
      selectedPlayerIds: newSelectedIds,
    };

    updateGameState(newState);
  };

  const onConfirmBtnClick = () => {
    if (gameState.selectedPlayerIds.length === 0) {
      setError('Please select at least one player');
      return;
    }
    setError('');
    setShowPlayersModal(false);
    
    const newState = {
      ...gameState,
      showImageModal: true,
    };

    updateGameState(newState);
  };

  const onArrowClick = (direction) => {
    const newState = gameState;

    if (direction === 'right') {
      newState.imgIndex = (gameState.imgIndex + 1) % TOTAL_IMAGES;
    } else {
      if (gameState.imgIndex > 1) {
        newState.imgIndex = (gameState.imgIndex - 1) % TOTAL_IMAGES;
      } else {
        newState.imgIndex = TOTAL_IMAGES;
      }
    }

    updateGameState(newState);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      onPlayerAdd();
    }
  };

  const currentActivePlayer = gameState.players[currentActiveIndex % gameState.players.length] || {};
  const isDisabled = gameState.players.length === 0;
  const controller = gameState.players.find(player => player.role === 'controller');
  const isController = myPlayerId === (controller || {}).id;
  const myPlayerAdded = gameState.players.some(player => player.id === myPlayerId);
  const selectedPlayers = gameState.players.filter(player => gameState.selectedPlayerIds.includes(player.id));

  return (
    <div className={styles.container}>
      <Head>
        <title>Drinking Game</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.title}>
          <h1>Welcome to Drinking Game</h1>
          <p>Room ID: {id}</p>
        </div>
        {/* Mobile */}
        <div className={styles.slider}>
          <Player
            name={currentActivePlayer.name}
            iconNumber={currentActivePlayer.iconNumber}
            isActive={true}
            isSpinning={true}
            isStopped={isStopping}
          />
        </div>
        {/* Desktop */}
        <div className={styles.content}>
          {gameState.players && gameState.players.map((player, idx) =>
            <Player
              key={`${player.name}-${player.iconNumber}`}
              name={player.name}
              iconNumber={player.iconNumber}
              onRemove={(isController || myPlayerId === player.id) ? () => onPlayerRemove(player.id) : undefined}
              isActive={idx === currentActiveIndex % gameState.players.length}
              isStopped={isStopping}
            />
          )}
          {!myPlayerAdded &&
            <div className={`${playerStyles.player} ${playerStyles.addPlayerBtn}`} role="presentation" onClick={onAddPlayerModalShow}>
              <img className={playerStyles.playerImg} src="/add-player.svg" />
            </div>
          }
        </div>
        {/* only visible to controller and only clickable if there is player && not animating */}
        {isController &&
          <div className={styles.btnsWrapper}>
            <button className={`${styles.btnShuffle} ${isDisabled ? styles.disabled : ''}`} onClick={onShuffleBtnClick}>Shuffle</button>
            <button className={`${styles.btnStart} ${isDisabled ? styles.disabled : ''}`} onClick={onStartBtnClick}>Start</button>
            <button className={`${styles.btnClear} ${isDisabled ? styles.disabled : ''}`} onClick={onClearBtnClick}>Clear</button>
          </div>
        }
      </main>

      <img className={styles.homeLink} src="/home.svg" role="presentation" onClick={() => window.open('/', '_self')} />
      {isController &&
        <img className={styles.imageGenerate} src="/image.svg" role="presentation" onClick={() => onImageBtnClick()} />
      }
      <label className={styles.controller}>
        <input
          name="isController"
          type="checkbox"
          checked={isController}
          onChange={handleControllerCheckboxChange}
        />
        Controller
      </label>
      <img className={styles.helpCenter} src="/question.svg" role="presentation" onClick={() => setShowHelpModal(true)} />
      <img className={styles.colorTable} src="/chromatic.svg" role="presentation" onClick={() => setShowColorsModal(true)} />

      <Modal isOpen={showPlayerModal} onClose={() => setShowPlayerModal(false)} type="player">
        <div className={styles.playerModal}>
          <img className={playerStyles.playerImg} src={`/legos/${randomNumber}.svg`} alt="" />
          <img className={playerStyles.resetBtn} src="/reset.svg" alt="" onClick={() => generateImage()} />
          <input type="text" value={playerName} onChange={onPlayerNameChange} onKeyDown={onKeyDown} autoFocus placeholder="Name" className={styles.playerModalNameInput} />
          <p className={styles.error}>{error}</p>
          <button onClick={onPlayerAdd}>Add Player</button>
        </div>
      </Modal>

      <Modal isOpen={gameState.showImageModal} type="image">
        {myPlayerId === gameState.luckyPlayerId && !gameState.showWinLocation &&
          <>
            <img className={`${styles.arrow} ${styles.leftArrow}`} src="/left-arrow.svg" role="presentation" onClick={() => onArrowClick('left')} />
            <img className={`${styles.arrow} ${styles.rightArrow}`} src="/right-arrow.svg" role="presentation" onClick={() => onArrowClick('right')} />
          </>
        }
        <div className={styles.pickedColor} style={{ backgroundColor: gameState.pickedColor }}></div>
        <div className={styles.selectedPlayers}>
          {selectedPlayers.map(player =>
            <Player
              key={`selected-player-${player.id}`}
              name={player.name}
              iconNumber={player.iconNumber}
              isPreview={true}
              onClick={() => undefined}
              isSelected={player.location && player.location.length > 0}
            />
          )}
        </div>
        <ImgView gameState={gameState} onUserLocationPick={onUserLocationPick} myPlayerId={myPlayerId} activePlayer={currentActivePlayer}></ImgView>
        {isController && gameState.showWinLocation &&
          <button className={styles.showWinLocation} onClick={onImageModalClose}>Start a new round</button>
        }
        {isController && !gameState.showWinLocation &&
          <button className={styles.showWinLocation} onClick={handleShowWinLocation}>Show win location</button>
        }
      </Modal>

      <Modal isOpen={showColorsModal} onClose={() => setShowColorsModal(false)} type="image">
        <div className={`${styles.imageModal} ${styles.colorsModal}`} />
      </Modal>

      <Modal isOpen={showWinModal} onClose={() => setShowWinModal(false)}>
        <div>Congratulations {gameState.winPlayerName}! You have won the game.</div>
      </Modal>

      <Modal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} type="help">
        <h1>Mind reader</h1>
        <h3>How to play</h3>
        <p><strong>Step 1:</strong> After the game has been created, people can join by visiting the generated link from the URL bar and add their own player.</p>
        <p><strong>Step 2:</strong> This game requires a controller. The first one who clicks on the checkbox below the home button will be the controller.</p>
        <p><strong>Step 3:</strong> The game controller starts the game by clicking on the Start button to select the lucky one.</p>
        <p><strong>Step 4:</strong> The lucky one decides who may drink this round by selecting some players who haven't been selected the previous round.</p>
        <p><strong>Step 5:</strong> A random image opens automatically. The lucky one picks an object and the object's color is displayed to everyone.</p>
        <p><strong>Step 6:</strong> The selected players have to guess which object the lucky one has picked by clicking on the image, but they have to choose different ones.</p>
        <p><strong>Step 7:</strong> After everyone finishes guessing, the game controller reveals the lucky one's answer. The one(s) who guessed incorrectly must drink -:).</p>
        <p>Feel free to invent your own rules. Enjoy the game!</p>
        <br />
        <hr />
        <br />
        <p><strong>Settings:</strong> You can add/remove/hide/reveal a player. You can also shuffle/clear the list of players. Game sound can be adjusted in the page footer.</p>
        <p>(At the moment the game's sounds work best on Google Chrome)</p>
      </Modal>

      <Modal isOpen={showPlayersModal} type="players">
        <div className={styles.selectPlayersModal}>
          <p>You're the lucky one. Please select the players for your game</p>
          <div className={styles.content}>
            {gameState.players && gameState.players.filter(player => player.id !== gameState.luckyPlayerId).map((player) =>
              <Player
                key={`${player.name}-${player.iconNumber}`}
                name={player.name}
                iconNumber={player.iconNumber}
                onClick={() => onPlayerClick(player.id)}
                isSelected={(gameState.selectedPlayerIds || []).includes(player.id)}
              />
            )}
          </div>
          <p className={styles.error}>{error}</p>
          <button onClick={onConfirmBtnClick}>Confirm</button>
        </div>
      </Modal>

      <Footer setSound={setSound} />
    </div>
  )
}
