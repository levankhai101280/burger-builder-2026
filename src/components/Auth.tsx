import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import './Auth.css';
import toast from 'react-hot-toast';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Fallback an toàn ở mọi nơi
        const displayName =
          user.displayName ||
          (user.email ? user.email.split('@')[0] : 'Người dùng');

        // Chỉ toast khi đăng nhập bình thường (không phải signup)
        if (!isSignUp) {
          toast.success(`Chào mừng trở lại ${displayName}!`, { duration: 2200 });
          navigate('/', { replace: true });
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, isSignUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    try {
      if (isSignUp) {
        if (!cleanName) {
          throw new Error('Vui lòng nhập tên hiển thị');
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

        await updateProfile(userCredential.user, { displayName: cleanName });

        // Cố gắng sync dữ liệu mới nhất
        await auth.currentUser?.reload();
        await userCredential.user.getIdToken(true); // force refresh token

        // Lấy tên đã cập nhật (fallback về tên vừa nhập nếu chưa kịp sync)
        const displayName = auth.currentUser?.displayName || cleanName;

        toast.success(
          `Đăng ký thành công! Chào mừng ${displayName} đến với Burger Builder 🎉`,
          { duration: 3200 }
        );

        // Chuyển hướng
        navigate('/', { replace: true });
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        // Đăng nhập sẽ để onAuthStateChanged xử lý
      }
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
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Email hoặc mật khẩu không chính xác.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Quá nhiều lần thử. Vui lòng chờ một lát rồi thử lại.';
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);

    const cleanResetEmail = resetEmail.trim();

    try {
      await sendPasswordResetEmail(auth, cleanResetEmail);
      toast.success(
        'Đã gửi email khôi phục mật khẩu! Kiểm tra hộp thư (và thư rác) nhé.',
        { duration: 5000 }
      );
      setShowResetModal(false);
      setResetEmail('');
    } catch (err: any) {
      let message = 'Không thể gửi email. Vui lòng thử lại!';

      switch (err.code) {
        case 'auth/invalid-email':
          message = 'Email không hợp lệ.';
          break;
        case 'auth/user-not-found':
          message = 'Không tìm thấy tài khoản với email này.';
          break;
        case 'auth/too-many-requests':
          message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.';
          break;
        default:
          message = err.message || message;
      }

      setResetError(message);
      console.error('Reset Password Error:', err.code, err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Burger Builder</h1>
          <p>{isSignUp ? 'Tạo tài khoản để lưu đơn hàng' : 'Đăng nhập để tiếp tục'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}

              {!isSignUp && (
                <div style={{ marginTop: '8px', fontSize: '0.85em', color: '#ff9800' }}>
                  [!] Quên mật khẩu?{' '}
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => {
                      setShowResetModal(true);
                      setResetError(null);
                      setResetEmail(email);
                    }}
                  >
                    Khôi phục ngay
                  </button>
                </div>
              )}

              {error?.includes('không chính xác') && !isSignUp && (
                <div style={{ marginTop: '6px', fontSize: '0.85em', color: '#ff9800' }}>
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => {
                      setIsSignUp(true);
                      setError(null);
                    }}
                  >
                    Đăng ký ngay
                  </button>
                </div>
              )}
            </div>
          )}

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="name">Tên hiển thị</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              required
              autoComplete="email"
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
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`submit-btn ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Đang xử lý...' : isSignUp ? 'Đăng ký' : 'Đăng nhập'}
          </button>

          <div className="toggle-section">
            <span>{isSignUp ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}</span>
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

          <div className="or-divider">
            <span className="or-text">OR</span>
          </div>
        </form>
      </div>

      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Khôi phục mật khẩu</h2>
            <p>Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.</p>

            {resetError && <div className="error-message">{resetError}</div>}

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="reset-email">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowResetModal(false)}
                  disabled={resetLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`submit-btn ${resetLoading ? 'loading' : ''}`}
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Đang gửi...' : 'Gửi email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}