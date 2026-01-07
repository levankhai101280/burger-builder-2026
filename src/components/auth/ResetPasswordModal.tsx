import { useState } from 'react';
import { auth } from '../../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import toast from 'react-hot-toast';
import './ResetPasswordModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export default function ResetPasswordModal({ isOpen, onClose, initialEmail = '' }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast.success('Đã gửi email khôi phục! Kiểm tra hộp thư của bạn.');
      onClose();
    } catch (err: any) {
       let message = 'Lỗi gửi email.';
       if (err.code === 'auth/user-not-found') message = 'Email này chưa đăng ký.';
       setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Khôi phục mật khẩu</h2>
        <p>Nhập email để nhận link đặt lại mật khẩu.</p>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleReset}>
          <div className="form-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email của bạn"
              required
            />
          </div>
          <div className="modal-buttons">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}