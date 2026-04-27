import { refreshAccessToken } from "./authHelpers";

export async function apiFetch(url, options = {}) {
    let accessToken = localStorage.getItem("accessToken");

    let res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            ...(accessToken && { Authorization: `Bearer ${accessToken}` })
        }
    });

    // 🔥 if unauthorized → try refresh
    if (res.status === 401) {
        const refreshed = await refreshAccessToken();

        if (refreshed) {
            accessToken = localStorage.getItem("accessToken");

            // 🔁 retry request
            res = await fetch(url, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {}),
                    ...(accessToken && { Authorization: `Bearer ${accessToken}` })
                }
            });
        } else {
            // ❌ no refresh → go login
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");

            window.location.href = "/account/login";
            return;
        }
    }

    return res;
}