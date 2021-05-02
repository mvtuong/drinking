import { useState } from "react";
import styles from '../styles/Player.module.css';

const Player = ({ name, iconNumber, isActive, isStopped, onRemove }) => {
  const [opened, setOpened] = useState(true);

  return (
    <div
      className={`${styles.player} ${isActive ? styles.active : ''} ${isStopped ? styles.stopped : ''} ${onRemove ? '' : styles.spin}`}
      role="presentation"
      onClick={() => setOpened(prev => !prev)}
    >
      {onRemove && <img className={styles.closeBtn} src="/remove.svg" role="presentation" onClick={(e) => { e.stopPropagation(); onRemove(name); }} />}
      {opened
        ? <img className={styles.playerImg} src={ iconNumber ? `/legos/${iconNumber}.svg` : "/player.svg" } alt="" />
        : <img className={styles.playerImg} src="/player.svg" alt="" />
      }
      <p style={{ visibility: opened ? 'visible' : 'hidden' }}>{name || 'Undefined'}</p>
    </div>
  )
};

export default Player;
