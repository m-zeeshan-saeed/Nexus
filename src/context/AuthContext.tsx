/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from "react";
import { User, UserRole, AuthContextType } from "../types";
import api from "../services/api";
import toast from "react-hot-toast";

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = "business_nexus_user";
const TOKEN_STORAGE_KEY = "business_nexus_token";

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user and token on initial load
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);

      console.log("Initializing auth from storage:", {
        hasUser: !!storedUser,
        hasToken: !!token,
      });

      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Verify session with backend and get most up-to-date profile
          console.log("Verifying token with backend...");
          const res = await api.get("/users/profile");
          setUser(res.data);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.data));
          console.log("Session restored successfully");
        } catch (error) {
          console.error("Failed to restore auth session:", error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Listen for storage changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_STORAGE_KEY || e.key === USER_STORAGE_KEY) {
        console.log(
          "Storage change detected in another tab, syncing auth state...",
        );
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);

        if (!token || !storedUser) {
          // If token or user removed in another tab, logout here too
          console.log("Auth cleared in another tab, logging out...");
          setUser(null);
        } else {
          try {
            const parsedUser = JSON.parse(storedUser);
            // Only update if it's actually different to avoid unnecessary re-renders
            if (JSON.stringify(parsedUser) !== JSON.stringify(user)) {
              console.log(
                "User data changed in another tab, updating state...",
              );
              setUser(parsedUser);
            }
          } catch (error) {
            console.error("Failed to parse synced user data:", error);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]);

  // Login function
  const login = async (
    email: string,
    password: string,
    role: UserRole,
  ): Promise<{ requires2FA?: boolean; tempToken?: string } | void> => {
    setIsLoading(true);
    console.log("Attempting login for:", email, "Role:", role);
    try {
      const response = await api.post("/auth/login", { email, password });
      console.log("Login success:", response.data);
      const { token, user: userData, requires2FA, tempToken } = response.data;

      if (requires2FA) {
        toast.success("Verification code required to continue");
        return { requires2FA, tempToken };
      }

      if (userData.role !== role) {
        console.warn(
          "Role mismatch. User is:",
          userData.role,
          "expected:",
          role,
        );
        throw new Error(
          `Account found but role is ${userData.role}, not ${role}`,
        );
      }

      setUser(userData);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);

      toast.success("Successfully logged in!");
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: { message?: string; errors?: Array<{ msg: string }> };
        };
        message?: string;
      };

      let message =
        err.response?.data?.message || err.message || "Login failed";

      if (
        err.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        const detail = err.response.data.errors.map((e) => e.msg).join(". ");
        message = `${message}: ${detail}`;
      }

      console.error("Login failed:", message);
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ): Promise<void> => {
    setIsLoading(true);
    console.log("Registering user:", email);
    try {
      await api.post("/auth/register", { name, email, password, role });
      console.log("Registration success, logging in...");
      await login(email, password, role);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        err.response?.data?.message || err.message || "Registration failed";
      console.error("Registration failed:", message);
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      if (response.data.resetToken) {
        localStorage.setItem(
          "business_nexus_reset_token",
          response.data.resetToken,
        );
        console.log("Demo Reset Token:", response.data.resetToken);
      }
      toast.success("Password reset instructions sent to your email");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err.response?.data?.message || "Failed to send reset email";
      toast.error(message);
      throw new Error(message);
    }
  };

  // Reset password function
  const resetPassword = async (
    token: string,
    newPassword: string,
  ): Promise<void> => {
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      toast.success("Password reset successfully");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || "Reset failed";
      toast.error(message);
      throw new Error(message);
    }
  };

  // Logout function
  const logout = (): void => {
    console.log("Logging out...");
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    toast.success("Logged out successfully");
  };

  // Update user profile
  const updateProfile = async (
    _userId: string,
    updates: Partial<User>,
  ): Promise<void> => {
    try {
      const response = await api.put("/users/profile", updates);
      const updatedUser = response.data;
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        err.response?.data?.message || err.message || "Update failed";
      toast.error(message);
      throw new Error(message);
    }
  };

  // Change password function
  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    try {
      await api.put("/users/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password updated successfully");
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: { message?: string; errors?: Array<{ msg: string }> };
        };
      };

      let message = err.response?.data?.message || "Failed to update password";

      if (
        err.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        const detail = err.response.data.errors.map((e) => e.msg).join(". ");
        message = `${message}: ${detail}`;
      }

      toast.error(message);
      throw new Error(message);
    }
  };

  // 2FA Setup
  const setup2FA = async (): Promise<void> => {
    try {
      await api.post("/auth/2fa/setup");
      toast.success("Verification code sent to your email");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || "Failed to send 2FA code";
      toast.error(message);
      throw new Error(message);
    }
  };

  // 2FA Enable
  const enable2FA = async (otp: string): Promise<void> => {
    try {
      await api.post("/auth/2fa/enable", { otp });
      const updatedUser = { ...user, isTwoFactorEnabled: true } as User;
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      toast.success("Two-factor authentication enabled");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || "Failed to enable 2FA";
      toast.error(message);
      throw new Error(message);
    }
  };

  // 2FA Disable
  const disable2FA = async (): Promise<void> => {
    try {
      await api.post("/auth/2fa/disable");
      const updatedUser = { ...user, isTwoFactorEnabled: false } as User;
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      toast.success("Two-factor authentication disabled");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || "Failed to disable 2FA";
      toast.error(message);
      throw new Error(message);
    }
  };

  // 2FA Validate Login
  const validate2FALogin = async (
    tempToken: string,
    otp: string,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/2fa/validate-login", {
        tempToken,
        otp,
      });
      const { token, user: userData } = response.data;

      setUser(userData);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      toast.success("Successfully logged in!");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err.response?.data?.message || "Invalid verification code";
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    setup2FA,
    enable2FA,
    disable2FA,
    validate2FALogin,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
