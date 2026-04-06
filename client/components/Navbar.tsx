'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-stone-900 text-stone-100 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-5 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
          <span className="text-emerald-400 text-xl">🌱</span>
          <span>Seed<span className="text-emerald-400">Locator</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link href="/products" className="px-3 py-2 rounded-lg hover:bg-stone-800 hover:text-white transition text-stone-300">
            Browse
          </Link>
          {user?.role === 'seller' && (
            <>
              <Link href="/dashboard/seller" className="px-3 py-2 rounded-lg hover:bg-stone-800 hover:text-white transition text-stone-300">
                My Products
              </Link>
              <Link href="/dashboard/seller/orders" className="px-3 py-2 rounded-lg hover:bg-stone-800 hover:text-white transition text-stone-300">
                Orders
              </Link>
            </>
          )}
          {user?.role === 'farmer' && (
            <Link href="/orders" className="px-3 py-2 rounded-lg hover:bg-stone-800 hover:text-white transition text-stone-300">
              My Orders
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link href="/dashboard/admin" className="px-3 py-2 rounded-lg hover:bg-stone-800 hover:text-white transition text-stone-300">
              Admin
            </Link>
          )}

          <div className="w-px h-5 bg-stone-700 mx-2" />

          {/* Cart */}
          <Link href="/cart" className="relative px-2 py-2 rounded-lg hover:bg-stone-800 transition text-stone-300">
            🛒
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/account" className="flex items-center gap-2 hover:opacity-80 transition">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="text-stone-300 text-xs">{user.username}</span>
              </Link>
              <button onClick={logout} className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition">
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-3 py-1.5 rounded-lg hover:bg-stone-800 text-stone-300 transition text-xs">
                Login
              </Link>
              <Link href="/register" className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition">
                Register
              </Link>
            </div>
          )}
        </div>

        <button className="md:hidden text-stone-300 hover:text-white p-1" onClick={() => setOpen(!open)}>
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-stone-800 px-5 py-3 flex flex-col gap-1 text-sm">
          <Link href="/products" onClick={() => setOpen(false)} className="py-2 text-stone-300 hover:text-white">Browse</Link>
          <Link href="/cart" onClick={() => setOpen(false)} className="py-2 text-stone-300 hover:text-white flex items-center gap-2">
            🛒 Cart {count > 0 && <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>}
          </Link>
          {user?.role === 'seller' && <Link href="/dashboard/seller" onClick={() => setOpen(false)} className="py-2 text-stone-300 hover:text-white">My Products</Link>}
          {user?.role === 'seller' && <Link href="/dashboard/seller/orders" onClick={() => setOpen(false)} className="py-2 text-stone-300 hover:text-white">Orders</Link>}
          {user?.role === 'farmer' && <Link href="/orders" onClick={() => setOpen(false)} className="py-2 text-stone-300 hover:text-white">My Orders</Link>}
          {user?.role === 'admin' && <Link href="/dashboard/admin" onClick={() => setOpen(false)} className="py-2 text-stone-300 hover:text-white">Admin</Link>}
          <div className="border-t border-stone-800 my-1" />
          {user ? (
            <>
              <Link href="/account" onClick={() => setOpen(false)} className="py-2 text-stone-300 hover:text-white">My Account</Link>
              <button onClick={() => { logout(); setOpen(false); }} className="py-2 text-left text-stone-300 hover:text-white">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="py-2 text-stone-300 hover:text-white">Login</Link>
              <Link href="/register" onClick={() => setOpen(false)} className="py-2 text-emerald-400 font-semibold">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
