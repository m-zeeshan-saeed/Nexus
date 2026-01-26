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

  // Login function
  const login = async (
    email: string,
    password: string,
    role: UserRole,
  ): Promise<void> => {
    setIsLoading(true);
    console.log("Attempting login for:", email, "Role:", role);
    try {
      const response = await api.post("/auth/login", { email, password });
      console.log("Login success:", response.data);
      const { token, user: userData } = response.data;

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
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        err.response?.data?.message || err.message || "Login failed";
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
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err.response?.data?.message || "Failed to update password";
      toast.error(message);
      throw new Error(message);
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
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
