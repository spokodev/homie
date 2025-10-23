import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  /** Toast visibility */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Toast type */
  type?: ToastType;
  /** Toast message */
  message: string;
  /** Duration in ms (0 = manual close only) */
  duration?: number;
  /** Position */
  position?: 'top' | 'bottom';
}

export function Toast({
  visible,
  onClose,
  type = 'info',
  message,
  duration = 3000,
  position = 'top',
}: ToastProps) {
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();

      // Auto-dismiss after duration
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          handleClose();
        }, duration);
      }
    } else {
      // Animate out
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: position === 'top' ? -100 : 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const config = {
    success: {
      icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
      backgroundColor: Colors.success,
      iconColor: Colors.white,
    },
    error: {
      icon: 'close-circle' as keyof typeof Ionicons.glyphMap,
      backgroundColor: Colors.error,
      iconColor: Colors.white,
    },
    warning: {
      icon: 'warning' as keyof typeof Ionicons.glyphMap,
      backgroundColor: Colors.warning,
      iconColor: Colors.white,
    },
    info: {
      icon: 'information-circle' as keyof typeof Ionicons.glyphMap,
      backgroundColor: Colors.primary,
      iconColor: Colors.white,
    },
  }[type];

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.top : styles.bottom,
        { transform: [{ translateY }] },
        { backgroundColor: config.backgroundColor },
      ]}
    >
      <Ionicons name={config.icon} size={24} color={config.iconColor} />
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={config.iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Toast Context & Hook for global toast management
 */
import { createContext, useContext, useState, ReactNode } from 'react';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
    duration: number;
  }>({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
  });

  const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    setToast({ visible: true, message, type, duration });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: Spacing.sm,
  },
  top: {
    top: Platform.OS === 'ios' ? 60 : Spacing.xl,
  },
  bottom: {
    bottom: Platform.OS === 'ios' ? 100 : Spacing.xl,
  },
  message: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.white,
    fontWeight: '500',
  },
  closeButton: {
    padding: Spacing.xs,
  },
});
