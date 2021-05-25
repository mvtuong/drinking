import { useState } from "react";
import styles from '../styles/Player.module.css';

const Player = ({ name, iconNumber, isActive, isStopped, isSelected, isSpinning, isPreview, onRemove, onClick }) => {
  const [opened, setOpened] = useState(true);

  const onUserClick = () => {
    if (onClick) {
      onClick();
    } else {
      setOpened(prev => !prev);
    }
  };

  return (
    <div
      className={`${styles.player} ${isActive ? styles.active : ''} ${isStopped ? styles.stopped : ''} ${isSelected ? styles.selected : ''} ${isSpinning ? styles.spin : ''} ${isPreview ? styles.preview : ''}`}
      role="presentation"
      onClick={onUserClick}
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
