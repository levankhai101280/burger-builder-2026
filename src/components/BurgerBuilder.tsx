// src/components/BurgerBuilder.tsx (đã fix layer hiển thị đúng)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import './BurgerBuilder.css';

export default function BurgerBuilder() {
  const [ingredients, setIngredients] = useState({
    salad: 0,
    bacon: 0,
    cheese: 0,
    meat: 0,
  });

  const prices = {
    salad: 0.5,
    bacon: 0.7,
    cheese: 0.4,
    meat: 1.3,
  };

  const basePrice = 0.0;
  const totalPrice = basePrice +
    ingredients.salad * prices.salad +
    ingredients.bacon * prices.bacon +
    ingredients.cheese * prices.cheese +
    ingredients.meat * prices.meat;

  const addIngredient = (type: keyof typeof ingredients) => {
    setIngredients(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const removeIngredient = (type: keyof typeof ingredients) => {
    setIngredients(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] - 1),
    }));
  };

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Có lỗi khi đăng xuất');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout', { state: { ingredients, totalPrice } });
  };

  return (
    <div className="burger-builder">
      {/* Navbar */}
      <header className="navbar">
        <h1 className="navbar-title">Burger Builder</h1>
        <div className="navbar-buttons">
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
        {/* Burger Visualization */}
        <section className="burger-section">
          <h2 className="section-title">Your Burger</h2>
          <div className="burger-stack">
            <div className="bread top">Bread Top</div>

            {/* Render layer an toàn, luôn hiển thị đúng số lượng */}
            {Array.from({ length: ingredients.salad }).map((_, i) => (
              <div key={`salad-${i}`} className="layer salad">salad</div>
            ))}

            {Array.from({ length: ingredients.bacon }).map((_, i) => (
              <div key={`bacon-${i}`} className="layer bacon">bacon</div>
            ))}

            {Array.from({ length: ingredients.cheese }).map((_, i) => (
              <div key={`cheese-${i}`} className="layer cheese">cheese</div>
            ))}

            {Array.from({ length: ingredients.meat }).map((_, i) => (
              <div key={`meat-${i}`} className="layer meat">meat</div>
            ))}

            <div className="bread bottom">Bread Bottom</div>
          </div>

          <div className="price-display">
            <span className="price-amount">${totalPrice.toFixed(2)}</span>
            <span className="price-label">Total Price</span>
          </div>
        </section>

        {/* Controls */}
        <section className="controls-section">
          <h2 className="section-title">Build Your Burger</h2>

          <div className="controls-grid">
            {(['salad', 'bacon', 'cheese', 'meat'] as const).map(type => (
              <div key={type} className="control-item">
                <span className="ingredient-name">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>

                <div className="button-group">
                  <button
                    className="control-btn less"
                    onClick={() => removeIngredient(type)}
                    disabled={ingredients[type] === 0}
                  >
                    Less
                  </button>

                  <span className="quantity">{ingredients[type]}</span>

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

          <button className="checkout-button" onClick={handleCheckout}>
            Checkout
          </button>
        </section>
      </div>
    </div>
  );
}