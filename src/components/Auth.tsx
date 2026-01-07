import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import './Auth.css';

// Import các component con
import LoginForm from '../components/auth/LoginForm';
import SignUpForm from '../components/auth/SignUpForm';
import ResetPasswordModal from '../components/auth/ResetPasswordModal';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  const navigate = useNavigate();

  // Logic điều hướng khi user đã đăng nhập thành công
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const displayName = user.displayName || user.email?.split('@')[0] || 'Người dùng';
        
        // Nếu user vừa đăng ký xong (isSignUp = true), toast chào mừng đã hiện ở SignUpForm
        // Nếu user login, hiện toast chào mừng ở đây
        if (!isSignUp) {
           toast.success(`Chào mừng trở lại ${displayName}!`, { id: 'welcome-toast' });
        }
        
        navigate('/', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate, isSignUp]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Burger Builder</h1>
          <p>{isSignUp ? 'Tạo tài khoản mới' : 'Đăng nhập để tiếp tục'}</p>
        </div>

        {isSignUp ? (
          <SignUpForm onToggleLogin={() => setIsSignUp(false)} />
        ) : (
          <LoginForm 
            onToggleSignUp={() => setIsSignUp(true)} 
            onForgotPassword={() => setShowResetModal(true)}
          />
        )}
      </div>

      <ResetPasswordModal 
        isOpen={showResetModal} 
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
}