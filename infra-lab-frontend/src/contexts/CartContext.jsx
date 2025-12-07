import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'infralab_cart';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems]);

  const addToCart = (device, quantity) => {
    setCartItems(prevItems => {
      // Check if device already exists in cart
      const existingItemIndex = prevItems.findIndex(item => item.device._id === device._id);
      
      if (existingItemIndex >= 0) {
        // Update quantity if device already in cart
        const updatedItems = [...prevItems];
        const maxAvailable = device.inventory?.available || 0;
        const newQuantity = Math.min(
          updatedItems[existingItemIndex].quantity + quantity,
          maxAvailable
        );
        updatedItems[existingItemIndex].quantity = newQuantity;
        return updatedItems;
      } else {
        // Add new item to cart
        return [...prevItems, { device, quantity }];
      }
    });
  };

  const removeFromCart = (deviceId) => {
    setCartItems(prevItems => prevItems.filter(item => item.device._id !== deviceId));
  };

  const updateQuantity = (deviceId, quantity) => {
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.device._id === deviceId) {
          const maxAvailable = item.device.inventory?.available || 0;
          return {
            ...item,
            quantity: Math.min(Math.max(1, quantity), maxAvailable)
          };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartCount = () => {
    // Return number of unique products (types), not total quantity
    return cartItems.length;
  };

  const getCartTotalQuantity = () => {
    // Return total quantity of all items
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cartItems.length;
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartCount,
    getCartTotalQuantity,
    getCartTotal
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

