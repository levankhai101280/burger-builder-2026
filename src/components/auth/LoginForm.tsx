import { useState } from 'react';
import { auth } from '../../services/firebase'; // Sửa lại đường dẫn import nếu cần
import { signInWithEmailAndPassword } from 'firebase/auth';
import toast from 'react-hot-toast';

interface LoginFormProps {
  onToggleSignUp: () => void;
  onForgotPassword: () => void;
}

export default function LoginForm({ onToggleSignUp, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Không cần navigate ở đây, onAuthStateChanged ở Auth.tsx sẽ lo việc đó
    } catch (err: any) {
      // Xử lý lỗi riêng cho Login
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          toast.error(
            <div>
              Email hoặc mật khẩu không chính xác. <br />
              Chưa có tài khoản?{' '}
              <button
                onClick={() => {
                  toast.dismiss();
                  onToggleSignUp();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff9800',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  padding: 0,
                  marginLeft: '4px',
                }}
              >
                Đăng ký ngay
              </button>
            </div>,
            {
              position: 'top-right',
              duration: 3000,
              style: {
                border: '1px solid #ff9800',
                padding: '12px',
                color: '#fff',
                background: '#1e1e1e',
              },
            }
          );
          break;
        case 'auth/too-many-requests':
          toast.error('Quá nhiều lần thử sai. Vui lòng thử lại sau vài phút.');
          break;
        default:
          toast.error('Đăng nhập thất bại: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="auth-form">
      <div className="form-group">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@gmail.com"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="login-password">Mật khẩu</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`submit-btn ${loading ? 'loading' : ''}`}
      >
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>

      <div className="forgot-password-wrapper">
        <button type="button" className="forgot-link" onClick={onForgotPassword}>
          Quên Mật Khẩu?
        </button>
      </div>

      <div className="toggle-section">
        <span>Chưa có tài khoản?</span>
        <button type="button" className="toggle-btn" onClick={onToggleSignUp}>
          Đăng ký ngay
        </button>
      </div>
      
      <div className="or-divider">
        <span className="or-text">OR</span>
      </div>
    </form>
  );
}