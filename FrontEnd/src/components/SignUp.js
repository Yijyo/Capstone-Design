import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/SignUp.module.css";

function SignUp() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        passwordCheck: "",
        isAllAgreed: false,
        isAgreed: false,
        privacy: false,
        ad: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleAllCheck = () => {
        const newState = !formData.isAllAgreed;
        setFormData({
            ...formData,
            isAllAgreed: newState,
            isAgreed: newState,
            privacy: newState,
            ad: newState
        });
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        
        setFormData((prev) => {
            const updatedState = {
                ...prev,
                [name]: checked, 
            };
    
            const allChecked = updatedState.isAgreed && updatedState.privacy && updatedState.ad;
            updatedState.isAllAgreed = allChecked;
    
            return updatedState;
        });
    };
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (formData.password !== formData.passwordCheck) {
            alert("비밀번호가 일치하지 않습니다.");
            setIsLoading(false);
            return;
        }        
    
        try {
            const requestData = {
                email: formData.email,
                password: formData.password,
                name: formData.name
            };
    
            const response = await fetch('http://172.16.41.240:8080/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });
    
            const responseData = await response.json();
            console.log("서버 응답:", responseData);
    
            if (response.ok && responseData.statusCode === 200) {
                // alert('회원가입 성공! 로그인 페이지로 이동합니다.');
                navigate('/login');
            } else if (response.status === 409 && responseData.message) {
                alert(`회원가입 실패: ${responseData.message}`); 
            } else {
                alert(`회원가입 실패: ${responseData.message || '알 수 없는 오류가 발생했습니다.'}`);
            }
        } catch (error) {
            console.error('회원가입 에러:', error);
            alert('서버와 통신 중 오류가 발생했습니다.');
        } finally {
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
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className={styles.input}
                            placeholder="이름"
                        />
                    </div>

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

                    <div className={styles.inputGroupSmall}>
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
                    <div className={styles.noticeText}>
                        8~20자 영문 대소문자, 숫자, 특수문자 중 2가지 이상 조합
                    </div>
                    <div className={styles.inputGroupSmall}>
                        <input
                            type="password"
                            name="passwordCheck"
                            value={formData.passwordCheck}
                            onChange={handleChange}
                            required
                            className={styles.input}
                            placeholder="비밀번호 다시 입력"
                        />
                    </div>

                    <div className={styles.checkboxContainer}>
                        <label>
                            <input
                                type="checkbox"
                                name="isAllAgreed"
                                checked={formData.isAllAgreed}
                                onChange={handleAllCheck}
                            />
                            아래 내용에 모두 동의합니다{" "}
                            {/* <a className={styles.policy} href="https://openai.com/policies/terms-of-use/" target="_blank" rel="noopener noreferrer">
                                자세히 보기
                            </a> */}
                        </label>
                    </div>

                    <div className={styles.checkboxContainer}>
                        <label>
                            <input
                                type="checkbox"
                                name="isAgreed"
                                checked={formData.isAgreed}
                                onChange={handleCheckboxChange}
                                required
                            />
                            (필수) 이용약관에 동의합니다.{" "}
                            {/* <a className={styles.policy} href="https://openai.com/policies/terms-of-use/" target="_blank" rel="noopener noreferrer">
                                자세히 보기
                            </a> */}
                        </label>
                    </div>

                    <div className={styles.checkboxContainer}>
                        <label>
                            <input
                                type="checkbox"
                                name="privacy"
                                checked={formData.privacy}
                                onChange={handleCheckboxChange}
                                required
                            />
                            (필수) 개인정보 수집 및 이용에 대한 안내에 동의합니다.{" "}
                            {/* <a className={styles.policy} href="https://openai.com/policies/terms-of-use/" target="_blank" rel="noopener noreferrer">
                                자세히 보기
                            </a> */}
                        </label>
                    </div>

                    <div className={`${styles.checkboxContainer} ${styles.lastCheckbox}`}>
                        <label>
                            <input
                                type="checkbox"
                                name="ad"
                                checked={formData.ad}
                                onChange={handleCheckboxChange}
                            />
                            (선택) 홍보성 정보 수신에 동의합니다.{" "}
                            {/* <a className={styles.policy} href="https://openai.com/policies/terms-of-use/" target="_blank" rel="noopener noreferrer">
                                자세히 보기
                            </a> */}
                        </label>
                    </div>

                    <button type="submit" className={styles.button}>
                        회원가입
                    </button>
                </form>
            </div>
        </div>
    );
}

export default SignUp;