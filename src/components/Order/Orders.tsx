// src/containers/Orders.tsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import './Orders.css';

interface OrderData {
  id: string;
  // Hỗ trợ cấu trúc dữ liệu mới (Multi-burger)
  orderData?: {
    cartItems?: any[]; // Mảng chứa các bánh
    totalPrice: number;
    totalItems?: number;
    // Fallback cho dữ liệu cũ
    ingredients?: Record<string, number>;
  };
  // Fallback cho dữ liệu cũ (root level)
  ingredients?: Record<string, number>;
  totalPrice?: number;
  
  createdAt: any;
  status?: string;
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

  // Logic Search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const term = searchTerm.toLowerCase();
      const matchId = order.id.toLowerCase().includes(term);
      return matchId; 
    });
  }, [orders, searchTerm]);

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString('vi-VN');
  };

  // Helper để lấy tổng tiền an toàn
  const getOrderPrice = (order: OrderData) => {
      return order.orderData?.totalPrice || order.totalPrice || 0;
  }

  // Helper để lấy số lượng bánh
  const getOrderCount = (order: OrderData) => {
      if (order.orderData?.totalItems) return order.orderData.totalItems;
      if (order.orderData?.cartItems) return order.orderData.cartItems.length;
      return 1; // Mặc định đơn cũ là 1 cái
  }

  if (loading) return <div className="loading">Đang tải danh sách đơn hàng...</div>;

  return (
    <div className="orders-container">
      <nav className="navbar">
        <span className="brand" onClick={() => navigate('/')}>BurgerBuilder</span>
        <div className="nav-links">
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
          <button onClick={handleLogout}>Đăng xuất</button>
        </div>
      </nav>

      <div className="content">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Tìm theo Mã đơn hàng..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredOrders.length === 0 ? (
           <div className="no-orders"><p>Không tìm thấy đơn hàng nào.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Số lượng</th>
                  <th>Giá Bánh</th>
                  <th>Ngày</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-id">#{order.id.slice(-5).toUpperCase()}</td>
                      
                      <td className="ingredients-cell">
                        <strong>{getOrderCount(order)} bánh</strong>
                      </td>

                      <td className="price-cell">${getOrderPrice(order).toFixed(2)}</td>
                      <td className="date-cell">{formatDate(order.createdAt)}</td>
                      <td className="action-cell">
                        <button className="view-btn" onClick={() => setSelectedOrder(order)}>Chi tiết</button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL CHI TIẾT ĐƠN HÀNG (ĐÃ CẬP NHẬT MULTI-BURGER) --- */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết đơn hàng #{selectedOrder.id.slice(-5).toUpperCase()}</h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="info-section">
                  <p><strong>Ngày đặt:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  <p><strong>Trạng thái:</strong> <span className="status-badge">{selectedOrder.status || 'Pending'}</span></p>
                  <p><strong>Địa chỉ:</strong> {selectedOrder.contact?.address}</p>
                  <p><strong>SĐT:</strong> {selectedOrder.contact?.phone}</p>
              </div>

              <hr />

              <h3>Danh sách món ăn</h3>
              <div className="order-items-list">
                  {/* Trường hợp: Đơn hàng MỚI (nhiều bánh) */}
                  {selectedOrder.orderData?.cartItems ? (
                      selectedOrder.orderData.cartItems.map((item, idx) => (
                          <div key={idx} className="order-item-detail">
                              <div className="item-title">
                                  <strong>Bánh #{idx + 1}</strong>
                                  <span>${item.price.toFixed(2)}</span>
                              </div>
                              <ul className="ingredient-list">
                                  {Object.entries(item.ingredients || {}).map(([ing, count]) => (
                                      <li key={ing}>{ing}: {String(count)}</li>
                                  ))}
                              </ul>
                          </div>
                      ))
                  ) : (
                      /* Trường hợp: Đơn hàng CŨ (1 bánh) */
                      <div className="order-item-detail">
                          <div className="item-title"><strong>Burger cơ bản</strong></div>
                          <ul className="ingredient-list">
                              {Object.entries(selectedOrder.orderData?.ingredients || selectedOrder.ingredients || {}).map(([ing, count]) => (
                                  <li key={ing}>{ing}: {String(count)}</li>
                              ))}
                          </ul>
                      </div>
                  )}
              </div>

              <div className="total-price-highlight">
                Tổng cộng: ${getOrderPrice(selectedOrder).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}