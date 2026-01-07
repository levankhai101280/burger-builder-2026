// src/containers/Checkout.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- BẮT ĐẦU SỬA LỖI IMPORT ---
import PhoneInputDefault from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// Fix lỗi "Element type is invalid... got: object":
// Kiểm tra xem thư viện có export dưới dạng .default không.
// Nếu có thì dùng .default, nếu không thì dùng chính nó.
const PhoneInput = (PhoneInputDefault as any).default || PhoneInputDefault;
// --- KẾT THÚC SỬA LỖI IMPORT ---

import './Checkout.css';

type IngredientType = 'salad' | 'bacon' | 'cheese' | 'meat';

interface Layer {
  type: IngredientType;
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  const { layers = [], totalPrice = 0 } = location.state || {};

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
    if (!location.state || layers.length === 0) {
      navigate('/', { replace: true });
    }
  }, [location, layers, navigate]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        let name = user.displayName;
        if (!name && user.email) {
          const prefix = user.email.split('@')[0];
          name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        }
        setDisplayName(name || 'Người dùng');
        setContact(prev => ({ ...prev, email: user.email || '' }));
      } else {
        toast.error("Vui lòng đăng nhập để tiếp tục");
        navigate('/auth', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContact((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (value: string) => {
    setContact((prev) => ({ ...prev, phone: value }));
  };

  const handleOrder = async () => {
    // 1. Validation cơ bản (Tên, Địa chỉ)
    if (!contact.name.trim() || !contact.address.trim()) {
      toast.warn('Vui lòng điền Tên và Địa chỉ!');
      return;
    }

    // 2. Validation Số điện thoại
    if (!contact.phone || contact.phone.length < 10) {
      toast.warn('Số điện thoại không hợp lệ (quá ngắn)!');
      return;
    }

    // Kiểm tra kỹ xem có phải toàn số không (dù thư viện đã chặn nhập chữ)
    const isNumeric = /^\d+$/.test(contact.phone);
    if (!isNumeric) {
        toast.warn('Số điện thoại chỉ được chứa số!');
        return;
    }

    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để đặt hàng!');
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      const ingredientsSummary = layers.reduce((acc: any, layer: Layer) => {
        acc[layer.type] = (acc[layer.type] || 0) + 1;
        return acc;
      }, {});

      await addDoc(collection(db, 'orders'), {
        userId: currentUser.uid,
        orderData: {
          ingredients: ingredientsSummary,
          layers: layers,
          totalPrice: totalPrice,
        },
        contact: {
            ...contact,
            phone: '+' + contact.phone // Thêm dấu + (ví dụ: +84...)
        },
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast.success('Đặt hàng thành công!');
      
      setTimeout(() => {
        navigate('/orders');
      }, 2000);

    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      toast.error('Có lỗi xảy ra: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const renderLayer = (layer: Layer, index: number) => (
    <div key={`${layer.type}-${index}`} className={`layer ${layer.type}`}>
      {layer.type.charAt(0).toUpperCase() + layer.type.slice(1)}
    </div>
  );

  return (
    <div className="checkout-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
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

        <div className="burger-preview">
          <div className="bread top">Bread Top</div>
          {layers.map((layer: Layer, index: number) => renderLayer(layer, index))}
          <div className="bread bottom">Bread Bottom</div>
        </div>

        <div className="price">Total Price: <strong>${totalPrice.toFixed(2)}</strong></div>

        <div className="contact-form">
          <h2>Contact Data</h2>

          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={contact.name}
            onChange={handleInputChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={contact.email}
            readOnly
            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
          />

          {/* Input Phone đã được fix lỗi render */}
          <div className="phone-input-wrapper">
             <PhoneInput
                country={'vn'}
                value={contact.phone}
                onChange={handlePhoneChange}
                onlyCountries={['vn', 'us', 'jp', 'kr']}
                inputProps={{
                  name: 'phone',
                  required: true,
                  autoFocus: false
                }}
                containerStyle={{ marginBottom: '15px' }}
                inputStyle={{
                  width: '100%',
                  height: '40px',
                  fontSize: '16px',
                  paddingLeft: '48px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
                buttonStyle={{
                  border: '1px solid #ccc',
                  borderRadius: '4px 0 0 4px',
                  backgroundColor: '#fff'
                }}
              />
          </div>

          <input
            type="text"
            name="address"
            placeholder="Address (Street, City...)"
            value={contact.address}
            onChange={handleInputChange}
          />

          <textarea
            name="note"
            placeholder="Note (Optional)"
            value={contact.note}
            onChange={handleInputChange}
            rows={3}
          />

          <button
            className="order-btn"
            onClick={handleOrder}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'ORDER NOW'}
          </button>
        </div>
      </div>
    </div>
  );
}