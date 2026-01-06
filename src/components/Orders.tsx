import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import './Orders.css';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const navigate = useNavigate();

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

  useEffect(() => {
    const fetchOrders = async () => {
      if (!auth.currentUser) {
        navigate('/auth');
        return;
      }

      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const orderList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(orderList);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  if (loading) return <div className="loading">Đang tải danh sách đơn hàng...</div>;

  return (
    <div className="orders-container">
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
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="content">
        <h1>Orders</h1>

        {orders.length === 0 ? (
          <p className="no-orders">Bạn chưa có đơn hàng nào.</p>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Ingredients</th>
                <th>Price</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>
                    {Object.entries(order.ingredients || {})
                      .map(([ing, count]: [string, any]) => `${ing}(${count})`)
                      .join(', ')}
                  </td>
                  <td>${order.totalPrice?.toFixed(2) || '0.00'}</td>
                  <td>
                    {order.createdAt
                      ? new Date(order.createdAt.seconds * 1000).toLocaleString()
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}