// src/components/BurgerBuilder.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import "./BurgerBuilder.css";

// 1. IMPORT REACT-TOASTIFY
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type IngredientType = 'salad' | 'bacon' | 'cheese' | 'meat';

interface Layer {
  type: IngredientType;
}

export default function BurgerBuilder() {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [counts, setCounts] = useState<Record<IngredientType, number>>({
    salad: 0,
    bacon: 0,
    cheese: 0,
    meat: 0,
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  const prices = {
    salad: 0.5,
    bacon: 0.7,
    cheese: 0.4,
    meat: 1.3,
  };

  const basePrice = 0.0;
  const totalPrice = layers.reduce((sum, layer) => sum + prices[layer.type], basePrice);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setDisplayName(
          user.displayName ||
            user.email?.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '') ||
            'Người dùng'
        );
      } else {
        navigate('/auth', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const addIngredient = (type: IngredientType) => {
    setLayers((prev) => [...prev, { type }]);
    setCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const removeIngredient = (type: IngredientType) => {
    setLayers((prev) => {
      const index = prev.slice().reverse().findIndex((l) => l.type === type);
      if (index === -1) return prev;
      const actualIndex = prev.length - 1 - index;
      const newLayers = [...prev];
      newLayers.splice(actualIndex, 1);
      return newLayers;
    });

    setCounts((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] - 1),
    }));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Có lỗi khi đăng xuất. Vui lòng thử lại.');
    }
  };

  // --- HÀM CHECKOUT ĐÃ SỬA VỚI TOAST ---
  const handleCheckout = () => {
    if (totalPrice <= basePrice) {
      // Gọi thông báo Toast
      toast.warn('Bạn cần chọn thêm nguyên liệu trước khi thanh toán!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored", // Hoặc "light", "dark"
        transition: Slide, // Hiệu ứng trượt
      });
      return;
    }
    navigate('/checkout', { state: { layers, totalPrice } });
  };
  // -------------------------------------

  const renderLayer = (layer: Layer, index: number) => {
    const className = `layer ${layer.type}`;
    return (
      <div key={`${layer.type}-${index}`} className={className}>
        {layer.type.charAt(0).toUpperCase() + layer.type.slice(1)}
      </div>
    );
  };

  return (
    <div className="burger-builder">
      <ToastContainer />

      {/* Navbar */}
      <header className="navbar">
        <h1 className="navbar-title">Burger Builder</h1>
        <div className="navbar-buttons">
          {currentUser && (
            <div className="user-profile-section">
              <div className="avatar-wrapper">
                 {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Avatar" className="user-avatar" />
                 ) : (
                    // SVG Icon hình người mặc định
                    <svg 
                      viewBox="0 0 20 20" 
                      fill="currentColor" 
                      className="default-avatar-icon"
                    >
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                 )}
              </div>
              <span className="user-name">{displayName}</span>
            </div>
          )}
          <button className="nav-btn" onClick={() => navigate('/orders')}>
            Orders
          </button>
          <button className="nav-btn logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="main-content">
        <section className="burger-section">
          <h2 className="section-title">Your Burger</h2>
          <div className="burger-stack">
            <div className="bread top">Bread Top</div>
            {layers.map((layer, index) => renderLayer(layer, index))}
            <div className="bread bottom">Bread Bottom</div>
          </div>

          <div className="price-display">
            <span className="price-amount">${totalPrice.toFixed(2)}</span>
            <span className="price-label">Total Price</span>
          </div>
        </section>

        <section className="controls-section">
          <h2 className="section-title">Build Your Burger</h2>

          <div className="controls-grid">
            {(['salad', 'bacon', 'cheese', 'meat'] as const).map((type) => (
              <div key={type} className="control-item">
                <span className="ingredient-name">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>

                <div className="button-group">
                  <button
                    className="control-btn less"
                    onClick={() => removeIngredient(type)}
                    disabled={counts[type] === 0}
                  >
                    Less
                  </button>

                  <span className="quantity">{counts[type]}</span>

                  <button
                    className="control-btn more"
                    onClick={() => addIngredient(type)}
                  >
                    More
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Nút Checkout vẫn giữ nguyên không có disabled attribute */}
          <button
            className={`checkout-button ${totalPrice <= basePrice ? 'disabled' : ''}`}
            onClick={handleCheckout}
          >
            Checkout
          </button>
        </section>
      </div>
    </div>
  );
}