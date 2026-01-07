// CartModal.tsx
import React from 'react';
import type { BurgerOrder, Layer } from '../types'; // Import từ file types
import { toast } from 'react-toastify';
import "./CartModal.css";

interface CartModalProps {
  cart: BurgerOrder[];
  totalPrice: number;
  onClose: () => void;
  onRemoveItem: (id: number) => void;
  onCheckout: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ 
  cart, 
  totalPrice, 
  onClose, 
  onRemoveItem, 
  onCheckout 
}) => {

  // Helper hiển thị tóm tắt nguyên liệu (được chuyển từ file cũ sang đây)
  const getIngredientSummary = (itemLayers: Layer[]) => {
    const summary: Record<string, number> = {};
    itemLayers.forEach(l => {
      summary[l.type] = (summary[l.type] || 0) + 1;
    });
    return Object.entries(summary)
      .map(([key, count]) => `${key} x${count}`)
      .join(', ');
  };

  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      toast.error('Giỏ hàng trống!');
      return;
    }
    onClose(); // Đóng modal trước
    onCheckout(); // Chuyển trang
  };

  return (
    <div className="cart-modal-overlay" onClick={onClose}>
      <div className="cart-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="cart-modal-header">
          <h3>Giỏ hàng của bạn</h3>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>

        <div className="cart-modal-body">
          {cart.length === 0 ? (
            <p className="empty-cart-text">Giỏ hàng đang trống.</p>
          ) : (
            <ul className="cart-items-list">
              {cart.map((item, index) => (
                <li key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <strong>Bánh #{index + 1}</strong>
                    <span className="cart-item-ingredients">
                      {getIngredientSummary(item.layers)}
                    </span>
                  </div>
                  <div className="cart-item-actions">
                    <span className="cart-item-price">${item.price.toFixed(2)}</span>
                    <button
                      className="delete-item-btn"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="cart-modal-footer">
          <div className="cart-total">
            Tổng cộng: <strong>${totalPrice.toFixed(2)}</strong>
          </div>
          <button
            className="modal-checkout-btn"
            onClick={handleCheckoutClick}
            // Nút luôn sáng để bấm vào hiện thông báo lỗi nếu rỗng
          >
            Tiến hành thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;