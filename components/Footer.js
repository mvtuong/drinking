import styles from '../styles/Home.module.css';

export default function Footer({ setSound }) {
  return (
    <footer className={styles.footer}>
      {setSound &&
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
      }
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
  )
}
