
export interface SectorInfo {
  name: string;
  icon: any; // JSX Element or string class
  color: string;
}

export interface ServiceImage {
  url: string;
  story: string;
}

export interface ServiceVideo {
  url: string;
  type: 'file' | 'link';
}

export interface ServicePageContent {
  description: string;
  images: ServiceImage[]; 
  videos: ServiceVideo[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string; // Changed from Enum to string for dynamic categories
  image: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ServiceBooking {
  id: string;
  serviceType: string; // Changed from Enum to string
  subServiceType?: string; // Specific service chosen
  customerName: string;
  date: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  details: string;
  assignedStaff?: string; // New field
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'staff';
  wishlist: string[]; // Array of Product IDs
  password?: string; // Simulated password storage
  isVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
}

export interface PaymentGateway {
  id: string;
  name: string;
  type: 'paystack' | 'bank_transfer';
  isActive: boolean;
  config: {
    publicKey?: string;
    secretKey?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
}

export interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryMethod: 'pickup' | 'delivery';
  deliveryDaysEstimate?: string;
  paymentMethod: 'paystack' | 'bank_transfer';
  paymentStatus: 'Pending' | 'Verifying' | 'Paid' | 'Failed';
  paymentProof?: string; // Base64 string of the uploaded image
  orderStatus: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  senderName: string;
  enableAutoResponse: boolean;
  enableAdminNotifications: boolean;
  adminNotificationEmail: string;
}

export interface ChatSettings {
  enabled: boolean;
  provider: 'whatsapp' | 'custom';
  whatsappNumber: string;
  customScript: string;
}
