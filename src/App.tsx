// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';

import Auth from './components/Auth';
import BurgerBuilder from './components/BurgerBuilder';
import Checkout from './components/Checkout';
import Orders from './components/Orders'; // Nếu có

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập từ Firebase
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Hiển thị loading cho đến khi Firebase xác nhận (tránh race condition)
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #fff7ed, #ffe4c9)',
        fontSize: '1.5rem',
        color: '#ea580c',
      }}>
        Đang tải ứng dụng...
      </div>
    );
  }

  return (
    <Routes>
      {/* Trang Auth - ai cũng vào được */}
      <Route path="/auth" element={<Auth />} />

      {/* Trang chính (Burger Builder) - chỉ hiện khi đã login */}
      <Route
        path="/"
        element={user ? <BurgerBuilder /> : <Navigate to="/auth" replace />}
      />

      {/* Checkout - chỉ hiện khi đã login */}
      <Route
        path="/checkout"
        element={user ? <Checkout /> : <Navigate to="/auth" replace />}
      />

      {/* Orders - chỉ hiện khi đã login (uncomment khi sẵn sàng) */}
      {/* <Route
        path="/orders"
        element={user ? <Orders /> : <Navigate to="/auth" replace />}
      /> */}

      {/* Mọi route lạ → redirect về Auth nếu chưa login, hoặc Builder nếu đã login */}
      <Route path="*" element={<Navigate to={user ? '/' : '/auth'} replace />} />
    </Routes>
  );
}

export default App;