export interface User {
  id: string;
  username: string;
  email: string;
  role: 'farmer' | 'seller' | 'admin';
  phone?: string;
}

export interface Seller {
  _id: string;
  user: User;
  businessName: string;
  businessType: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  phone: string;
}

export interface Product {
  _id: string;
  seller: Seller;
  name: string;
  category: 'food-crop' | 'horticultural' | 'industrial' | 'indigenous';
  type: 'seed' | 'seedling';
  description: string;
  price: number;
  stockQuantity: number;
  image?: string;
  averageRating: number;
  ratingCount: number;
  createdAt: string;
}

export interface Rating {
  _id: string;
  user: { _id: string; username: string };
  ratingValue: number;
  reviewText: string;
  createdAt: string;
}

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  buyer: { _id: string; username: string; email: string; phone?: string };
  seller: { _id: string; businessName: string; location: string; phone?: string };
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  phone: string;
  notes?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
