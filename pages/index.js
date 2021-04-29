import Head from 'next/head'
import styles from '../styles/Home.module.css'
import userStyles from '../styles/User.module.css';
import User from '../components/User';
import { useRef, useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { v4 as uuidv4 } from 'uuid';
import { useChannel } from "../components/AblyReactEffect";

const ICON_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80];
const DEFAULT_USERS = [
  { name: 'Player 1', iconNumber: 1 },
  { name: 'Player 2', iconNumber: 2 },
  { name: 'Player 3', iconNumber: 3 },
  { name: 'Player 4', iconNumber: 4 },
  { name: 'Player 5', iconNumber: 5 },
  { name: 'Player 6', iconNumber: 6 },
  { name: 'Player 7', iconNumber: 7 },
  { name: 'Player 8', iconNumber: 8 },
  { name: 'Player 9', iconNumber: 9 },
  { name: 'Player 10', iconNumber: 10 },
  { name: 'Player 11', iconNumber: 11 },
  { name: 'Player 12', iconNumber: 12 },
];

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

export default function Home() {
  const context = useRef();
  const isUnmounted = useRef();
  const dest = useRef(-1);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showColorsModal, setShowColorsModal] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [randomNumber, setRandomNumber] = useState(1);
  const [sound, setSound] = useState('triangle');
  const [currentImage, setCurrentImage] = useState(-1);
  const [stamps, setStamps] = useState([]);
  const [gameState, setGameState] = useState({ players: [], activePlayerIndex: -1 });
  const [myUser, setMyUser] = useState({ name: undefined, id: uuidv4() });
  const [isController, setIsController] = useState(false);

  const [channel, ably] = useChannel("drinking", (message) => {
    setGameState(message.data);
  });

  const syncState = (state) => {
    channel.publish({ name: "sync-state", data: state });
  }

  const onUserRemove = (name) => {
    setGameState((prev) => {
      setMyUser({ name: undefined });
      const newState = {
        ...prev,
        activePlayerIndex: -1,
        players: gameState.players.filter(user => user.name !== name)
      };
      syncState(newState);
      return newState;
    });
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      onUserAdd();
    }
  };

  const onUserAdd = () => {
    setError('');
    if (!username.trim()) {
      setError('Name cannot be empty!');
      return;
    }

    if (gameState.players.some(user => user.name === username)) {
      setError('Duplicated Name! Please try another one');
      return;
    }

    setShowUserModal(false);
    const myUser = {
      name: username,
      iconNumber: randomNumber,
    };
    const players = [...gameState.players, myUser]
    setMyUser(myUser);
    // localStorage.setItem("myUser", JSON.stringify(myUser));
    setGameState((prev) => {
      const newState = {
        ...prev,
        players,
        activePlayerIndex: -1
      };
      syncState(newState);
      return newState;
    });
    setUsername('');
  };

  const onUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const onShuffleBtnClick = () => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        players: shuffleArray(gameState.players),
        activePlayerIndex: -1
      };
      syncState(newState);
      return newState;
    });
  };

  const onStartBtnClick = () => {
    // TODO: set dest.current heuristic
    if (dest.current > -1) {
      return;
    }

    dest.current = getRandomInt(gameState.players.length * 4, gameState.players.length * 5);
    setGameState((prev) => {
      const newState = {
        ...prev,
        activePlayerIndex: 0
      };
      return newState;
    });
  };

  const onClearBtnClick = () => {
    setGameState((prev) => {
      const newState = { ...prev, players: [] };
      syncState(newState);
      return newState;
    });
    // Clear state server side
    setMyUser({ name: undefined });
    fetch("https://game-sync.azurewebsites.net/state", {
      method: "DELETE"
    }).then((response) => console.log(response));
  };

  const onUserModalClose = () => {
    setShowUserModal(false);
    setError('');
    setUsername('');
  };

  const onImageModalClose = () => {
    setStamps([]);
    setShowImageModal(false);
  };

  const onImageBtnClick = () => {
    const totalImages = 19;
    setCurrentImage(getRandomInt(1, totalImages));
    setShowImageModal(true);
  };

  const onSyncBtnClick = () => {
    console.log("Force sync state");
    syncState(gameState);
  }

  const onImageModalClick = (event) => {
    const radius = 25;
    const x = event.clientX - radius;
    const y = event.clientY - radius;
    setStamps([...stamps, { x, y }]);
  };

  const onHelpModalClose = () => {
    setShowHelpModal(false);
  };

  const onColorsModalClose = () => {
    setShowColorsModal(false);
  }

  useEffect(async () => {
    if (isUnmounted.current || gameState.activePlayerIndex < 0 || dest.current === -1) {
      return;
    }

    if (gameState.activePlayerIndex === dest.current) {
      if (sound !== 'none') {
        playSound(sound, 174.6);
        await delay(500);
        playSound(sound, 260.0);
        await delay(500);
        playSound(sound, 440.0);
        await delay(1200);
        playSound(sound, 840.0, 3);
      }
      dest.current = -1;
      syncState(gameState);
      return;
    }

    if (sound !== 'none') {
      playSound(sound);
    }

    const factor = gameState.activePlayerIndex / dest.current;
    const delayTime = 300 * timingFunc(factor);
    await delay(delayTime);

    setGameState((prev) => {
      const newState = {
        ...prev,
        activePlayerIndex: gameState.activePlayerIndex + 1
      };
      return newState;
    });

    return () => {
      isUnmounted.current = true;
    };
  }, [gameState.activePlayerIndex]);

  useEffect(() => {
    const userNumbers = gameState.players.map(user => user.iconNumber);
    const numbers = ICON_NUMBERS.filter(number => !userNumbers.includes(number));
    const random = getRandomInt(0, numbers.length - 1);
    setRandomNumber(numbers[random]);
  }, [gameState.players]);

  useEffect(() => {

    // const savedUser = localStorage.getItem("myUser");
    // if (savedUser) {
    //   setMyUser(JSON.parse(savedUser));
    //   const players = [...gameState.players, savedUser];
    //   setGameState((prev) => {
    //     const newState = {
    //       ...prev,
    //       players
    //     };
    //     return newState;
    //   });
    // }
    const AudioContext = window.AudioContext || window.webkitAudioContext || false;
    if (AudioContext) {
      context.current = new AudioContext();
    }
  }, []);

  const handleCheckboxChange = (event) => {
    const { checked } = event.target;
    setIsController(checked);
  }

  useEffect(() => {
    fetch("https://game-sync.azurewebsites.net/state", {
      headers: { 'content-type': 'application/json' }
    })
      .then(response => response.json())
      .then(data => {
        if (data.players) {
          setGameState(data);
        }
      });
  }, [])

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

  const currentActiveUser = gameState.players[gameState.activePlayerIndex % gameState.players.length] || {};

  return (
    <div className={styles.container}>
      <Head>
        <title>Drinking Game</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to Drinking Game</h1>
        <div className={styles.slider}>
          <User
            name={currentActiveUser.name}
            iconNumber={currentActiveUser.iconNumber}
            isActive={true}
            isStopped={gameState.activePlayerIndex === dest.current}
          />
        </div>
        <div className={styles.content}>
          {gameState.players && gameState.players.map((user, idx) =>
            <User
              key={`${user.name}-${user.iconNumber}`}
              name={user.name}
              iconNumber={user.iconNumber}
              onRemove={onUserRemove}
              isActive={idx === gameState.activePlayerIndex % gameState.players.length}
              isStopped={gameState.activePlayerIndex === dest.current}
            />
          )}
          {!myUser.name &&
            <div className={`${userStyles.user} ${userStyles.addUserBtn}`} role="presentation" onClick={() => setShowUserModal(true)}>
              <img className={userStyles.userImg} src="/add-user.svg" />
            </div>
          }
        </div>
        {gameState.players &&
          <div className={styles.btnsWrapper}>
            <button className={styles.btnShuffle} onClick={onShuffleBtnClick} style={{ pointerEvents: gameState.players.length > 0 ? 'auto' : 'none' }}>Shuffle</button>
            <button className={styles.btnStart} onClick={onStartBtnClick} style={{ pointerEvents: gameState.players.length > 0 ? 'auto' : 'none' }}>Start</button>
            <button className={styles.btnClear} onClick={onClearBtnClick}>Clear</button>
          </div>
        }
      </main>

      <img className={styles.imageGenerate} src="/image.svg" role="presentation" onClick={() => onImageBtnClick()} />
      <label className={styles.controller}>
        <input
          name="isController"
          type="checkbox"
          checked={isController}
          onChange={handleCheckboxChange}
        />
        Controller
      </label>
      <img className={styles.forceSync} src="/sync.svg" role="presentation" onClick={() => onSyncBtnClick()} />
      <img className={styles.helpCenter} src="/question.svg" role="presentation" onClick={() => setShowHelpModal(true)} />
      <img className={styles.colorTable} src="/chromatic.svg" role="presentation" onClick={() => setShowColorsModal(true)} />

      <Modal isOpen={showUserModal} onClose={onUserModalClose} type="user">
        <div className={styles.userModal}>
          <img className={userStyles.userImg} src={`/legos/${randomNumber}.svg`} alt="" />
          <input type="text" value={username} onChange={onUsernameChange} onKeyDown={onKeyDown} autoFocus placeholder="Name" className={styles.userModalNameInput} />
          <p className={styles.error}>{error}</p>
          <button onClick={onUserAdd}>Add Player</button>
        </div>
      </Modal>

      <Modal isOpen={showImageModal} onClose={onImageModalClose} type="image">
        <div onClick={onImageModalClick} className={styles.imageModal} style={{ backgroundImage: `url(/images/${currentImage}.jpg)` }}>
          {stamps.map(({ x, y }, idx) =>
            <span className={styles.stamp} key={`stamp-${idx}`} style={{ top: y, left: x }}></span>
          )}
        </div>
      </Modal>

      <Modal isOpen={showColorsModal} onClose={onColorsModalClose} type="image">
        <div className={`${styles.imageModal} ${styles.colorsModal}`} />
      </Modal>

      <Modal isOpen={showHelpModal} onClose={onHelpModalClose} type="help">
        <h1>Mind reader</h1>
        <h3>How to play</h3>
        <p><strong>Step 1:</strong> The game controller shares screen and clicks on the Start button to select the lucky one.</p>
        <p><strong>Step 2:</strong> The lucky one decides who may drink this round by selecting 2 players who haven't been selected the previous round.</p>
        <p><strong>Step 3:</strong> The game controller opens a random image. The lucky one picks an object and lets everyone know the color of that object.</p>
        <p><strong>Step 4:</strong> The 2 selected players have to guess which object the lucky one has picked, but they have to choose different objects.</p>
        <p><strong>Step 5:</strong> The one(s) who guessed incorrectly must drink -:).</p>
        <br />
        <hr />
        <br />
        <p><strong>Settings:</strong> You can add/remove/hide/reveal a player. You can also shuffle/clear the list of players. Game sound can be adjusted in the page footer.</p>
      </Modal>

      <footer className={styles.footer}>
        <div className={styles.sounds}>
          <p>Sound: </p>
          <div onChange={(event) => setSound(event.target.value)}>
            <input type="radio" value="none" name="sound" id="sound-none" />
            <label htmlFor="sound-none">none</label>
            <input type="radio" value="triangle" name="sound" defaultChecked id="sound-triangle" />
            <label htmlFor="sound-triangle">triangle</label>
            <input type="radio" value="sine" name="sound" id="sound-sine" />
            <label htmlFor="sound-sine">sine</label>
            <input type="radio" value="square" name="sound" id="sound-square" />
            <label htmlFor="sound-square">square</label>
            <input type="radio" value="sawtooth" name="sound" id="sound-sawtooth" />
            <label htmlFor="sound-sawtooth">sawtooth</label>
          </div>
        </div>
        <div className={styles.attributes}>
          <div>Icons made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
          <div>Icons made by <a href="https://www.flaticon.com/authors/pixel-perfect" title="Pixel perfect">Pixel perfect</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
          <div>Icons made by <a href="https://www.flaticon.com/authors/smashicons" title="Smashicons">Smashicons</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
        </div>
        <div>
          <br />
          <p>From Munich with ❤︎</p>
          <br />
        </div>
      </footer>
    </div>
  )
}
