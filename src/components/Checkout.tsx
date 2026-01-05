// src/components/Checkout.tsx (hoặc src/pages/Checkout.tsx)
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import './Checkout.css';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy dữ liệu từ Burger Builder (ingredients + totalPrice)
  const { ingredients = {}, totalPrice = 0 } = location.state || {};

  const [contact, setContact] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    note: '',
  });

  const [loading, setLoading] = useState(false);

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
        userId: auth.currentUser.uid,          // UID để biết đơn của ai
        ingredients,                           // {salad: 2, bacon: 1, ...}
        totalPrice,                            // tổng tiền
        contact,                               // {name, email, phone, address, note}
        createdAt: serverTimestamp(),          // thời gian tự động
        });

        alert('Đặt hàng thành công!');
        navigate('/orders');                     // chuyển sang trang Orders
    } catch (error) {
        console.error('Lỗi khi đặt hàng:', error);
        alert('Có lỗi xảy ra khi đặt hàng: ' + (error as Error).message);
    } finally {
        setLoading(false);
    }
    };

  return (
    <div className="checkout-container">
      {/* Navbar theo wireframe */}
      <nav className="navbar">
        <span>Burger Builder</span>
        <div className="nav-links">
          <button onClick={() => navigate('/')}>Builder</button>
          <button onClick={() => navigate('/orders')}>Orders</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="content">
        <h1>Checkout</h1>

        {/* Burger preview - giống Builder */}
        <div className="burger-preview">
          <div className="bread top">Bread Top</div>

          {Object.entries(ingredients).map(([type, count]) =>
            Array(Number(count)).fill(null).map((_, i) => (
              <div key={`${type}-${i}`} className={`layer ${type}`} />
            ))
          )}

          <div className="bread bottom">Bread Bottom</div>
        </div>

        {/* Price */}
        <div className="price">
          Price: ${totalPrice.toFixed(2)}
        </div>

        {/* Contact Data form */}
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