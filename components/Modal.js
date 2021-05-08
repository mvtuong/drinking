import { useEffect } from 'react';
import styles from '../styles/Modal.module.css';

const Modal = ({ isOpen, onClose, type = '', children }) => {
  const onEscHanlder = (event) => {
    if (type === 'players') {
      return;
    }

    if (event.keyCode === 27) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', onEscHanlder, false);
    return () => document.removeEventListener('keydown', onEscHanlder, false);
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles[type]}`} onClick={(e) => { e.stopPropagation() }}>
        {type !== 'players' &&
          <img className={styles.closeBtn} role="presentation" src="/remove.svg" alt="" onClick={onClose} />
        }
        {children}
      </div>
    </div>
  );
};

export default Modal;
