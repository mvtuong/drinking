import Head from 'next/head'
import Footer from '../components/Footer';
import styles from '../styles/Home.module.css';
import Modal from '../components/Modal';
import { useState } from 'react';

export default function Home() {
  const [roomId, setRoomId] = useState();
  const [showRoomModal, setShowRoomModal] = useState(false)

  const onNewBtnClick = (isClassic = false) => {
    // TODO: detect if channel is in use
    const channelName = Math.random().toString(36).substr(2, 16);
    window.open(isClassic ? '/classic' : `/games/${channelName}`, '_self');
  };

  const onRoomIdChange = (event) => {
    setRoomId(event.target.value);
  };

  const onRoomIdSubmit = () => {
    window.open(`/games/${roomId}`, '_self');
  };

  const onRoomModalClose = () => {
    setShowRoomModal(false);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      onRoomIdSubmit();
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Drinking Game</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to Drinking Game</h1>
        <div className={styles.homeBtnsWrapper}>
          <button className={styles.btnNew} onClick={() => onNewBtnClick(false)}>New Game</button>
          <button className={styles.btnJoin} onClick={() => setShowRoomModal(true)}>Join Game</button>
          <button className={styles.btnNewClassic} onClick={() => onNewBtnClick(true)}>New Game (Classic)</button>
        </div>
      </main>

      <Modal isOpen={showRoomModal} onClose={onRoomModalClose} type="player">
        <div className={styles.playerModal}>
          <input type="text" value={roomId} onChange={onRoomIdChange} onKeyDown={onKeyDown} autoFocus placeholder="Game ID" className={styles.playerModalNameInput} />
          <br />
          <button onClick={onRoomIdSubmit}>Join</button>
        </div>
      </Modal>

      <Footer />
    </div>
  )
}
