import { useEffect, useState } from "react";

export type AuthStatus = "loading" | "error" | "unauthenticated" | "authenticated";

export interface IUser {
    id: number;
    username: string;
    repsetUserId: string | null;
    repsetSelectedCompanyId: string | null;
}

export const useAuth = () => {
    const [status, setStatus] = useState<AuthStatus>("loading");
    const [user, setUser] = useState<IUser | null>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const res = await fetch("/api/users/me");
        if (res.status === 401) {
            setStatus("unauthenticated");
            return;
        }

        if (!res.ok) {
            setStatus("error");
            return;
        }

        const u = await res.json();
        setUser(u);
        setStatus("authenticated");
    };

    const login = async (username: string, password: string): Promise<boolean> => {
        const body = JSON.stringify({ username, password });

        const res = await fetch("/api/users/login", {
            method: "POST",
            body: body,
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (res.status === 401) {
            setStatus("unauthenticated");
            return false;
        }

        if (!res.ok) {
            setStatus("error");
            return false;
        }

        const u = await res.json();
        setUser(u);
        setStatus("authenticated");
        return true;
    };

    const logout = async () => {
        await fetch("/api/users/logout", { method: "POST" });
        setUser(null);
        setStatus("unauthenticated");
    };

    return {
        status,
        user,

        checkAuth,
        login,
        logout,
    };
};
