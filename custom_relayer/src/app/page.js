"use client"
import React, { useState } from 'react';
import styles from "../../style/home.module.css";
import AdminComponent from '../../components/Admin'; 
import UserComponent from '../../components/User'; 

export default function Home() {
  const [nav, setNav] = useState('');

  const handleClick = (value) => {
    setNav(value);
  };

  const adminButton = nav === "" ? styles.button : styles.adminButton;
  const userButton = nav === "" ? styles.button : styles.userButton;
  return (
    <>
    <div className={styles.mainContainer}>
          <button className={adminButton} onClick={() => handleClick('admin')}>Admin</button>
          <button className={userButton} onClick={() => handleClick('user')}>User</button>
          {nav === 'admin' ? <AdminComponent /> : nav === 'user' && <UserComponent />}
    </div>
    </>
     
  );
}