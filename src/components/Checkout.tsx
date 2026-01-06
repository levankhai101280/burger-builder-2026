import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './Checkout.css';
import type { User } from 'firebase/auth';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  const { ingredients = {}, totalPrice = 0 } = location.state || {};

  const [contact, setContact] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    note: '',
  });

  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);

        let name = user.displayName;
        if (!name && user.email) {
          const prefix = user.email.split('@')[0];
          name = prefix
            .charAt(0)
            .toUpperCase() + prefix.slice(1).toLowerCase(); // Capitalize cho đẹp
        }
        name = name || 'Người dùng';

        setDisplayName(name);
      } else {
        navigate('/auth', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  const handleOrder = async () => {
    if (!auth.currentUser) {
      alert('Vui lòng đăng nhập để đặt hàng!');
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'orders'), {
        userId: auth.currentUser.uid,
        ingredients,
        totalPrice,
        contact,
        createdAt: serverTimestamp(),
      });

      alert('Đặt hàng thành công!');
      navigate('/orders');
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      alert('Có lỗi xảy ra: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      {/* Navbar với Xin chào */}
      <nav className="navbar">
        <span className="brand" onClick={() => navigate('/')}>
          Burger Builder
        </span>

        <div className="nav-links">
          {currentUser && (
            <span className="welcome-text">
              Xin chào, <strong>{displayName}</strong>!
            </span>
          )}
          <button onClick={() => navigate('/')}>Builder</button>
          <button onClick={() => navigate('/orders')}>Orders</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="content">
        <h1>Checkout</h1>

        {/* Burger Preview */}
        <div className="burger-preview">
          <div className="bread top">Bread Top</div>

          {Object.entries(ingredients).map(([type, count]) =>
            Array(Number(count))
              .fill(null)
              .map((_, i) => (
                <div key={`${type}-${i}`} className={`layer ${type}`}>
                  {type}
                </div>
              ))
          )}

          <div className="bread bottom">Bread Bottom</div>
        </div>

        <div className="price">Total: ${totalPrice.toFixed(2)}</div>

        {/* Contact form */}
        <div className="contact-form">
          <h2>Contact Data</h2>

          <input
            type="text"
            placeholder="Name"
            value={contact.name}
            onChange={(e) => setContact({ ...contact, name: e.target.value })}
          />

          <input
            type="email"
            placeholder="Email"
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
          />

          <input
            type="tel"
            placeholder="Phone"
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
          />

          <input
            type="text"
            placeholder="Address"
            value={contact.address}
            onChange={(e) => setContact({ ...contact, address: e.target.value })}
          />

          <textarea
            placeholder="Note"
            value={contact.note}
            onChange={(e) => setContact({ ...contact, note: e.target.value })}
          />

          <button
            className="order-btn"
            onClick={handleOrder}
            disabled={loading}
          >
            {loading ? 'Đang đặt hàng...' : 'Order'}
          </button>
        </div>
      </div>
    </div>
  );
}