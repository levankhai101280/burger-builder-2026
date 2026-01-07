import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import "./BurgerBuilder.css";

// IMPORT COMPONENTS & TYPES
import CartModal from './Cart/CartModal'; // <--- Import component mới
import type { IngredientType, Layer, BurgerOrder } from './types'; // <--- Import types

// IMPORT REACT-TOASTIFY
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function BurgerBuilder() {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [counts, setCounts] = useState<Record<IngredientType, number>>({
    salad: 0, bacon: 0, cheese: 0, meat: 0,
  });

  const [cart, setCart] = useState<BurgerOrder[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  const navigate = useNavigate();

  const prices = { salad: 0.5, bacon: 0.7, cheese: 0.4, meat: 1.3 };
  const basePrice = 0.0;

  const currentBurgerPrice = layers.reduce((sum, layer) => sum + prices[layer.type], basePrice);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setDisplayName(
          user.displayName ||
          user.email?.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '') || 'User'
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
    setCounts((prev) => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
  };

  const handleAddToOrder = () => {
    if (layers.length === 0) {
      toast.warn('Bạn chưa chọn nguyên liệu nào cho bánh!');
      return;
    }

    const newBurger: BurgerOrder = {
      id: Date.now(),
      layers: [...layers],
      price: currentBurgerPrice
    };
    setCart([...cart, newBurger]);

    setLayers([]);
    setCounts({ salad: 0, bacon: 0, cheese: 0, meat: 0 });
    toast.success(`Đã thêm bánh #${cart.length + 1} vào giỏ!`);
  };

  const handleRemoveFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
    toast.info('Đã xóa món khỏi giỏ hàng.');
  };

  const handleCheckout = () => {
    if (cart.length === 0 && layers.length === 0) {
      toast.error('Giỏ hàng đang trống! Hãy làm ít nhất 1 chiếc bánh.');
      return;
    }
    if (cart.length === 0 && layers.length > 0) {
      toast.info('Vui lòng bấm "Thêm món này vào đơn" trước khi thanh toán.');
      return;
    }
    navigate('/checkout', { state: { cart: cart, totalPrice: totalCartPrice } });
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };
  const handleViewOrders = () => {
    navigate('/orders');
  };

  const renderLayer = (layer: Layer, index: number) => {
    return <div key={`${layer.type}-${index}`} className={`layer ${layer.type}`}>{layer.type}</div>;
  };

  return (
    <div className="burger-builder">
      <ToastContainer position="top-right" autoClose={2000} />

      <header className="navbar">
        <h1 className="navbar-title">BurgerBuilder</h1>
        <div className="navbar-buttons">
          
          {/* --- THÊM NÚT ORDERS TẠI ĐÂY --- */}
          <button 
            className="nav-btn orders-btn" 
            onClick={handleViewOrders}
            title="Xem lịch sử đơn hàng"
          >
            📜 Đơn hàng
          </button>
          {/* ------------------------------- */}

          <div
            className="cart-indicator clickable"
            onClick={() => setShowCartModal(true)}
            title="Xem chi tiết giỏ hàng"
          >
            🛒 Giỏ hàng: <strong>{cart.length}</strong> món (${totalCartPrice.toFixed(2)})
          </div>

          {currentUser && (
            <div className="user-profile-section">
              <div className="avatar-wrapper">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avt" className="user-avatar" />
                ) : (
                  <span className="default-avatar-icon">👤</span>
                )}
              </div>
              <span className="user-name">{displayName}</span>
            </div>
          )}
          
          <button className="nav-btn logout" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </header>

      <div className="main-content">
        <section className="burger-section">
          <h2 className="section-title">
            Đang làm chiếc bánh thứ #{cart.length + 1}
          </h2>
          <div className="burger-stack">
            <div className="bread top">Bread Top</div>
            {layers.length === 0 ? <p className="empty-msg"></p> : layers.map((l, i) => renderLayer(l, i))}
            <div className="bread bottom">Bread Bottom</div>
          </div>
          <div className="price-display">
            <span className="price-label">Giá bánh này:</span>
            <span className="price-amount">${currentBurgerPrice.toFixed(2)}</span>
          </div>
        </section>

        <section className="controls-section">
          <div className="controls-container">
            {(['salad', 'bacon', 'cheese', 'meat'] as const).map((type) => (
              <div key={type} className="control-item">
                <span className="ingredient-name">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                <div className="button-group">
                  <button className="control-btn less" onClick={() => removeIngredient(type)} disabled={counts[type] === 0}>Less</button>
                  <span className="quantity">{counts[type]}</span>
                  <button className="control-btn more" onClick={() => addIngredient(type)}>More</button>
                </div>
              </div>
            ))}
          </div>

          <div className="action-buttons">
            <button
              className="add-to-cart-btn"
              onClick={handleAddToOrder}
            >
              + Thêm món này vào đơn
            </button>
            <button
              className="checkout-button"
              onClick={handleCheckout}
            >
              Thanh toán ({cart.length} món)
            </button>
          </div>
        </section>
      </div>

      {/* --- SỬ DỤNG COMPONENT MODAL ĐÃ TÁCH --- */}
      {showCartModal && (
        <CartModal
          cart={cart}
          totalPrice={totalCartPrice}
          onClose={() => setShowCartModal(false)}
          onRemoveItem={handleRemoveFromCart}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
}