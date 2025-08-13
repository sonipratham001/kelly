// src/contexts/BluetoothPopupContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface BluetoothPopupContextType {
  isVisible: boolean;
  showPopup: () => void;
  hidePopup: () => void;
}

const BluetoothPopupContext = createContext<BluetoothPopupContextType | undefined>(undefined);

export const useBluetoothPopup = () => {
  const context = useContext(BluetoothPopupContext);
  if (!context) throw new Error('useBluetoothPopup must be used within BluetoothPopupProvider');
  return context;
};

export const BluetoothPopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);

  const showPopup = () => setIsVisible(true);
  const hidePopup = () => setIsVisible(false);

  return (
    <BluetoothPopupContext.Provider value={{ isVisible, showPopup, hidePopup }}>
      {children}
    </BluetoothPopupContext.Provider>
  );
};