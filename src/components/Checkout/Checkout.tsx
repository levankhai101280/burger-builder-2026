// src/containers/Checkout.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, db } from '../../services/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import PhoneInputDefault from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// --- LEAFLET MAP IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix lỗi icon marker mặc định của Leaflet khi dùng với Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
// ---------------------------

const PhoneInput = (PhoneInputDefault as any).default || PhoneInputDefault;

import './Checkout.css';

// --- TYPES ---
type IngredientType = 'salad' | 'bacon' | 'cheese' | 'meat';

interface Layer {
  type: IngredientType;
}

interface BurgerItem {
  id: number;
  layers: Layer[];
  price: number;
}

// --- SUB COMPONENT: MAP UPDATER ---
// Component này có nhiệm vụ di chuyển bản đồ khi tọa độ thay đổi
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 16, { duration: 1.5 }); // Hiệu ứng bay mượt mà
  }, [center, map]);
  return null;
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart = [], totalPrice = 0 } = location.state || {};

  // State
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  
  // Map State: Mặc định là Hà Nội (Hoặc TP.HCM tùy bạn chỉnh)
  const [mapPosition, setMapPosition] = useState<[number, number]>([21.0285, 105.8542]); 
  const [isSearchingMap, setIsSearchingMap] = useState(false);

  const [contact, setContact] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    note: '',
  });

  // --- LOGIC AUTH & REDIRECT ---
  useEffect(() => {
    if (!location.state || !cart || cart.length === 0) {
      navigate('/', { replace: true });
    }
  }, [location, cart, navigate]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        let name = user.displayName;
        if (!name && user.email) {
          const prefix = user.email.split('@')[0];
          name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        }
        setDisplayName(name || 'Khách hàng');
        setContact(prev => ({ ...prev, email: user.email || '' }));
      } else {
        toast.error("Vui lòng đăng nhập để tiếp tục");
        navigate('/auth', { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // --- LOGIC TÌM ĐỊA CHỈ TRÊN BẢN ĐỒ (Geocoding) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (contact.address.length > 5) { // Chỉ tìm khi nhập > 5 ký tự
        setIsSearchingMap(true);
        try {
            // Sử dụng Nominatim API của OpenStreetMap (Miễn phí)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(contact.address)}&limit=1`
            );
            const data = await response.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setMapPosition([lat, lon]);
            }
        } catch (error) {
            console.error("Lỗi tìm địa chỉ bản đồ:", error);
        } finally {
            setIsSearchingMap(false);
        }
      }
    }, 1500); // Đợi 1.5s sau khi ngừng gõ mới tìm kiếm để tránh spam API

    return () => clearTimeout(delayDebounceFn);
  }, [contact.address]);

  // --- HANDLERS ---
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContact((prev) => ({ ...prev, [name]: value }));
  };

  const handleOrder = async () => {
    if (!contact.name.trim() || !contact.address.trim()) {
      toast.warn('Vui lòng điền đầy đủ Tên và Địa chỉ!');
      return;
    }
    if (!contact.phone || contact.phone.length < 9) {
      toast.warn('Số điện thoại không hợp lệ!');
      return;
    }

    setLoading(true);

    try {
      const orderDataToSave = {
          cartItems: cart.map((item: BurgerItem) => {
              const ingredientsSummary = item.layers.reduce((acc: any, layer: Layer) => {
                acc[layer.type] = (acc[layer.type] || 0) + 1;
                return acc;
              }, {});
              
              return {
                  price: item.price,
                  ingredients: ingredientsSummary,
                  layers: item.layers 
              };
          }),
          totalPrice: totalPrice,
          totalItems: cart.length
      };

      await addDoc(collection(db, 'orders'), {
        userId: currentUser?.uid,
        orderData: orderDataToSave,
        contact: {
            ...contact,
            phone: '+' + contact.phone,
            location: { lat: mapPosition[0], lng: mapPosition[1] } // Lưu cả tọa độ
        },
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast.success('Đặt hàng thành công!');
      setTimeout(() => {
        navigate('/orders');
      }, 2000);

    } catch (error) {
      console.error('Lỗi:', error);
      toast.error('Có lỗi xảy ra: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <ToastContainer position="top-right" theme="colored" autoClose={3000} />
      
      {/* Header đơn giản */}
      <header className="checkout-header">
        <div className="container">
            <h2 className="logo" onClick={() => navigate('/')}>BurgerBuilder</h2>
            <div className="user-info">
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
                <button className="btn-logout" onClick={handleLogout}>Đăng xuất</button>
            </div>
        </div>
      </header>

      <div className="container checkout-content">
        <div className="checkout-grid">
            
            {/* CỘT TRÁI: THÔNG TIN GIAO HÀNG */}
            <div className="card form-section">
                <h3>Thông tin giao hàng</h3>
                <div className="form-group">
                    <label>Họ và tên</label>
                    <input 
                        type="text" name="name" 
                        placeholder="VD: Nguyễn Văn A" 
                        value={contact.name} onChange={handleInputChange} 
                    />
                </div>

                <div className="form-group">
                    <label>Email (Đã xác thực)</label>
                    <input type="email" value={contact.email} disabled className="input-disabled" />
                </div>

                <div className="form-group">
                    <label>Số điện thoại</label>
                    <div className="phone-wrapper">
                        <PhoneInput 
                            country={'vn'} 
                            value={contact.phone} 
                            onChange={(val: string) => setContact(prev => ({...prev, phone: val}))}
                            inputStyle={{width: '100%', height: '45px', fontSize: '16px'}}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>
                        Địa chỉ nhận hàng 
                        {isSearchingMap && <span className="searching-text"> (Đang tìm vị trí...)</span>}
                    </label>
                    <input 
                        type="text" name="address" 
                        placeholder="VD: 123 Đường ABC, Quận X, TP.HCM" 
                        value={contact.address} onChange={handleInputChange} 
                        className={isSearchingMap ? 'input-loading' : ''}
                    />
                    <small className="hint-text">* Nhập địa chỉ cụ thể, bản đồ bên dưới sẽ tự động cập nhật.</small>
                </div>

                {/* BẢN ĐỒ LEAFLET */}
                <div className="map-container">
                    <MapContainer center={mapPosition} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={mapPosition}>
                            <Popup>
                                Vị trí giao hàng dự kiến <br /> {contact.address || "Tại đây"}
                            </Popup>
                        </Marker>
                        <MapUpdater center={mapPosition} />
                    </MapContainer>
                </div>

                <div className="form-group">
                    <label>Ghi chú cho Shipper</label>
                    <textarea 
                        name="note" rows={2} 
                        placeholder="VD: Gọi trước khi giao, không cay..." 
                        value={contact.note} onChange={handleInputChange}
                    />
                </div>
            </div>

            {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
            <div className="card summary-section">
                <h3>Đơn hàng của bạn</h3>
                <div className="order-items-scroll">
                    {cart.map((item: BurgerItem, index: number) => (
                        <div key={index} className="order-item">
                            <div className="item-details">
                                <h4>Burger Tùy Chọn #{index + 1}</h4>
                                <p className="ingredients-list">
                                    {item.layers.map(l => l.type).join(' • ')}
                                </p>
                            </div>
                            <div className="item-price">${item.price.toFixed(2)}</div>
                        </div>
                    ))}
                </div>

                <div className="price-breakdown">
                    <div className="row">
                        <span>Tạm tính ({cart.length} món)</span>
                        <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="row">
                        <span>Phí giao hàng</span>
                        <span>$0.00 (Free)</span>
                    </div>
                    <div className="divider"></div>
                    <div className="row total">
                        <span>Tổng thanh toán</span>
                        <span className="highlight">${totalPrice.toFixed(2)}</span>
                    </div>
                </div>

                <button 
                    className="btn-checkout" 
                    onClick={handleOrder} 
                    disabled={loading}
                >
                    {loading ? <span className="loader"></span> : 'XÁC NHẬN ĐẶT HÀNG'}
                </button>
                <button className="btn-back" onClick={() => navigate('/')}>
                    Quay lại chỉnh sửa
                </button>
            </div>

        </div>
      </div>
    </div>
  );
}