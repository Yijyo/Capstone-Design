import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/SignUp.module.css";
import { Link } from 'react-router-dom';

function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };
    console.log(formData)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const requestData = { 
                email: formData.email, 
                password: formData.password 
            };
            const response = await fetch('http://172.16.41.240:8080/auth/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });
    
            const responseData = await response.json();
            console.log(responseData);
            if (responseData.statusCode === 200) {
                localStorage.setItem('token', responseData.data.token);
                localStorage.setItem('userID', responseData.data.userId); 
                setFormData({ email: "", password: "" });
                setIsLoading(false);
                // alert('로그인 성공!');
                window.location.href = '/chat';
            } else {
                alert(`로그인 실패: ${responseData.message || '이메일 또는 비밀번호가 올바르지 않습니다.'}`);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('로그인 에러:', error);
            alert('로그인 처리 중 오류가 발생했습니다.');
            setIsLoading(false);
        }
    };    

    return (
        <div className={styles.container}>
            <div className={styles.signupBox}>
                <div className="logo_title">
                    <img src="/logo.png" alt="로고" />
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>

                    <div className={styles.inputGroup}>
                        <input
                            type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={styles.input}
                        placeholder="이메일 주소"
                    />
                </div>

                <div className={styles.inputGroup}>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className={styles.input}
                        placeholder="비밀번호"
                    />
                </div>

                <button type="submit" className={styles.button}>
                    로그인
                </button>
            </form>
           
            <div className={styles.bottom}>
                <span>계정이 없으신가요?</span>
                <Link className={styles.loginLink} to="/signup">
                <span>회원가입</span>
                </Link>
            </div>
        </div>
    </div>
);
}

export default Login;
