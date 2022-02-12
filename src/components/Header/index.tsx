import Link from 'next/link';
import styles from './header.module.scss';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function Header() {
  return (
    <>
      <header className={styles.container}>
        <Link href="/">
          <img src="/Logo.svg" alt="logo" className={styles.logo} />
        </Link>
      </header>
    </>
  );
}
