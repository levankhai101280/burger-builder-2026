import { useState } from 'react';
import { auth } from '../../services/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import toast from 'react-hot-toast';

interface SignUpFormProps {
  onToggleLogin: () => void;
}

export default function SignUpForm({ onToggleLogin }: SignUpFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanName = name.trim();
    if (!cleanName) {
      toast.error('Vui lòng nhập tên hiển thị');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(userCredential.user, { displayName: cleanName });
      
      // Force reload để cập nhật profile ngay lập tức
      await auth.currentUser?.reload();
      
      toast.success(
        `Đăng ký thành công! Chào mừng ${cleanName} 🎉`,
        { duration: 3200 }
      );
      
      // Auth state change sẽ tự redirect bên component cha
    } catch (err: any) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          toast.error('Email này đã được sử dụng.');
          break;
        case 'auth/weak-password':
          toast.error('Mật khẩu quá yếu (tối thiểu 6 ký tự).');
          break;
        case 'auth/invalid-email':
          toast.error('Email không hợp lệ.');
          break;
        default:
          toast.error('Lỗi đăng ký: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="auth-form">
      <div className="form-group">
        <label htmlFor="signup-name">Tên hiển thị</label>
        <input
          id="signup-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Nguyễn Văn A"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@gmail.com"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="signup-password">Mật khẩu</label>
        <input
          id="signup-password"
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
        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
      </button>

      <div className="toggle-section">
        <span>Đã có tài khoản?</span>
        <button type="button" className="toggle-btn" onClick={onToggleLogin}>
          Đăng nhập ngay
        </button>
      </div>
      
      <div className="or-divider">
        <span className="or-text">OR</span>
      </div>
    </form>
  );
}