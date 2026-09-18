import { createBrowserRouter, Navigate } from 'react-router-dom';

import StoreLayout from '../components/layout/StoreLayout';
import { ProtectedRoute, AdminRoute, GuestRoute } from '../components/layout/Guards';
import AdminLayout from '../components/admin/AdminLayout';
import NotFound from '../pages/NotFound';

import Home from '../pages/Home/Home';
import Shop from '../pages/Shop/Shop';
import ProductDetails from '../pages/Product/ProductDetails';
import Cart from '../pages/Cart/Cart';
import Wishlist from '../pages/Wishlist/Wishlist';
import Checkout from '../pages/Checkout/Checkout';
import Orders from '../pages/Orders/Orders';
import OrderDetails from '../pages/Orders/OrderDetails';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import ResetPassword from '../pages/Auth/ResetPassword';

import AdminDashboard from '../pages/Admin/Dashboard/Dashboard';
import AdminProducts from '../pages/Admin/Products/Products';
import AdminCategories from '../pages/Admin/Categories/Categories';
import AdminInventory from '../pages/Admin/Inventory/Inventory';
import AdminOrders from '../pages/Admin/Orders/Orders';
import AdminCustomers from '../pages/Admin/Customers/Customers';
import AdminReviews from '../pages/Admin/Reviews/Reviews';
import AdminCoupons from '../pages/Admin/Coupons/Coupons';
import AdminSettings from '../pages/Admin/Settings/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <StoreLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'shop', element: <Shop /> },
      { path: 'product/:slug', element: <ProductDetails /> },
      { path: 'cart', element: <Cart /> },
      { path: 'wishlist', element: <ProtectedRoute><Wishlist /></ProtectedRoute> },
      { path: 'checkout', element: <ProtectedRoute><Checkout /></ProtectedRoute> },
      { path: 'orders', element: <ProtectedRoute><Orders /></ProtectedRoute> },
      { path: 'orders/:id', element: <ProtectedRoute><OrderDetails /></ProtectedRoute> },
      { path: 'login', element: <GuestRoute><Login /></GuestRoute> },
      { path: 'register', element: <GuestRoute><Register /></GuestRoute> },
      { path: 'forgot-password', element: <GuestRoute><ForgotPassword /></GuestRoute> },
      { path: 'reset-password', element: <ResetPassword /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'products', element: <AdminProducts /> },
      { path: 'categories', element: <AdminCategories /> },
      { path: 'inventory', element: <AdminInventory /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'orders/:id', element: <AdminOrders detail /> },
      { path: 'customers', element: <AdminCustomers /> },
      { path: 'reviews', element: <AdminReviews /> },
      { path: 'coupons', element: <AdminCoupons /> },
      { path: 'settings', element: <AdminSettings /> },
    ],
  },
  { path: '/404', element: <NotFound /> },
  { path: '*', element: <Navigate to="/404" replace /> },
]);
