import styles from './ProtectedPageTemplate.module.css'
import SideMenu from '../SideMenu/SideMenu';

type Props = {
  children: React.ReactNode;
}

const ProtectedPageTemplate = ({children}: Props) => {
  return (
    <main className={styles.main}>
      <div className={styles.main__sideMenu}>
        <SideMenu />
      </div>
      <div className={styles.main__mainContents}>
        {children}
      </div>
    </main>
  )
};

export default ProtectedPageTemplate;