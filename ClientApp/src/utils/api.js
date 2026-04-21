export async function apiFetch(url, options = {}) {
    const accessToken = localStorage.getItem("accessToken");

    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            ...(accessToken && { Authorization: `Bearer ${accessToken}` })
        }
    });

    if (res.status === 401) {
        // optional: redirect to login
        console.warn("Unauthorized");
    }

    return res;
}