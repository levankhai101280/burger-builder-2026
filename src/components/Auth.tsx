import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import './Auth.css'; // Import file CSS thuần

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name && userCredential.user) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại!';

      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email này đã được sử dụng.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Mật khẩu quá yếu. Hãy dùng ít nhất 6 ký tự.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email không hợp lệ.';
          break;
        default:
          errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
      console.error('Firebase Auth Error:', err.code, err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <h1>Burger Builder</h1>
          <p>
            {isSignUp ? 'Tạo tài khoản để lưu đơn hàng' : 'Đăng nhập để tiếp tục'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="name">Tên hiển thị</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                required={isSignUp}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="example@gmail.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
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
            {loading ? 'Đang xử lý...' : isSignUp ? 'Đăng ký' : 'Đăng nhập'}
          </button>

          {/* Toggle */}
          <div className="toggle-section">
            <span>
              {isSignUp ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            </span>
            <button
              type="button"
              className="toggle-btn"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
            >
              {isSignUp ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
            </button>
          </div>

          {/* OR */}
          <div className="or-divider">
            <span className="or-text">OR</span>
          </div>
        </form>
      </div>
    </div>
  );
}