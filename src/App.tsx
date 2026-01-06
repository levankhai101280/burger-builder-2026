// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';

import Auth from './components/Auth';
import BurgerBuilder from './components/BurgerBuilder';
import Checkout from './components/Checkout';
import Orders from './components/Orders'; // Nếu có
import PublicRoute from './routes/public';
import PrivateRoute from './routes/PrivateRoute';

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
      <Route element={<PublicRoute user={user} />}>
        <Route path="/auth" element={<Auth />} />
      </Route>
      
      <Route element={<PrivateRoute user={user} />}>
        <Route path="/" element={<BurgerBuilder/>}/>

        <Route path="/checkout" element={<Checkout/>}/>

        <Route path="/orders" element={<Orders/>}/>

        <Route path="*" element={<Navigate to={user ? '/' : '/auth'} replace />} />
      </Route>
    </Routes>
  );
}

export default App;