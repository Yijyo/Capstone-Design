import React from 'react';
import { Link } from 'react-router-dom';
import styles from "../styles/Home.module.css";

function Home() {
  return (
    <div className={styles.home_container}>
      <header className={styles.header}>
        <div className={styles.left_group}>
         <img src="/logo.png" alt="과시리 로고" className={styles.logo} onClick={() => (window.location.href = '/')} />
         <nav className={styles.nav_links}>
          <Link to="/intro">소개</Link>     
          <Link to="/faq">FAQ</Link> 
         </nav>
        </div>
        <div className={styles.right_group}>
         <Link to="/login">로그인</Link>
         <Link to="/signup">회원가입</Link>
        </div>
      </header>

      <main className={styles.main_content}>
        <div className={styles.text_section}>
          <h1>
            <span className={styles.highlight}>교통사고 과실 분석,</span><br />
            AI 과시리에게 맡기세요!
          </h1>
          <Link to="/chat" className={styles.upload_button}>
            블랙박스 영상 업로드 하러가기
          </Link>
          <p className={styles.description}>
            <span className={styles.highlight2}>
            AI 영상분석
            <img src="/analysis_icon.png" alt="아이콘" className={styles.analysis_icon} />
            </span>
            <br />
            과시리는 교통사고 블랙박스 영상을 분석하여 과실 비율을 측정해줍니다.
          </p>
        </div>
        <div className={styles.background_circle}></div>
        <div className={styles.background_circle2}></div>
        <div className={styles.image_section}>
          <img src="/robot.png" alt="AI 캐릭터" className={styles.robot_img} />
        </div>
      </main>
    </div>
  );
}

export default Home;
