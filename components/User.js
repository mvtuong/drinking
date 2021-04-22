import { useState } from "react";
import styles from '../styles/User.module.css';

const User = ({ name, iconNumber, isActive, isStopped, onRemove }) => {
  const [opened, setOpened] = useState(true);

  return (
    <div
      className={`${styles.user} ${isActive ? styles.active : ''} ${isStopped ? styles.stopped : ''} ${onRemove ? '' : styles.spin}`}
      role="presentation"
      onClick={() => setOpened(prev => !prev)}
    >
      {onRemove && <img className={styles.closeBtn} src="/remove.svg" role="presentation" onClick={(e) => { e.stopPropagation(); onRemove(name); }} />}
      {opened
        ? <img className={styles.userImg} src={ iconNumber ? `/legos/${iconNumber}.svg` : "/user.svg" } alt="" />
        : <img className={styles.userImg} src="/user.svg" alt="" />
      }
      <p style={{ visibility: opened ? 'visible' : 'hidden' }}>{name || 'Undefined'}</p>
    </div>
  )
};

export default User;
