// src/containers/Orders.tsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import './Orders.css';

// Cập nhật Interface đầy đủ hơn
interface OrderData {
  id: string;
  orderData?: {
    ingredients: Record<string, number>;
    totalPrice: number;
  };
  ingredients?: Record<string, number>; // fallback cũ
  totalPrice?: number; // fallback cũ
  
  createdAt: any;
  status?: string; // pending, shipping, etc.
  contact?: {
    name: string;
    email: string;
    address: string;
    phone: string;
    note?: string;
  };
}

export default function Orders() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  
  // --- STATE MỚI CHO SEARCH & MODAL ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        let name = user.displayName;
        if (!name && user.email) {
          const prefix = user.email.split('@')[0];
          name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        }
        setDisplayName(name || 'Người dùng');

        try {
          const ordersRef = collection(db, 'orders');
          const q = query(
            ordersRef,
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );

          const querySnapshot = await getDocs(q);
          const orderList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as OrderData[];

          setOrders(orderList);
        } catch (error) {
          console.error('Error fetching orders:', error);
        } finally {
          setLoading(false);
        }

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

  // --- LOGIC TÌM KIẾM ---
  // Dùng useMemo để tối ưu, chỉ lọc lại khi search term hoặc danh sách orders thay đổi
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const term = searchTerm.toLowerCase();
      
      // 1. Tìm theo ID (lấy 5 ký tự cuối hoặc full id)
      const matchId = order.id.toLowerCase().includes(term);

      // 2. Tìm theo tên nguyên liệu
      const ingredients = order.orderData?.ingredients || order.ingredients || {};
      const matchIngredient = Object.keys(ingredients).some(ing => 
        ing.toLowerCase().includes(term)
      );

      return matchId || matchIngredient;
    });
  }, [orders, searchTerm]);

  // --- HELPER RENDERS ---
  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString('vi-VN');
  };

  if (loading) return <div className="loading">Đang tải danh sách đơn hàng...</div>;

  return (
    <div className="orders-container">
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
          <button className="active">Orders</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="content">
        <h1>Your Orders</h1>

        {/* --- THANH TÌM KIẾM --- */}
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Tìm theo Mã đơn hoặc tên bánh..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {orders.length === 0 ? (
          <div className="no-orders">
            <p>Bạn chưa có đơn hàng nào.</p>
            <button className="order-now-btn" onClick={() => navigate('/')}>
              Đặt món ngay
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
           <div className="no-orders">
            <p>Không tìm thấy đơn hàng nào khớp với từ khóa "{searchTerm}"</p>
           </div>
        ) : (
          <div className="table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Ingredients</th>
                  <th>Total Price</th>
                  <th>Date</th>
                  <th>Action</th> {/* Cột mới */}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const ingredients = order.orderData?.ingredients || order.ingredients || {};
                  const price = order.orderData?.totalPrice || order.totalPrice || 0;

                  return (
                    <tr key={order.id}>
                      <td className="order-id">#{order.id.slice(-5).toUpperCase()}</td>
                      
                      <td className="ingredients-cell">
                        {Object.entries(ingredients).map(([ing, count]) => (
                          <span key={ing} className="ingredient-tag">
                            {ing.charAt(0).toUpperCase() + ing.slice(1)} ({count})
                          </span>
                        ))}
                      </td>

                      <td className="price-cell">${price.toFixed(2)}</td>
                      
                      <td className="date-cell">{formatDate(order.createdAt)}</td>

                      {/* Nút xem chi tiết */}
                      <td className="action-cell">
                        <button 
                          className="view-btn"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL XEM CHI TIẾT --- */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết đơn hàng</h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="info-group">
                <label>Mã đơn hàng:</label>
                <strong>#{selectedOrder.id.toUpperCase()}</strong>
              </div>
              
              <div className="info-group">
                <label>Ngày đặt:</label>
                <span>{formatDate(selectedOrder.createdAt)}</span>
              </div>

              <div className="info-group">
                <label>Trạng thái:</label>
                <span className={`status-badge ${selectedOrder.status || 'pending'}`}>
                  {(selectedOrder.status || 'Pending').toUpperCase()}
                </span>
              </div>

              <hr />

              <h3>Thông tin giao hàng</h3>
              <p><strong>Người nhận:</strong> {selectedOrder.contact?.name}</p>
              <p><strong>SĐT:</strong> {selectedOrder.contact?.phone}</p>
              <p><strong>Địa chỉ:</strong> {selectedOrder.contact?.address}</p>
              {selectedOrder.contact?.note && (
                 <p><strong>Ghi chú:</strong> <em style={{color: '#666'}}>{selectedOrder.contact.note}</em></p>
              )}

              <hr />

              <h3>Thành phần bánh</h3>
              <ul className="ingredient-list">
                {Object.entries(selectedOrder.orderData?.ingredients || selectedOrder.ingredients || {}).map(([ing, count]) => (
                  <li key={ing}>
                    <span className="ing-name">{ing.toUpperCase()}</span>
                    <span className="ing-qty">x{count}</span>
                  </li>
                ))}
              </ul>

              <div className="total-price-highlight">
                Tổng cộng: ${(selectedOrder.orderData?.totalPrice || selectedOrder.totalPrice || 0).toFixed(2)}
              </div>
            </div>

            <div className="modal-footer">
               <button className="close-modal-btn" onClick={() => setSelectedOrder(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}