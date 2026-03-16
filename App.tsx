import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Product, SectorInfo, User, ServiceBooking, CartItem, ServicePageContent, ServiceImage, ServiceVideo, PaymentGateway, Order, EmailSettings, ChatSettings } from './types';
import { BRAND_NAME as INITIAL_BRAND_NAME, SECTORS as INITIAL_SECTORS, ADDRESS as INITIAL_ADDRESS, PHONE as INITIAL_PHONE, OWNER_NAME } from './constants';
import { getAIResponse } from './services/geminiService';

// --- Types ---
interface SiteConfig {
  brandName: string;
  phone: string;
  address: string;
  heroTagline: string;
  logo?: string;
  favicon?: string;
  socials?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
}

// --- Constants for Services List ---
const SERVICE_LISTS: Record<string, string[]> = {
  'Construction': ['Residential Building', 'Commercial Complex', 'Road Construction', 'Renovation', 'Civil Engineering'],
  'Logistics': ['Haulage', 'International Freight', 'Last Mile Delivery', 'Warehousing', 'Supply Chain Management'],
  'Fashion': ['Bespoke Tailoring', 'Ready to Wear', 'Fabric Sales', 'Fashion Consultation'],
  'Wholesale': ['Bulk Purchase', 'Distribution Partnership', 'Retail Supply'],
  'Cleaning': ['Residential Cleaning', 'Office Cleaning', 'Post-Construction Cleaning', 'Industrial Cleaning'],
  'General Trading': ['Import Services', 'Export Services', 'Commodities Trading', 'Procurement']
};

// --- Components ---

const Navbar = ({ user, cartCount, openCart, config, theme, toggleTheme, onLogout }: { user: User | null; cartCount: number; openCart: () => void; config: SiteConfig; theme: 'light' | 'dark'; toggleTheme: () => void; onLogout: () => void; }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
  <nav className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50 border-b dark:border-slate-800 transition-colors duration-300">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-20 items-center">
        <Link to="/" className="text-2xl font-black text-indigo-950 dark:text-indigo-100 tracking-tighter flex items-center gap-2">
          {config.logo ? (
            <img src={config.logo} alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
          ) : (
            <div className="w-10 h-10 bg-indigo-900 dark:bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xs">MS</div>
          )}
          <span className="hidden sm:inline">{config.brandName.split(' ')[0]}</span>
          <span className="sm:hidden">{config.brandName.substring(0, 3)}</span>
        </Link>
        <div className="hidden md:flex space-x-10 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Home</Link>
          <Link to="/products" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Marketplace</Link>
          <Link to="/services" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Services</Link>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-900 dark:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-slate-700 transition">
             <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          
          {user && (
            <Link to="/wishlist" className="relative p-2 text-indigo-950 dark:text-indigo-100 hover:text-pink-600 dark:hover:text-pink-400 transition hidden md:block">
              <i className="fas fa-heart text-xl"></i>
              {user.wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white dark:border-slate-900">{user.wishlist.length}</span>}
            </Link>
          )}

          <button onClick={openCart} className="relative p-2 text-indigo-950 dark:text-indigo-100">
            <i className="fas fa-shopping-bag text-xl"></i>
            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white dark:border-slate-900">{cartCount}</span>}
          </button>
          {user ? (
            <div className="flex items-center gap-4">
              <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-900 dark:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-slate-700 transition border border-indigo-100 dark:border-slate-700 hidden md:flex">
                <i className="fas fa-user-circle text-xl"></i>
              </Link>
              <button onClick={onLogout} className="text-xs font-bold text-red-500 hover:text-red-700 transition hidden md:block">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="text-xs font-black uppercase tracking-widest bg-indigo-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-800 dark:hover:bg-indigo-500 transition hidden md:block">Login</Link>
          )}
          
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-900 dark:text-indigo-200">
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>
    </div>

    {isMobileMenuOpen && (
      <div className="md:hidden bg-white dark:bg-slate-900 border-t dark:border-slate-800 p-6 space-y-6 animate-fade-in absolute w-full shadow-xl z-50">
         <div className="space-y-4">
           <Link to="/" className="block text-lg font-black text-indigo-950 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
           <Link to="/products" className="block text-lg font-black text-indigo-950 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>Marketplace</Link>
           <Link to="/services" className="block text-lg font-black text-indigo-950 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>Services</Link>
         </div>
         <div className="pt-6 border-t dark:border-slate-800 space-y-4">
            {user ? (
              <>
                <Link to="/wishlist" className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300" onClick={() => setIsMobileMenuOpen(false)}>
                  <i className="fas fa-heart text-pink-500"></i> Wishlist ({user.wishlist.length})
                </Link>
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300" onClick={() => setIsMobileMenuOpen(false)}>
                  <i className="fas fa-user-circle"></i> Dashboard
                </Link>
                <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 text-sm font-bold text-red-500">
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="block w-full text-center py-3 bg-indigo-900 text-white rounded-xl font-bold" onClick={() => setIsMobileMenuOpen(false)}>Login / Sign Up</Link>
            )}
         </div>
      </div>
    )}
  </nav>
  );
};

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button 
      onClick={scrollToTop} 
      className="fixed bottom-24 left-6 z-40 w-12 h-12 bg-indigo-950 dark:bg-white text-white dark:text-indigo-950 rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-800 dark:hover:bg-slate-200 transition animate-slide-in-up"
      title="Scroll to Top"
    >
      <i className="fas fa-arrow-up"></i>
    </button>
  );
};

const ChatWidget = ({ settings }: { settings: ChatSettings }) => {
  useEffect(() => {
    if (settings.enabled && settings.provider === 'custom' && settings.customScript) {
      try {
        const scriptId = 'msdw-custom-chat-script';
        if (!document.getElementById(scriptId)) {
           const range = document.createRange();
           const fragment = range.createContextualFragment(settings.customScript);
           document.body.appendChild(fragment);
        }
      } catch (e) {
        console.error("Failed to inject chat script", e);
      }
    }
  }, [settings]);

  if (!settings.enabled) return null;

  if (settings.provider === 'custom') return null;

  return (
    <Link 
      to="/chat"
      className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:bg-indigo-700 transition hover:scale-110 duration-300"
    >
      <i className="fas fa-comments"></i>
    </Link>
  );
};

const CartDrawer = ({ isOpen, onClose, cart, updateQuantity, checkout, paymentGateways, siteConfig }: { 
  isOpen: boolean; 
  onClose: () => void; 
  cart: CartItem[]; 
  updateQuantity: (id: string, delta: number) => void;
  checkout: (orderData: Partial<Order>) => Promise<void>;
  paymentGateways: PaymentGateway[];
  siteConfig: SiteConfig;
}) => {
  const navigate = useNavigate();
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [customerDetails, setCustomerDetails] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => {
    const active = paymentGateways.filter(g => g.isActive);
    if (active.length > 0 && !selectedGateway) {
      setSelectedGateway(active[0].id);
    }
  }, [paymentGateways, isOpen]);

  if (!isOpen) return null;
  
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = deliveryMethod === 'delivery' ? 2500 : 0; 
  const total = subtotal + deliveryFee;
  const activeGateways = paymentGateways.filter(g => g.isActive);
  const selectedGatewayObj = paymentGateways.find(g => g.id === selectedGateway);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => setPaymentProof(ev.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCheckoutProcess = async () => {
    if (!customerDetails.name || !customerDetails.email || (deliveryMethod === 'delivery' && !customerDetails.address)) {
      alert("Please fill in all required contact and delivery details.");
      return;
    }

    if (selectedGatewayObj?.type === 'bank_transfer' && !paymentProof) {
      alert("Please upload proof of payment for verification.");
      return;
    }

    setIsProcessing(true);

    const finishCheckout = async (data: any) => {
      await checkout(data);
      setIsProcessing(false);
      setPaymentProof(null);
      setCustomerDetails({ name: '', email: '', phone: '', address: '' });
      navigate('/dashboard');
    };

    if (selectedGatewayObj?.type === 'bank_transfer') {
      setTimeout(() => {
        finishCheckout({
          items: cart,
          subtotal,
          deliveryFee,
          total,
          deliveryMethod,
          paymentMethod: 'bank_transfer',
          paymentStatus: 'Verifying',
          paymentProof: paymentProof || undefined,
          orderStatus: 'Processing',
          customer: customerDetails
        });
      }, 3000); 
    } else {
      await finishCheckout({
         items: cart,
         subtotal,
         deliveryFee,
         total,
         deliveryMethod,
         paymentMethod: 'paystack',
         paymentStatus: 'Pending',
         orderStatus: 'Processing',
         customer: customerDetails
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in-right">
        
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur flex flex-col items-center justify-center">
             <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
             <h3 className="text-xl font-black text-indigo-950 dark:text-white">Processing Transaction...</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400">Verifying payment details</p>
          </div>
        )}

        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-indigo-950 text-white">
          <h2 className="text-xl font-black tracking-tight">Your Cart</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"><i className="fas fa-times"></i></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           {cart.length === 0 ? (
             <div className="text-center text-slate-400 mt-20">
               <i className="fas fa-shopping-basket text-6xl mb-4 opacity-20"></i>
               <p className="font-bold">Cart is empty</p>
             </div>
           ) : (
             <>
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex gap-4">
                      <div className="w-16 h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.product.image} className="w-full h-full object-cover" alt={item.product.name} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-indigo-950 dark:text-white text-sm line-clamp-1">{item.product.name}</h4>
                        <p className="text-xs font-black text-indigo-500 mb-1">₦{item.product.price.toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.product.id, -1)} className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 dark:text-white flex items-center justify-center text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700">-</button>
                          <span className="text-xs font-bold w-4 text-center dark:text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, 1)} className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 dark:text-white flex items-center justify-center text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700">+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                   <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Delivery Method</h4>
                   <div className="flex gap-2">
                      <button onClick={() => setDeliveryMethod('pickup')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${deliveryMethod === 'pickup' ? 'bg-indigo-900 text-white border-indigo-900' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}>Pickup (HQ)</button>
                      <button onClick={() => setDeliveryMethod('delivery')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${deliveryMethod === 'delivery' ? 'bg-indigo-900 text-white border-indigo-900' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}>Home Delivery</button>
                   </div>
                   {deliveryMethod === 'delivery' && (
                     <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-2 font-bold"><i className="fas fa-truck"></i> +₦2,500 Delivery Fee added</p>
                   )}
                </div>

                <div className="space-y-3">
                   <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Contact Details</h4>
                   <input placeholder="Full Name" className="w-full border dark:border-slate-700 p-2 rounded-lg text-sm font-bold bg-slate-50 dark:bg-slate-800 dark:text-white" value={customerDetails.name} onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})} />
                   <input placeholder="Email Address" className="w-full border dark:border-slate-700 p-2 rounded-lg text-sm font-bold bg-slate-50 dark:bg-slate-800 dark:text-white" value={customerDetails.email} onChange={e => setCustomerDetails({...customerDetails, email: e.target.value})} />
                   <input placeholder="Phone Number" className="w-full border dark:border-slate-700 p-2 rounded-lg text-sm font-bold bg-slate-50 dark:bg-slate-800 dark:text-white" value={customerDetails.phone} onChange={e => setCustomerDetails({...customerDetails, phone: e.target.value})} />
                   {deliveryMethod === 'delivery' && (
                     <textarea placeholder="Delivery Address" rows={2} className="w-full border dark:border-slate-700 p-2 rounded-lg text-sm font-bold bg-slate-50 dark:bg-slate-800 dark:text-white" value={customerDetails.address} onChange={e => setCustomerDetails({...customerDetails, address: e.target.value})} />
                   )}
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Payment Method</p>
                  {activeGateways.map(gw => (
                    <div key={gw.id}>
                      <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${selectedGateway === gw.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300'}`}>
                        <input type="radio" name="payment_gateway" value={gw.id} checked={selectedGateway === gw.id} onChange={() => setSelectedGateway(gw.id)} className="text-indigo-600" />
                        <span className="font-bold text-indigo-950 dark:text-white text-sm">{gw.name}</span>
                        {gw.type === 'paystack' && <i className="fas fa-credit-card ml-auto text-slate-400"></i>}
                        {gw.type === 'bank_transfer' && <i className="fas fa-university ml-auto text-slate-400"></i>}
                      </label>
                      
                      {selectedGateway === gw.id && gw.type === 'bank_transfer' && (
                        <div className="mt-2 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50 rounded-xl space-y-3 animate-fade-in">
                           <div className="text-xs text-orange-800 dark:text-orange-200">
                             <p className="font-bold">Bank: {gw.config.bankName}</p>
                             <p className="font-bold">Acc: {gw.config.accountNumber}</p>
                             <p className="font-bold">Name: {gw.config.accountName || siteConfig.brandName}</p>
                           </div>
                           <div>
                             <label className="block text-[10px] font-black uppercase text-orange-400 mb-1">Upload Proof of Payment</label>
                             <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200" />
                           </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
             </>
           )}
        </div>
        
        {cart.length > 0 && (
          <div className="p-6 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Subtotal</span>
              <span className="text-sm font-bold text-indigo-950 dark:text-white">₦{subtotal.toLocaleString()}</span>
            </div>
            {deliveryMethod === 'delivery' && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Delivery Fee</span>
                <span className="text-sm font-bold text-indigo-950 dark:text-white">₦{deliveryFee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center mb-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-sm font-black text-indigo-950 dark:text-white uppercase tracking-widest">Total</span>
              <span className="text-2xl font-black text-indigo-950 dark:text-white">₦{total.toLocaleString()}</span>
            </div>

            <button onClick={handleCheckoutProcess} disabled={activeGateways.length === 0 || isProcessing} className="w-full bg-green-600 text-white py-4 rounded-xl font-black shadow-lg shadow-green-600/20 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
              {isProcessing ? 'Processing...' : 'Secure Checkout'}
              {!isProcessing && <i className="fas fa-lock text-xs"></i>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ShuffleBanner = ({ servicePages, sectors }: { servicePages: Record<string, ServicePageContent>; sectors: SectorInfo[] }) => {
  const [iteration, setIteration] = useState(0);
  
  const cards = useMemo(() => {
    return sectors.map(s => ({ ...s, content: servicePages[s.name] }));
  }, [servicePages, sectors]);

  useEffect(() => {
    const timer = setInterval(() => setIteration(i => i + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  const getTriplet = () => {
    if (cards.length === 0) return [];
    const start = (iteration * 1) % cards.length;
    return [
      cards[start % cards.length],
      cards[(start + 1) % cards.length],
      cards[(start + 2) % cards.length]
    ].filter(Boolean);
  };

  const triplet = getTriplet();

  return (
    <section className="relative h-[600px] md:h-[800px] bg-slate-950 overflow-hidden flex flex-col md:flex-row">
      {triplet.map((card, idx) => (
        <Link 
          key={`${card.name}-${iteration}-${idx}`}
          to={`/service/${card.name.replace(/\s+/g, '-').toLowerCase()}`}
          className={`relative flex-1 h-full overflow-hidden group transition-all duration-1000 ease-in-out border-r border-slate-800/30
            ${idx === 0 ? 'animate-slide-in-left' : idx === 1 ? 'animate-fade-in' : 'animate-slide-in-right'}`}
        >
          <img 
            src={card.content?.images[0]?.url || 'https://images.unsplash.com/photo-1541888941294-631c894c3046?auto=format&fit=crop&q=80&w=1200'} 
            className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-110" 
            alt={card.name} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
          <div className="absolute bottom-16 left-6 right-6 md:left-12 md:right-12 z-10 text-white">
             <span className={`inline-block px-4 py-1.5 rounded-full ${card.color} text-[10px] font-black uppercase tracking-widest mb-6 shadow-2xl`}>{card.name}</span>
             <h3 className="text-3xl md:text-5xl font-black mb-4 leading-tight tracking-tighter">{card.name === 'Construction' ? 'Building The Vision.' : card.name === 'Logistics' ? 'Moving Nations.' : 'Excellence Guaranteed.'}</h3>
             <p className="text-sm text-slate-300 line-clamp-2 max-w-sm mb-8 font-medium">Explore the MSD&W {card.name} portfolio and standard service delivery.</p>
             <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-all duration-300">
                <i className="fas fa-arrow-right"></i>
             </div>
          </div>
        </Link>
      ))}
    </section>
  );
};

const ServiceDetailPage = ({ servicePages }: { servicePages: Record<string, ServicePageContent> }) => {
    const { sectorSlug } = useParams<{ sectorSlug: string }>();
    // Simple mock logic to find sector name from slug
    const sectorName = Object.keys(servicePages).find(k => k.replace(/\s+/g, '-').toLowerCase() === sectorSlug);
    const content = sectorName ? servicePages[sectorName] : { description: "Service details coming soon.", images: [], videos: [] };
    
    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
             <h1 className="text-4xl font-black text-indigo-950 dark:text-white mb-6">{sectorName || 'Service'} Services</h1>
             <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border dark:border-slate-700 mb-12">
                 <p className="text-lg text-slate-600 dark:text-slate-300 whitespace-pre-line">{content.description}</p>
             </div>
             
             {content.images && content.images.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                     {content.images.map((img, idx) => (
                         <div key={idx} className="rounded-2xl overflow-hidden shadow-lg h-64 relative group">
                             <img src={img.url} alt="Service" className="w-full h-full object-cover" />
                             {img.story && <div className="absolute inset-0 bg-black/60 flex items-end p-6 opacity-0 group-hover:opacity-100 transition"><p className="text-white font-bold">{img.story}</p></div>}
                         </div>
                     ))}
                 </div>
             )}
             
             <div className="text-center">
                 <Link to="/services" state={{ preselected: sectorName }} className="inline-block bg-indigo-600 text-white px-10 py-4 rounded-xl font-black text-xl shadow-xl hover:bg-indigo-700 transition">Book {sectorName} Service</Link>
             </div>
        </div>
    )
}

const DynamicBookingFields = ({ sector, subService }: { sector: string; subService: string }) => {
  return (
      <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-2">Estimated Budget (₦)</label>
          <input name="budget" type="number" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white" placeholder="e.g. 50,000,000" />
        </div>
        <div>
           <label className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-2">Location / Address</label>
           <input name="location" type="text" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white" placeholder="Service Location" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-2">Specific Requirements for {subService}</label>
          <textarea name="specific_reqs" rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white" placeholder={`Describe your needs for ${subService}...`}></textarea>
        </div>
      </div>
  );
};

const ServiceBookingPage = ({ onBook, sectors }: { onBook: (booking: Partial<ServiceBooking>) => void; sectors: SectorInfo[] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const preselected = location.state?.preselected || 'Construction';
  const [selectedSector, setSelectedSector] = useState<string>(preselected);
  const [selectedSubService, setSelectedSubService] = useState<string>(SERVICE_LISTS[preselected]?.[0] || '');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Reset sub-service when sector changes
    if (SERVICE_LISTS[selectedSector]) {
      setSelectedSubService(SERVICE_LISTS[selectedSector][0]);
    } else {
      setSelectedSubService('');
    }
  }, [selectedSector]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const basicDetails = formData.get('details') as string;
    
    const dynamicData: string[] = [];
    formData.forEach((value, key) => {
       if (key !== 'details' && key !== 'sector' && key !== 'sub_service' && key !== 'name' && key !== 'date' && value) {
          dynamicData.push(`${key.replace('_', ' ').toUpperCase()}: ${value}`);
       }
    });

    const fullDetails = `Sub-Service: ${selectedSubService}\n\nGeneral: ${basicDetails}\n\nSpecs:\n${dynamicData.join('\n')}`;

    onBook({
      serviceType: selectedSector,
      subServiceType: selectedSubService,
      customerName: formData.get('name') as string,
      details: fullDetails,
      date: formData.get('date') as string,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-8"><i className="fas fa-check"></i></div>
        <h2 className="text-4xl font-black mb-4 dark:text-white">Request Logged.</h2>
        <button onClick={() => navigate('/')} className="inline-block bg-indigo-900 text-white px-10 py-4 rounded-2xl font-bold">Return Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 animate-fade-in">
       <div className="bg-white dark:bg-slate-900 p-6 md:p-12 rounded-3xl md:rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">Strategic Booking</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-12">Submit your requirements to our integrated planning team.</p>
          <form onSubmit={handleSubmit} className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <label className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-2">Target Sector</label>
                   <select 
                      name="sector" 
                      value={selectedSector}
                      onChange={(e) => setSelectedSector(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-2xl font-bold text-indigo-950 dark:text-white"
                   >
                      {sectors.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-2">Service Type</label>
                   <select 
                      name="sub_service" 
                      value={selectedSubService}
                      onChange={(e) => setSelectedSubService(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-2xl font-bold text-indigo-950 dark:text-white"
                   >
                      {SERVICE_LISTS[selectedSector]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                   </select>
                </div>
             </div>
             
             <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-6 flex items-center gap-2"><i className="fas fa-sliders-h"></i> {selectedSubService} Specifics</h4>
                <DynamicBookingFields sector={selectedSector} subService={selectedSubService} />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                  <label className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-2">Target Date</label>
                  <input name="date" type="date" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white" required />
               </div>
               <div>
                  <label className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-2">Requesting Entity</label>
                  <input name="name" type="text" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white" placeholder="Personal or Corporate Name" required />
               </div>
             </div>
             <div>
                <label className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-2">Additional Notes</label>
                <textarea name="details" rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white" placeholder="Any extra information..."></textarea>
             </div>
             <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20">Submit Formal Request</button>
          </form>
       </div>
    </div>
  );
};

const Marketplace = ({ products, addToCart, addToWishlist }: { products: Product[], addToCart: (p: Product) => void, addToWishlist: (id: string) => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-black text-indigo-950 dark:text-white mb-8">Marketplace</h2>
            <input className="w-full p-4 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white mb-8" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filtered.map(product => (
                    <div key={product.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 overflow-hidden group">
                        <div className="h-64 overflow-hidden relative">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                            <button onClick={() => addToWishlist(product.id)} className="absolute top-4 right-4 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-pink-500 hover:bg-pink-500 hover:text-white transition"><i className="fas fa-heart"></i></button>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-indigo-950 dark:text-white">{product.name}</h3>
                                <span className="bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md text-[10px] uppercase font-black">{product.category}</span>
                            </div>
                            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-4">₦{product.price.toLocaleString()}</p>
                            <button onClick={() => addToCart(product)} className="w-full bg-indigo-950 dark:bg-white dark:text-indigo-950 text-white py-3 rounded-xl font-bold hover:bg-indigo-800 dark:hover:bg-slate-200 transition">Add to Cart</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const WishlistPage = ({ user, products, addToCart, removeFromWishlist }: any) => {
    const wishItems = products.filter((p: Product) => user.wishlist.includes(p.id));
    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-black text-indigo-950 dark:text-white mb-8">My Wishlist</h2>
            {wishItems.length === 0 ? <p className="text-slate-500">Your wishlist is empty.</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                     {wishItems.map((product: Product) => (
                        <div key={product.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 p-6 relative">
                            <button onClick={() => removeFromWishlist(product.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><i className="fas fa-times"></i></button>
                            <img src={product.image} className="w-full h-48 object-cover rounded-xl mb-4" alt={product.name} />
                            <h3 className="font-bold text-indigo-950 dark:text-white mb-2">{product.name}</h3>
                            <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mb-4">₦{product.price.toLocaleString()}</p>
                            <button onClick={() => addToCart(product)} className="w-full bg-indigo-950 text-white py-2 rounded-lg font-bold">Add to Cart</button>
                        </div>
                     ))}
                </div>
            )}
        </div>
    )
}

const AuthPage = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'info@msdw.com' && password === 'admin') {
        onLogin({
            id: 'admin-1',
            name: 'System Admin',
            email,
            role: 'admin',
            wishlist: [],
            isVerified: true
        });
        navigate('/admin');
    } else if(email === 'client@example.com' && password === 'user') {
        onLogin({
            id: 'client-1',
            name: 'Client User',
            email,
            role: 'user',
            wishlist: [],
            isVerified: true
        });
        navigate('/dashboard');
    } else {
        alert("Invalid credentials. Try admin: info@msdw.com/admin or user: client@example.com/user");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-10 rounded-[2rem] shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-black text-indigo-900 dark:text-white">{isLogin ? 'Welcome Back' : 'Join MSD&W'}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Access your personalized dashboard</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {!isLogin && (
             <input type="text" required className="appearance-none rounded-xl relative block w-full px-4 py-4 border border-slate-300 dark:border-slate-700 placeholder-slate-500 text-slate-900 dark:text-white dark:bg-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-bold" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
          )}
          <input type="email" required className="appearance-none rounded-xl relative block w-full px-4 py-4 border border-slate-300 dark:border-slate-700 placeholder-slate-500 text-slate-900 dark:text-white dark:bg-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-bold" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" required className="appearance-none rounded-xl relative block w-full px-4 py-4 border border-slate-300 dark:border-slate-700 placeholder-slate-500 text-slate-900 dark:text-white dark:bg-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-bold" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          
          <button type="submit" className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-indigo-900 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <div className="text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-bold text-indigo-600 hover:text-indigo-500">
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserDashboard = ({ user, bookings, orders }: { user: User, bookings: ServiceBooking[], orders: Order[] }) => {
    const myBookings = bookings.filter(b => b.customerName === user.name);
    
    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-black text-indigo-950 dark:text-white mb-8">Welcome, {user.name}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-xl font-black mb-4 dark:text-white">My Service Requests</h2>
                    <div className="space-y-4">
                        {myBookings.map(b => (
                            <div key={b.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold dark:text-white">{b.serviceType}</span>
                                    <span className="text-xs font-bold uppercase bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{b.status}</span>
                                </div>
                                <p className="text-sm text-slate-500">{b.date}</p>
                            </div>
                        ))}
                        {myBookings.length === 0 && <p className="text-slate-400">No active bookings.</p>}
                    </div>
                </div>
            </div>
        </div>
    )
}

const AdminDashboard = ({ 
  user, products, bookings, orders, siteConfig, servicePages, paymentGateways, emailSettings, sectors, chatSettings, users,
  onUpdateServicePage, onUpdateBooking, onUpdateConfig, onUpdatePaymentGateway, onUpdateOrder, onUpdateEmailSettings, onUpdateChatSettings,
  onAddProduct, onDeleteProduct, onUpdateProduct, onAddSector, onAddUser
}: { 
  user: User | null; 
  products: Product[]; 
  bookings: ServiceBooking[]; 
  orders: Order[];
  siteConfig: SiteConfig;
  servicePages: Record<string, ServicePageContent>;
  paymentGateways: PaymentGateway[];
  emailSettings: EmailSettings;
  sectors: SectorInfo[];
  chatSettings: ChatSettings;
  users: User[];
  onUpdateServicePage: (s: string, c: ServicePageContent) => void;
  onUpdateBooking: (id: string, s: ServiceBooking['status'], staff?: string) => void;
  onUpdateConfig: (c: SiteConfig) => void;
  onUpdatePaymentGateway: (gateway: PaymentGateway) => void;
  onUpdateOrder: (id: string, updates: Partial<Order>) => void;
  onUpdateEmailSettings: (settings: EmailSettings) => void;
  onUpdateChatSettings: (settings: ChatSettings) => void;
  onAddProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProduct: (p: Product) => void;
  onAddSector: (s: SectorInfo) => void;
  onAddUser: (u: User) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'services_cms' | 'bookings' | 'marketplace' | 'settings' | 'payments' | 'email' | 'chat' | 'staff'>('overview');
  const [selectedSector, setSelectedSector] = useState<string>('Construction');
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', price: 0, category: 'Fashion', description: '', image: '', stock: 1 });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newSector, setNewSector] = useState<Partial<SectorInfo>>({ name: '', color: 'bg-gray-500', icon: 'fas fa-star' });
  const [newUser, setNewUser] = useState<{name: string, email: string, password: string, role: 'admin' | 'user' | 'staff'}>({ name: '', email: '', password: '', role: 'user' });

  if (user?.role !== 'admin') return <div className="p-20 text-center font-black text-red-500">ADMIN ACCESS ONLY.</div>;

  const handleCreateUser = () => {
    if(newUser.name && newUser.email && newUser.password) {
      onAddUser({
        id: Math.random().toString(36).substr(2, 9),
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        wishlist: [],
        isVerified: true
      });
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      alert('User created successfully');
    }
  };

  const handleFileUpload = (type: 'images' | 'videos', files: FileList | null) => {
    if (!files || !servicePages[selectedSector]) return;
    const current = servicePages[selectedSector];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (type === 'images') {
           onUpdateServicePage(selectedSector, { ...current, images: [...(current.images || []), { url: base64, story: '' }] });
        } else {
           onUpdateServicePage(selectedSector, { ...current, videos: [...(current.videos || []), { url: base64, type: 'file' }] });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageStoryChange = (index: number, newStory: string) => {
     if (!servicePages[selectedSector]) return;
     const current = servicePages[selectedSector];
     const updatedImages = current.images?.map((img, i) => i === index ? { ...img, story: newStory } : img);
     onUpdateServicePage(selectedSector, { ...current, images: updatedImages });
  };
  
  const removeMedia = (type: 'images' | 'videos', index: number) => {
    if (!servicePages[selectedSector]) return;
    const current = servicePages[selectedSector];
    const newList = current[type]?.filter((_, i) => i !== index);
    onUpdateServicePage(selectedSector, { ...current, [type]: newList });
  };

  const saveProduct = () => {
    if (editingProduct) {
       onUpdateProduct(editingProduct);
       setEditingProduct(null);
    } else if (newProduct.name && newProduct.price) {
      onAddProduct({
        id: Math.random().toString(36).substr(2, 9),
        name: newProduct.name,
        price: Number(newProduct.price),
        category: newProduct.category || 'Fashion',
        description: newProduct.description || '',
        image: newProduct.image || 'https://via.placeholder.com/300',
        stock: Number(newProduct.stock)
      } as Product);
      setNewProduct({ name: '', price: 0, category: 'Fashion', description: '', image: '', stock: 1 });
    }
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (editingProduct) {
            setEditingProduct(prev => prev ? ({ ...prev, image: result }) : null);
        } else {
            setNewProduct(prev => ({ ...prev, image: result }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const createSector = () => {
    if(newSector.name && newSector.icon) {
      onAddSector({ name: newSector.name, icon: newSector.icon, color: newSector.color || 'bg-gray-500' } as SectorInfo);
      setNewSector({ name: '', color: 'bg-gray-500', icon: 'fas fa-star' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col lg:flex-row gap-12">
      <aside className="lg:w-80 space-y-4">
        <div className="bg-indigo-900 p-6 md:p-10 rounded-[2.5rem] text-white shadow-xl mb-6 md:mb-10">
           <h3 className="font-black text-xl md:text-2xl tracking-tighter">Group Control</h3>
           <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mt-1">Admin Session</p>
        </div>
        <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 lg:gap-1">
          {[{ id: 'overview', n: 'Global Overview', i: 'fa-tachometer-alt' }, { id: 'marketplace', n: 'Marketplace & Orders', i: 'fa-shopping-cart' }, { id: 'bookings', n: 'Service Bookings', i: 'fa-calendar-check' }, { id: 'services_cms', n: 'Sector Pages CMS', i: 'fa-layer-group' }, { id: 'payments', n: 'Payment Settings', i: 'fa-credit-card' }, { id: 'staff', n: 'Staff & Users', i: 'fa-users' }, { id: 'email', n: 'Email Config', i: 'fa-envelope' }, { id: 'chat', n: 'Chat Support', i: 'fa-comments' }, { id: 'settings', n: 'Brand Settings', i: 'fa-sliders-h' }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`w-full text-left flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-start gap-2 lg:gap-4 p-4 lg:p-5 rounded-2xl transition font-bold text-xs lg:text-sm ${activeTab === t.id ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-900 dark:text-white shadow-sm border border-indigo-100 dark:border-slate-700' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'}`}>
              <i className={`fas ${t.i} text-lg lg:text-base lg:w-5`}></i> <span className="text-center lg:text-left">{t.n}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 space-y-10">
        {activeTab === 'overview' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
             <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-700 flex flex-col justify-between h-48">
               <div className="flex justify-between items-start">
                  <div><h4 className="text-slate-500 dark:text-slate-400 font-bold text-sm">Total Revenue</h4><span className="text-3xl font-black text-indigo-950 dark:text-white mt-2 block">₦{orders.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}</span></div>
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-300"><i className="fas fa-coins text-xl"></i></div>
               </div>
               <div className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 self-start px-3 py-1 rounded-full">+12% vs last month</div>
             </div>
             <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-700 flex flex-col justify-between h-48">
               <div className="flex justify-between items-start">
                  <div><h4 className="text-slate-500 dark:text-slate-400 font-bold text-sm">Active Orders</h4><span className="text-3xl font-black text-indigo-950 dark:text-white mt-2 block">{orders.filter(o => o.orderStatus !== 'Delivered').length}</span></div>
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-300"><i className="fas fa-shopping-bag text-xl"></i></div>
               </div>
               <div className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 self-start px-3 py-1 rounded-full">Processing Now</div>
             </div>
             <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-700 flex flex-col justify-between h-48">
               <div className="flex justify-between items-start">
                  <div><h4 className="text-slate-500 dark:text-slate-400 font-bold text-sm">Pending Services</h4><span className="text-3xl font-black text-indigo-950 dark:text-white mt-2 block">{bookings.filter(b => b.status === 'Pending').length}</span></div>
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-300"><i className="fas fa-tools text-xl"></i></div>
               </div>
               <div className="text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 self-start px-3 py-1 rounded-full">Requires Attention</div>
             </div>
           </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border dark:border-slate-700 overflow-hidden animate-fade-in">
             <div className="p-10 border-b dark:border-slate-700 flex justify-between items-center"><h3 className="text-2xl font-black text-indigo-950 dark:text-white">Service Bookings</h3><span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-4 py-1 rounded-full text-xs font-bold">{bookings.length} Requests</span></div>
             <div className="p-10 space-y-6">
                {bookings.length > 0 ? bookings.map(b => (
                  <div key={b.id} className="flex flex-col gap-4 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700">
                    <div className="flex justify-between items-start">
                       <div><h4 className="font-bold text-lg text-indigo-950 dark:text-white">{b.customerName}</h4><p className="text-xs font-black uppercase text-indigo-400 mb-2">{b.serviceType} / {b.subServiceType} • {b.date}</p></div>
                       <select value={b.status} onChange={(e) => onUpdateBooking(b.id, e.target.value as any, b.assignedStaff)} className={`px-4 py-2 rounded-xl text-xs font-bold border outline-none ${b.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                           <option value="Pending">Pending</option><option value="Confirmed">Confirmed</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option>
                       </select>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{b.details}</div>
                    <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex-1"><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Assign Staff</label><input type="text" placeholder="Staff Name" value={b.assignedStaff || ''} onChange={(e) => onUpdateBooking(b.id, b.status, e.target.value)} className="w-full border dark:border-slate-700 p-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 dark:text-white" /></div>
                    </div>
                  </div>
                )) : <div className="py-20 text-center text-slate-400 font-bold italic">No active requests found.</div>}
             </div>
          </div>
        )}

        {activeTab === 'marketplace' && (
           <div className="space-y-8 animate-fade-in">
             <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border dark:border-slate-700 p-10">
               <h3 className="text-2xl font-black text-indigo-950 dark:text-white mb-6">Inventory Management</h3>
               <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 mb-8">
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                     <input placeholder="Product Name" value={editingProduct ? editingProduct.name : newProduct.name} onChange={e => editingProduct ? setEditingProduct({...editingProduct, name: e.target.value}) : setNewProduct({...newProduct, name: e.target.value})} className="border dark:border-slate-700 p-3 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 dark:text-white" />
                     <input type="number" placeholder="Price (₦)" value={editingProduct ? editingProduct.price : newProduct.price} onChange={e => editingProduct ? setEditingProduct({...editingProduct, price: Number(e.target.value)}) : setNewProduct({...newProduct, price: Number(e.target.value)})} className="border dark:border-slate-700 p-3 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 dark:text-white" />
                     <select value={editingProduct ? editingProduct.category : newProduct.category} onChange={e => editingProduct ? setEditingProduct({...editingProduct, category: e.target.value}) : setNewProduct({...newProduct, category: e.target.value})} className="border dark:border-slate-700 p-3 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 dark:text-white">
                        {sectors.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                     </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     <div className="relative"><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Product Image</label><input type="file" accept="image/*" onChange={handleProductImageUpload} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />{(editingProduct ? editingProduct.image : newProduct.image) && <img src={editingProduct ? editingProduct.image : newProduct.image} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-lg border" />}</div>
                     <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Stock Quantity</label><input type="number" placeholder="Stock Qty" value={editingProduct ? editingProduct.stock : newProduct.stock} onChange={e => editingProduct ? setEditingProduct({...editingProduct, stock: Number(e.target.value)}) : setNewProduct({...newProduct, stock: Number(e.target.value)})} className="w-full border dark:border-slate-700 p-3 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 dark:text-white" /></div>
                  </div>
                  <textarea placeholder="Description" value={editingProduct ? editingProduct.description : newProduct.description} onChange={e => editingProduct ? setEditingProduct({...editingProduct, description: e.target.value}) : setNewProduct({...newProduct, description: e.target.value})} className="w-full border dark:border-slate-700 p-3 rounded-xl text-sm font-bold mb-4 bg-white dark:bg-slate-800 dark:text-white" rows={2}></textarea>
                  <div className="flex gap-4">
                    <button onClick={saveProduct} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition">{editingProduct ? 'Update Product' : 'Add Product to Store'}</button>
                    {editingProduct && <button onClick={() => setEditingProduct(null)} className="bg-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-300 transition">Cancel</button>}
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                 {products.map(p => (
                   <div key={p.id} className="flex gap-4 p-4 border dark:border-slate-700 rounded-2xl items-center bg-white dark:bg-slate-800">
                      <img src={p.image} className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-700" alt={p.name} />
                      <div className="flex-1"><h5 className="font-bold text-indigo-950 dark:text-white text-sm">{p.name}</h5><p className="text-xs text-slate-500 dark:text-slate-400">₦{p.price.toLocaleString()} • {p.stock} left</p></div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingProduct(p)} className="text-indigo-500 hover:text-indigo-700 px-2"><i className="fas fa-edit"></i></button>
                        <button onClick={() => onDeleteProduct(p.id)} className="text-red-500 hover:text-red-700 px-2"><i className="fas fa-trash"></i></button>
                      </div>
                   </div>
                 ))}
               </div>
             </div>
             <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border dark:border-slate-700 overflow-hidden">
               <div className="p-10 border-b dark:border-slate-700"><h3 className="text-2xl font-black text-indigo-950 dark:text-white">Marketplace Orders</h3></div>
               <div className="p-10 space-y-8">
                 {orders.length > 0 ? orders.map(order => (
                   <div key={order.id} className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-700 space-y-6">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                         <div><div className="flex items-center gap-2 mb-2"><span className="text-xs font-black uppercase text-slate-400">Order #{order.id}</span><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.paymentStatus === 'Paid' ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'}`}>{order.paymentStatus}</span></div><h4 className="text-xl font-bold text-indigo-950 dark:text-white">{order.customer.name}</h4><p className="text-sm text-slate-500 dark:text-slate-400">{order.customer.phone} • {order.customer.email}</p></div>
                         <div className="text-right"><p className="text-2xl font-black text-indigo-900 dark:text-white">₦{order.total.toLocaleString()}</p><p className="text-xs font-bold text-slate-400">{order.items.length} items</p></div>
                      </div>
                      
                      {order.paymentProof && (
                        <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700">
                          <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Payment Proof</p>
                          <img 
                            src={order.paymentProof} 
                            alt="Proof" 
                            className="h-48 rounded-lg border dark:border-slate-700 cursor-pointer hover:opacity-90 transition" 
                            onClick={() => {
                                const w = window.open("");
                                w?.document.write(`<img src="${order.paymentProof}" style="max-width: 100%"/>`);
                            }} 
                          />
                        </div>
                      )}

                      {/* Admin Controls for Order Status */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t dark:border-slate-700 pt-4">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Payment Status</label>
                          <select 
                            value={order.paymentStatus} 
                            onChange={(e) => onUpdateOrder(order.id, { paymentStatus: e.target.value as any })}
                            className={`w-full p-2 rounded-lg text-xs font-bold border dark:border-slate-700 ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Verifying">Verifying</option>
                            <option value="Paid">Paid</option>
                            <option value="Failed">Failed</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Order Status</label>
                          <select 
                            value={order.orderStatus} 
                            onChange={(e) => onUpdateOrder(order.id, { orderStatus: e.target.value as any })}
                            className="w-full p-2 rounded-lg text-xs font-bold border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white"
                          >
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                   </div>
                 )) : <div className="py-20 text-center text-slate-400 font-bold italic">No active orders.</div>}
               </div>
             </div>
           </div>
        )}

        {activeTab === 'staff' && (
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border dark:border-slate-700 p-12 animate-fade-in">
             <h3 className="text-2xl font-black mb-8 text-indigo-950 dark:text-white">Staff & User Management</h3>
             
             <div className="mb-10 bg-slate-50 dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700">
               <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-6">Create New Account</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                 <div>
                   <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Full Name</label>
                   <input className="w-full p-3 rounded-xl border dark:border-slate-700 font-bold bg-white dark:bg-slate-800 dark:text-white" placeholder="John Doe" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Email Address</label>
                   <input className="w-full p-3 rounded-xl border dark:border-slate-700 font-bold bg-white dark:bg-slate-800 dark:text-white" placeholder="john@example.com" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Password</label>
                   <input className="w-full p-3 rounded-xl border dark:border-slate-700 font-bold bg-white dark:bg-slate-800 dark:text-white" type="password" placeholder="******" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Role</label>
                   <select className="w-full p-3 rounded-xl border dark:border-slate-700 font-bold bg-white dark:bg-slate-800 dark:text-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}>
                     <option value="user">User / Client</option>
                     <option value="staff">Staff Member</option>
                     <option value="admin">Administrator</option>
                   </select>
                 </div>
               </div>
               <button onClick={handleCreateUser} className="mt-6 bg-indigo-900 dark:bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-800 transition shadow-lg shadow-indigo-900/20">Create Account</button>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="text-xs text-slate-400 uppercase border-b dark:border-slate-700">
                     <th className="p-4">Name</th>
                     <th className="p-4">Email</th>
                     <th className="p-4">Role</th>
                     <th className="p-4">Verified</th>
                   </tr>
                 </thead>
                 <tbody className="text-sm font-medium text-slate-600 dark:text-slate-300">
                   {users.map(u => (
                     <tr key={u.id} className="border-b dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                       <td className="p-4 font-bold text-indigo-900 dark:text-white">{u.name}</td>
                       <td className="p-4">{u.email}</td>
                       <td className="p-4"><span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'staff' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{u.role}</span></td>
                       <td className="p-4">{u.isVerified ? <span className="text-green-500"><i className="fas fa-check-circle"></i> Yes</span> : <span className="text-orange-500">Pending</span>}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* ... (Other tabs remain the same) ... */}
        {activeTab === 'services_cms' && (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[3rem] shadow-sm border dark:border-slate-700 animate-fade-in">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black tracking-tight text-indigo-950 dark:text-white">Sector Content</h3>
                <select value={selectedSector} onChange={e => setSelectedSector(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 px-6 py-3 rounded-2xl font-black text-indigo-900 dark:text-white outline-none">
                  {sectors.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
             </div>
             <div className="mb-12 p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-[2rem]">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-4">Add New Service Category</h4>
                <div className="flex gap-4 items-end">
                   <div className="flex-1"><input placeholder="Category Name" value={newSector.name} onChange={e => setNewSector({...newSector, name: e.target.value})} className="w-full border dark:border-slate-700 p-3 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 dark:text-white" /></div>
                   <div className="flex-1"><input placeholder="Icon Class (e.g. fas fa-star)" value={newSector.icon} onChange={e => setNewSector({...newSector, icon: e.target.value})} className="w-full border dark:border-slate-700 p-3 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 dark:text-white" /></div>
                   <div className="flex-1">
                      <select value={newSector.color} onChange={e => setNewSector({...newSector, color: e.target.value})} className="w-full border dark:border-slate-700 p-3 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 dark:text-white">
                         <option value="bg-orange-500">Orange</option><option value="bg-blue-600">Blue</option><option value="bg-pink-500">Pink</option><option value="bg-green-600">Green</option><option value="bg-cyan-500">Cyan</option><option value="bg-indigo-600">Indigo</option><option value="bg-purple-600">Purple</option><option value="bg-red-600">Red</option>
                      </select>
                   </div>
                   <button onClick={createSector} className="bg-indigo-900 text-white px-6 py-3 rounded-xl font-bold">Add</button>
                </div>
             </div>

             {servicePages[selectedSector] ? (
                 <div className="space-y-12">
                    <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-4">Description</label><textarea className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 p-8 rounded-3xl font-medium focus:border-indigo-600 transition outline-none dark:text-white" rows={6} value={servicePages[selectedSector]?.description || ''} onChange={e => onUpdateServicePage(selectedSector, { ...servicePages[selectedSector], description: e.target.value })} /></div>
                    <div className="space-y-6">
                      <h4 className="font-black text-lg border-b dark:border-slate-700 pb-4 dark:text-white">Images Gallery</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {servicePages[selectedSector]?.images?.map((img, i) => (
                          <div key={i} className="flex gap-4 p-4 border dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 relative group">
                             <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border dark:border-slate-700"><img src={img.url} className="w-full h-full object-cover" alt="S" /></div>
                             <div className="flex-1"><textarea className="w-full h-20 p-2 text-xs border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white" value={img.story} onChange={e => handleImageStoryChange(i, e.target.value)} /></div>
                             <button onClick={() => removeMedia('images', i)} className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full"><i className="fas fa-trash"></i></button>
                          </div>
                        ))}
                        <label className="w-full h-32 border-2 border-dashed dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:border-indigo-600 cursor-pointer"><i className="fas fa-plus mb-2 text-2xl"></i><input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileUpload('images', e.target.files)} /></label>
                      </div>
                   </div>
                 </div>
             ) : <div className="p-12 text-center text-slate-400 font-bold border-2 border-dashed rounded-3xl">Sector content not initialized. Please add content.</div>}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border dark:border-slate-700 p-12 animate-fade-in">
             <h3 className="text-2xl font-black mb-8 text-indigo-950 dark:text-white">Payment Gateways</h3>
             <div className="space-y-6">
                {paymentGateways.map(gw => (
                   <div key={gw.id} className="border dark:border-slate-700 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900">
                      <div className="flex justify-between items-center mb-4">
                         <h4 className="font-bold text-lg text-indigo-900 dark:text-white flex items-center gap-2">{gw.name} {gw.isActive ? <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">Active</span> : <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">Inactive</span>}</h4>
                         <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={gw.isActive} onChange={() => onUpdatePaymentGateway({...gw, isActive: !gw.isActive})} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div></label>
                      </div>
                      {gw.isActive && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            {gw.type === 'paystack' ? (
                               <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Public Key</label><input value={gw.config.publicKey || ''} onChange={(e) => onUpdatePaymentGateway({...gw, config: {...gw.config, publicKey: e.target.value}})} className="w-full border dark:border-slate-700 p-2 rounded-lg text-sm font-bold bg-white dark:bg-slate-800 dark:text-white" placeholder="pk_live_..." /></div>
                            ) : (
                               <>
                                 <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Bank Name</label><input value={gw.config.bankName || ''} onChange={(e) => onUpdatePaymentGateway({...gw, config: {...gw.config, bankName: e.target.value}})} className="w-full border dark:border-slate-700 p-2 rounded-lg text-sm font-bold bg-white dark:bg-slate-800 dark:text-white" /></div>
                                 <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Account Number</label><input value={gw.config.accountNumber || ''} onChange={(e) => onUpdatePaymentGateway({...gw, config: {...gw.config, accountNumber: e.target.value}})} className="w-full border dark:border-slate-700 p-2 rounded-lg text-sm font-bold bg-white dark:bg-slate-800 dark:text-white" /></div>
                                 <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Account Name</label><input value={gw.config.accountName || ''} onChange={(e) => onUpdatePaymentGateway({...gw, config: {...gw.config, accountName: e.target.value}})} className="w-full border dark:border-slate-700 p-2 rounded-lg text-sm font-bold bg-white dark:bg-slate-800 dark:text-white" /></div>
                               </>
                            )}
                         </div>
                      )}
                   </div>
                ))}
             </div>
          </div>
        )}
        
        {/* ... settings, email, chat tabs ... */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border dark:border-slate-700 p-12 animate-fade-in">
             <h3 className="text-2xl font-black mb-8 text-indigo-950 dark:text-white">Brand Configuration</h3>
             <div className="max-w-2xl space-y-6">
                <div><label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Company Name</label><input value={siteConfig.brandName} onChange={e => onUpdateConfig({...siteConfig, brandName: e.target.value})} className="w-full border dark:border-slate-700 p-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 dark:text-white" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div><label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Phone Number</label><input value={siteConfig.phone} onChange={e => onUpdateConfig({...siteConfig, phone: e.target.value})} className="w-full border dark:border-slate-700 p-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 dark:text-white" /></div>
                   <div><label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">HQ Address</label><input value={siteConfig.address} onChange={e => onUpdateConfig({...siteConfig, address: e.target.value})} className="w-full border dark:border-slate-700 p-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 dark:text-white" /></div>
                </div>
                <div><label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Hero Tagline</label><textarea rows={3} value={siteConfig.heroTagline} onChange={e => onUpdateConfig({...siteConfig, heroTagline: e.target.value})} className="w-full border dark:border-slate-700 p-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 dark:text-white" /></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-slate-700">
                   <div>
                      <label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Site Logo</label>
                      <input type="file" accept="image/*" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = (ev) => onUpdateConfig({...siteConfig, logo: ev.target?.result as string});
                            reader.readAsDataURL(e.target.files[0]);
                          }
                      }} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-200" />
                      {siteConfig.logo && <div className="mt-2"><img src={siteConfig.logo} alt="Logo Preview" className="h-16 object-contain border dark:border-slate-700 p-1 rounded-lg bg-white" /></div>}
                   </div>
                   <div>
                      <label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Favicon</label>
                       <input type="file" accept="image/*" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = (ev) => onUpdateConfig({...siteConfig, favicon: ev.target?.result as string});
                            reader.readAsDataURL(e.target.files[0]);
                          }
                      }} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-200" />
                      {siteConfig.favicon && <div className="mt-2"><img src={siteConfig.favicon} alt="Favicon Preview" className="h-8 w-8 object-contain border dark:border-slate-700 p-1 rounded-lg bg-white" /></div>}
                   </div>
                </div>
                
                <div className="pt-6 border-t dark:border-slate-700">
                    <h4 className="font-bold text-indigo-900 dark:text-white mb-4">Social Media Links</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Facebook</label><input value={siteConfig.socials?.facebook || ''} onChange={e => onUpdateConfig({...siteConfig, socials: {...siteConfig.socials, facebook: e.target.value}})} className="w-full border dark:border-slate-700 p-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 dark:text-white" placeholder="https://facebook.com/..." /></div>
                        <div><label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Instagram</label><input value={siteConfig.socials?.instagram || ''} onChange={e => onUpdateConfig({...siteConfig, socials: {...siteConfig.socials, instagram: e.target.value}})} className="w-full border dark:border-slate-700 p-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 dark:text-white" placeholder="https://instagram.com/..." /></div>
                        <div><label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Twitter / X</label><input value={siteConfig.socials?.twitter || ''} onChange={e => onUpdateConfig({...siteConfig, socials: {...siteConfig.socials, twitter: e.target.value}})} className="w-full border dark:border-slate-700 p-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 dark:text-white" placeholder="https://x.com/..." /></div>
                        <div><label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">LinkedIn</label><input value={siteConfig.socials?.linkedin || ''} onChange={e => onUpdateConfig({...siteConfig, socials: {...siteConfig.socials, linkedin: e.target.value}})} className="w-full border dark:border-slate-700 p-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 dark:text-white" placeholder="https://linkedin.com/in/..." /></div>
                        <div><label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">YouTube</label><input value={siteConfig.socials?.youtube || ''} onChange={e => onUpdateConfig({...siteConfig, socials: {...siteConfig.socials, youtube: e.target.value}})} className="w-full border dark:border-slate-700 p-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 dark:text-white" placeholder="https://youtube.com/..." /></div>
                    </div>
                </div>

                <button className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition">Save Changes</button>
             </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border dark:border-slate-700 p-12 animate-fade-in">
             <h3 className="text-2xl font-black mb-8 text-indigo-950 dark:text-white">Email Configuration</h3>
             <div className="space-y-6 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div><label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">SMTP Host</label><input value={emailSettings.smtpHost} onChange={e => onUpdateEmailSettings({...emailSettings, smtpHost: e.target.value})} className="w-full border dark:border-slate-700 p-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 dark:text-white" /></div>
                   <div><label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">SMTP Port</label><input value={emailSettings.smtpPort} onChange={e => onUpdateEmailSettings({...emailSettings, smtpPort: e.target.value})} className="w-full border dark:border-slate-700 p-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 dark:text-white" /></div>
                   <div><label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">SMTP User</label><input value={emailSettings.smtpUser} onChange={e => onUpdateEmailSettings({...emailSettings, smtpUser: e.target.value})} className="w-full border dark:border-slate-700 p-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 dark:text-white" /></div>
                   <div><label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Sender Name</label><input value={emailSettings.senderName} onChange={e => onUpdateEmailSettings({...emailSettings, senderName: e.target.value})} className="w-full border dark:border-slate-700 p-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 dark:text-white" /></div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-4">Notification Settings</h4>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Send Auto-Response to Customers</span>
                        <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={emailSettings.enableAutoResponse} onChange={() => onUpdateEmailSettings({...emailSettings, enableAutoResponse: !emailSettings.enableAutoResponse})} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div></label>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Send Admin Notifications</span>
                        <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={emailSettings.enableAdminNotifications} onChange={() => onUpdateEmailSettings({...emailSettings, enableAdminNotifications: !emailSettings.enableAdminNotifications})} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div></label>
                    </div>
                </div>
                <div><label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Admin Notification Email</label><input value={emailSettings.adminNotificationEmail} onChange={e => onUpdateEmailSettings({...emailSettings, adminNotificationEmail: e.target.value})} className="w-full border dark:border-slate-700 p-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 dark:text-white" /></div>
                <button className="bg-indigo-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-800 transition">Update Mail Server</button>
             </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border dark:border-slate-700 p-12 animate-fade-in">
             <h3 className="text-2xl font-black mb-8 text-indigo-950 dark:text-white">Chat Configuration</h3>
             <div className="space-y-8 max-w-3xl">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div>
                       <h4 className="font-bold text-lg text-indigo-900 dark:text-white mb-1">Enable Chat Widget</h4>
                       <p className="text-sm text-slate-500 dark:text-slate-400">Show floating chat button to visitors.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={chatSettings.enabled} onChange={() => onUpdateChatSettings({...chatSettings, enabled: !chatSettings.enabled})} />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>

                {chatSettings.enabled && (
                  <div className="space-y-6">
                     <div>
                        <label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-4">Select Provider</label>
                        <div className="flex gap-4">
                           <button onClick={() => onUpdateChatSettings({...chatSettings, provider: 'whatsapp'})} className={`flex-1 py-4 rounded-xl border-2 font-bold transition flex items-center justify-center gap-2 ${chatSettings.provider === 'whatsapp' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'border-slate-200 dark:border-slate-700 dark:text-slate-300'}`}>
                              <i className="fab fa-whatsapp text-xl"></i> WhatsApp
                           </button>
                           <button onClick={() => onUpdateChatSettings({...chatSettings, provider: 'custom'})} className={`flex-1 py-4 rounded-xl border-2 font-bold transition flex items-center justify-center gap-2 ${chatSettings.provider === 'custom' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 dark:text-slate-300'}`}>
                              <i className="fas fa-code text-xl"></i> Custom Script
                           </button>
                        </div>
                     </div>

                     {chatSettings.provider === 'whatsapp' && (
                        <div className="animate-fade-in">
                           <label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">WhatsApp Number</label>
                           <input placeholder="e.g. 2347012345678" value={chatSettings.whatsappNumber} onChange={e => onUpdateChatSettings({...chatSettings, whatsappNumber: e.target.value})} className="w-full border dark:border-slate-700 p-4 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 dark:text-white" />
                           <p className="text-xs text-slate-400 mt-2">Enter number with country code, no symbols (e.g., 234...)</p>
                        </div>
                     )}

                     {chatSettings.provider === 'custom' && (
                        <div className="animate-fade-in">
                           <label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Third-Party Script</label>
                           <textarea rows={6} placeholder="<script>...</script>" value={chatSettings.customScript} onChange={e => onUpdateChatSettings({...chatSettings, customScript: e.target.value})} className="w-full border dark:border-slate-700 p-4 rounded-xl font-mono text-xs bg-slate-900 text-green-400" />
                           <p className="text-xs text-slate-400 mt-2">Paste widget code from providers like Tawk.to, Intercom, or Crisp.</p>
                        </div>
                     )}
                  </div>
                )}
             </div>
          </div>
        )}

      </main>
    </div>
  );
};

const ChatPage = ({ settings }: { settings: ChatSettings }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{sender: 'user' | 'agent', text: string}[]>([
    { sender: 'agent', text: 'Hello! How can we help you today?' }
  ]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatHistory]);

  const handleSend = () => {
    if (!message.trim()) return;
    setChatHistory(prev => [...prev, { sender: 'user', text: message }]);
    setMessage('');
    
    // Simulate response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { sender: 'agent', text: 'Thank you for your message. Our support team has been notified and will respond shortly.' }]);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-[calc(100vh-80px)] flex flex-col">
       <div className="bg-white dark:bg-slate-800 rounded-t-[2rem] shadow-sm border dark:border-slate-700 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-indigo-950 dark:text-white">Live Support</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">We typically reply in a few minutes.</p>
          </div>
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl">
            <i className="fas fa-headset"></i>
          </div>
       </div>
       
       <div className="flex-1 bg-slate-50 dark:bg-slate-900 border-x dark:border-slate-700 p-6 overflow-y-auto space-y-4 min-h-[400px]">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 dark:text-slate-200 border dark:border-slate-700 rounded-tl-none shadow-sm'}`}>
                 {msg.text}
               </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
       </div>

       <div className="bg-white dark:bg-slate-800 rounded-b-[2rem] shadow-sm border dark:border-slate-700 p-4">
          <div className="flex gap-4">
             <input 
               className="flex-1 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-xl px-4 py-3 font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
               placeholder="Type your message..."
               value={message}
               onChange={e => setMessage(e.target.value)}
               onKeyPress={e => e.key === 'Enter' && handleSend()}
             />
             <button onClick={handleSend} className="bg-indigo-900 dark:bg-indigo-600 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-indigo-800 transition shadow-lg shadow-indigo-900/20">
               <i className="fas fa-paper-plane"></i>
             </button>
          </div>
       </div>
       
       {settings.provider === 'whatsapp' && (
         <div className="text-center mt-8 animate-fade-in">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Or connect via WhatsApp</p>
            <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition shadow-lg shadow-green-500/20">
              <i className="fab fa-whatsapp text-xl"></i> Chat on WhatsApp
            </a>
         </div>
       )}
    </div>
  );
};

const App = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newTheme;
    });
  };

  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    brandName: INITIAL_BRAND_NAME,
    phone: INITIAL_PHONE,
    address: INITIAL_ADDRESS,
    heroTagline: `MSD&W Integrated Holdings specializes in multi-sector growth across construction, fashion, and logistics.`,
    logo: undefined,
    favicon: undefined,
    socials: {
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
      linkedin: 'https://linkedin.com',
      twitter: '',
      youtube: ''
    }
  });

  // Dynamic Favicon Update
  useEffect(() => {
    if (siteConfig.favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = siteConfig.favicon;
    }
  }, [siteConfig.favicon]);

  const [sectors, setSectors] = useState<SectorInfo[]>(INITIAL_SECTORS.map(s => ({...s, icon: typeof s.icon === 'object' ? 'fas fa-star' : s.icon})));
  useEffect(() => {
     setSectors([
        { name: 'Construction', icon: 'fas fa-hard-hat', color: 'bg-orange-500' },
        { name: 'Logistics', icon: 'fas fa-truck', color: 'bg-blue-600' },
        { name: 'Fashion', icon: 'fas fa-tshirt', color: 'bg-pink-500' },
        { name: 'Wholesale', icon: 'fas fa-boxes', color: 'bg-green-600' },
        { name: 'Cleaning', icon: 'fas fa-broom', color: 'bg-cyan-500' },
        { name: 'General Trading', icon: 'fas fa-exchange-alt', color: 'bg-indigo-600' },
     ]);
  }, []);

  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Premium Senator Suit (Navy)', description: 'Bespoke tailoring with Italian wool.', price: 45000, category: 'Fashion', image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80&w=800', stock: 10 },
    { id: '2', name: 'Royal Agbada Ensemble', description: 'Traditional luxury with hand-stitched embroidery.', price: 85000, category: 'Fashion', image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&q=80&w=800', stock: 5 },
    { id: '3', name: 'Swiss Voile Lace Fabric', description: 'High-grade imported lace for special occasions (5 yards).', price: 30000, category: 'Fashion', image: 'https://images.unsplash.com/photo-1612459732692-7104b6b66380?auto=format&fit=crop&q=80&w=800', stock: 20 },
    { id: '4', name: 'Corporate Oxford Shirt', description: 'Crisp white cotton shirt for business executives.', price: 15000, category: 'Fashion', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800', stock: 50 },
  ]);

  const [servicePages, setServicePages] = useState<Record<string, ServicePageContent>>({
    'Construction': { 
      description: 'Scaleable urban infrastructure and civil engineering works.',
      images: [{ url: 'https://images.unsplash.com/photo-1541888941294-631c894c3046?auto=format&fit=crop&q=80&w=1200', story: 'Major bridge infrastructure project.' }],
      videos: []
    },
    'Logistics': { 
      description: 'Reliable haulage and global supply chain solutions.',
      images: [{ url: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=1200', story: 'Fleet management.' }],
      videos: []
    },
    'Fashion': { 
      description: 'Premium senator wears and luxury Ankara textiles.',
      images: [{ url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=1200', story: 'Bespoke Senator wear.' }],
      videos: []
    },
    'Wholesale': { 
      description: 'Bulk supply for retail chains.',
      images: [{ url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200', story: 'Warehousing capacity.' }],
      videos: []
    },
    'Cleaning': { 
      description: 'Industrial-grade cleaning for corporate offices.',
      images: [{ url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6958?auto=format&fit=crop&q=80&w=1200', story: 'Post-construction cleaning.' }],
      videos: []
    },
    'General Trading': { 
      description: 'Import-export and general commodities trading.',
      images: [{ url: 'https://images.unsplash.com/photo-1454165833767-1249673418ba?auto=format&fit=crop&q=80&w=1200', story: 'International trade.' }],
      videos: []
    },
  });

  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([
    { id: 'paystack', name: 'Paystack', type: 'paystack', isActive: true, config: { publicKey: 'pk_test_sample' } },
    { id: 'bank_transfer', name: 'Direct Bank Transfer', type: 'bank_transfer', isActive: true, config: { bankName: 'Zenith Bank', accountNumber: '1234567890', accountName: 'MSDW Holdings' } }
  ]);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: 'mail.msdw.com', smtpPort: '465', smtpUser: 'info@msdw.com', senderName: 'MSD&W', enableAutoResponse: true, enableAdminNotifications: true, adminNotificationEmail: 'admin@msdw.com'
  });
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    enabled: true,
    provider: 'whatsapp',
    whatsappNumber: '2347046997301',
    customScript: ''
  });

  // Simulated Database of Users
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: OWNER_NAME, email: 'info@msdw.com', role: 'admin', wishlist: [], password: 'admin', isVerified: true },
    { id: '2', name: 'Client User', email: 'client@example.com', role: 'user', wishlist: [], password: 'user', isVerified: true }
  ]);

  const simulateEmailService = (to: string, subject: string, body: string) => {
    // This simulates calling the backend mailer.php script
    console.log(`%c[Email Service Provider] Sending to: ${to}`, 'color: cyan; font-weight: bold;');
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    // Simulate server response time
    setTimeout(() => {
        // alert(`[Email Verification System]\n\nEmail sent to: ${to}\nSubject: ${subject}\n\n(See console for full details)`);
    }, 1000);
  };

  const handleBook = (booking: Partial<ServiceBooking>) => {
    setBookings(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      serviceType: booking.serviceType || 'Construction',
      subServiceType: booking.subServiceType || 'General',
      customerName: booking.customerName || 'Anonymous',
      date: booking.date || new Date().toISOString().split('T')[0],
      status: 'Pending',
      details: booking.details || '',
      assignedStaff: ''
    }]);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.product.id === product.id);
      if (existing) return prev.map(p => p.product.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.product.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(i => i.quantity > 0));
  };

  const handlePlaceOrder = async (orderData: Partial<Order>) => {
     setOrders(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        date: new Date().toISOString().split('T')[0],
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        deliveryFee: orderData.deliveryFee || 0,
        total: orderData.total || 0,
        deliveryMethod: orderData.deliveryMethod || 'pickup',
        paymentMethod: orderData.paymentMethod || 'paystack',
        paymentStatus: orderData.paymentStatus || 'Pending',
        paymentProof: orderData.paymentProof,
        orderStatus: orderData.orderStatus || 'Processing',
        customer: orderData.customer || { name: '', email: '', phone: '', address: '' }
     } as Order]);
     setCart([]);
     setIsCartOpen(false);
     alert('Order Placed Successfully!');
  };

  const handleOrderUpdate = (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        // Detect changes for notifications
        if (updates.orderStatus && updates.orderStatus !== o.orderStatus) {
           simulateEmailService(o.customer.email, `Order Status Update #${o.id}`, `Dear ${o.customer.name}, your order is now ${updates.orderStatus}. Check your dashboard for details.`);
        }
        if (updates.paymentStatus && updates.paymentStatus !== o.paymentStatus) {
           simulateEmailService(o.customer.email, `Payment Status Update #${o.id}`, `Dear ${o.customer.name}, your payment status is now ${updates.paymentStatus}.`);
        }
        return { ...o, ...updates };
      }
      return o;
    }));
  };

  const handleAddSector = (newSector: SectorInfo) => {
    setSectors(prev => [...prev, newSector]);
    setServicePages(prev => ({...prev, [newSector.name]: { description: `Standard ${newSector.name} services.`, images: [], videos: [] }}));
  };

  const handleToggleWishlist = (productId: string) => {
    if (!user) {
        alert("Please log in to manage your wishlist.");
        window.location.hash = "#/login";
        return;
    }
    let newWishlist = user.wishlist.includes(productId) 
        ? user.wishlist.filter(id => id !== productId)
        : [...user.wishlist, productId];
    
    const updatedUser = { ...user, wishlist: newWishlist };
    setUser(updatedUser);
    setUsers(users.map(u => u.id === user.id ? updatedUser : u));
  };

  const handleLogin = (u: User) => {
      setUser(u);
  };
  
  const handleLogout = () => {
      setUser(null);
      window.location.hash = "/";
  };

  const handleAddUser = (u: User) => {
      setUsers(prev => [...prev, u]);
  };

  return (
    <Router>
      <div className={`min-h-screen flex flex-col font-inter transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <Navbar user={user} cartCount={cart.reduce((a,b) => a + b.quantity, 0)} openCart={() => setIsCartOpen(true)} config={siteConfig} theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} updateQuantity={updateQuantity} checkout={handlePlaceOrder} paymentGateways={paymentGateways} siteConfig={siteConfig} />
        
        <ScrollToTop />

        <main className="flex-grow">
          <ChatWidget settings={chatSettings} />
          <Routes>
            <Route path="/" element={
               <>
                 <ShuffleBanner servicePages={servicePages} sectors={sectors} />
                 <section className="py-24 max-w-7xl mx-auto px-4">
                    <div className="text-center mb-20">
                       <h2 className="text-5xl font-black text-indigo-950 dark:text-white mb-6">Corporate Sectors</h2>
                       <p className="text-slate-500 dark:text-slate-400 max-w-3xl mx-auto text-lg leading-relaxed">The MSD&W Group maintains market-leading standards across construction, logistics, and high-end commercial retail sectors.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                       {sectors.map(s => (
                         <Link key={s.name} to={`/service/${s.name.replace(/\s+/g, '-').toLowerCase()}`} className="group bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border dark:border-slate-800">
                            <div className={`w-16 h-16 rounded-2xl ${s.color} text-white flex items-center justify-center text-2xl mb-8 transform group-hover:rotate-12 transition`}>
                              <i className={typeof s.icon === 'string' ? s.icon : 'fas fa-star'}></i>
                            </div>
                            <h3 className="text-2xl font-black text-indigo-950 dark:text-white mb-4">{s.name}</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 line-clamp-3 leading-relaxed">{servicePages[s.name]?.description}</p>
                            <span className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">View Portfolio <i className="fas fa-arrow-right text-[10px]"></i></span>
                         </Link>
                       ))}
                    </div>
                 </section>
               </>
            } />
            <Route path="/service/:sectorSlug" element={<ServiceDetailPage servicePages={servicePages} />} />
            <Route path="/services" element={<ServiceBookingPage onBook={handleBook} sectors={sectors} />} />
            <Route path="/chat" element={<ChatPage settings={chatSettings} />} />
            <Route path="/products" element={<Marketplace products={products} addToCart={addToCart} addToWishlist={handleToggleWishlist} />} />
            <Route path="/wishlist" element={user ? <WishlistPage user={user} products={products} addToCart={addToCart} removeFromWishlist={handleToggleWishlist} /> : <AuthPage onLogin={handleLogin} />} />
            <Route path="/dashboard" element={<UserDashboard user={user} bookings={bookings} orders={orders} />} />
            <Route path="/admin" element={
              <AdminDashboard 
                user={user} products={products} bookings={bookings} orders={orders} siteConfig={siteConfig} servicePages={servicePages} paymentGateways={paymentGateways} emailSettings={emailSettings} sectors={sectors} chatSettings={chatSettings} users={users}
                onUpdateServicePage={(s, c) => setServicePages(prev => ({ ...prev, [s]: c }))}
                onUpdateBooking={(id, s, staff) => setBookings(prev => prev.map(b => b.id === id ? { ...b, status: s, assignedStaff: staff } : b))}
                onUpdateConfig={setSiteConfig}
                onUpdatePaymentGateway={updated => setPaymentGateways(prev => prev.map(gw => gw.id === updated.id ? updated : gw))}
                onUpdateOrder={handleOrderUpdate}
                onUpdateEmailSettings={setEmailSettings}
                onUpdateChatSettings={setChatSettings}
                onAddProduct={(p) => setProducts(prev => [...prev, p])}
                onDeleteProduct={(id) => setProducts(prev => prev.filter(p => p.id !== id))}
                onUpdateProduct={(updated) => setProducts(prev => prev.map(p => p.id === updated.id ? updated : p))}
                onAddSector={handleAddSector}
                onAddUser={handleAddUser}
              />
            } />
            <Route path="/login" element={user ? <UserDashboard user={user} bookings={bookings} orders={orders} /> : <AuthPage onLogin={handleLogin} />} />
          </Routes>
        </main>
        
        <footer className="bg-white dark:bg-slate-900 py-20 border-t dark:border-slate-800">
           <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-20">
              <div className="md:col-span-2">
                 <h2 className="text-3xl font-black text-indigo-950 dark:text-white mb-6 tracking-tighter">{siteConfig.brandName}</h2>
                 <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-10 leading-relaxed font-medium">Owned by {OWNER_NAME}. A premier multi-sector conglomerate integrating logistics, construction and fashion across the Nigerian landscape.</p>
                 <div className="flex gap-4">
                    {siteConfig.socials?.linkedin && <a href={siteConfig.socials.linkedin} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 flex items-center justify-center text-indigo-950 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition"><i className="fab fa-linkedin-in"></i></a>}
                    {siteConfig.socials?.instagram && <a href={siteConfig.socials.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 flex items-center justify-center text-indigo-950 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition"><i className="fab fa-instagram"></i></a>}
                    {siteConfig.socials?.facebook && <a href={siteConfig.socials.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 flex items-center justify-center text-indigo-950 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition"><i className="fab fa-facebook-f"></i></a>}
                    {siteConfig.socials?.twitter && <a href={siteConfig.socials.twitter} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 flex items-center justify-center text-indigo-950 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition"><i className="fab fa-twitter"></i></a>}
                    {siteConfig.socials?.youtube && <a href={siteConfig.socials.youtube} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 flex items-center justify-center text-indigo-950 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition"><i className="fab fa-youtube"></i></a>}
                 </div>
              </div>
              <div>
                 <h4 className="font-black text-indigo-950 dark:text-white mb-8 uppercase tracking-widest text-[10px]">Our Services</h4>
                 <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {sectors.map(s => (
                      <li key={s.name}>
                        <Link to={`/service/${s.name.replace(/\s+/g, '-').toLowerCase()}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                          {s.name}
                        </Link>
                      </li>
                    ))}
                 </ul>
              </div>
              <div>
                 <h4 className="font-black text-indigo-950 dark:text-white mb-8 uppercase tracking-widest text-[10px]">Headquarters</h4>
                 <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{siteConfig.address}<br/>{siteConfig.phone}</p>
              </div>
           </div>
           <div className="text-center mt-20 text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">© {new Date().getFullYear()} MSD&W Integrated Holdings Platform</div>
        </footer>
      </div>
    </Router>
  );
};

export default App;