/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-empty */
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 🔑 helpers
    const getAccessToken = () => localStorage.getItem("accessToken");
    const getRefreshToken = () => localStorage.getItem("refreshToken");

    const saveTokens = (data) => {
        localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken)
            localStorage.setItem("refreshToken", data.refreshToken);
    };

    const clearTokens = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    };

    // 🔁 refresh token
    const refreshAccessToken = async () => {
        const refreshToken = getRefreshToken();
        if (!refreshToken) return false;

        try {
            const res = await fetch("/api/account/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken })
            });

            if (!res.ok) return false;

            const data = await res.json();
            saveTokens(data);
            return true;
        } catch {
            return false;
        }
    };

    // 👤 get current user
    const fetchUser = async () => {
        let token = getAccessToken();
        
        if (!token) {
            setLoading(false);
            return;
        }
        let res = await fetch("/api/account/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        // 🔥 if expired → try refresh
        if (res.status === 401) {
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
                clearTokens();
                setUser(null);
                setLoading(false);
                return;
            }

            token = getAccessToken();

            res = await fetch("/api/account/me", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        }
        if (res.ok) {
            const data = await res.json();
            setUser(data);
        } else {
            setUser(null);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchUser();
    }, []);

    // 🔐 login
    const login = async (form) => {
        const res = await fetch("/api/account/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
              
            throw new Error(data.message || "Login failed");
        }

        saveTokens(data);
        await fetchUser();

        navigate("/", { replace: true });
    };

    // 🚪 logout
    const logout = async () => {
        const refreshToken = getRefreshToken();

        try {
            if (refreshToken) {
                await fetch("/api/account/logout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refreshToken })
                });
            }
        } catch { }

        clearTokens();
        setUser(null);
        navigate("/account/login", { replace: true });
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);