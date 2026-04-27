let refreshPromise = null;

export const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;

    try {
        // 🔥 prevent multiple refresh calls at same time
        if (!refreshPromise) {
            refreshPromise = fetch("/api/account/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken })
            })
            .then(async (res) => {
                if (!res.ok) throw new Error();

                const data = await res.json();

                localStorage.setItem("accessToken", data.accessToken);
                if (data.refreshToken) {
                    localStorage.setItem("refreshToken", data.refreshToken);
                }

                return true;
            })
            .catch(() => false)
            .finally(() => {
                refreshPromise = null;
            });
        }

        return await refreshPromise;
    } catch {
        return false;
    }
};