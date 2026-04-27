import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import loginImage from "../assets/signin-image.png";

export default function LoginPage() {
  const [form, setForm] = useState({
    UserName: "",
    Password: "",
    RememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
    } catch (err) {
      setError(err.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-5 md:grid-cols-2  items-center bg-[#BDE8F5]/40 gap-y-4 min-h-screen">
      {/* Left Side Image */}
      <div className="max-md:order-1 lg:col-span-3 md:h-screen w-full bg-[#000842] md:rounded-tr-xl md:rounded-br-xl lg:p-12 p-8">
        <img
          src={loginImage}
          className="lg:w-2/3 w-full h-full object-contain block mx-auto"
          alt="login"
        />
      </div>

      {/* Right Side Form */}
      <div className="lg:col-span-2 w-full bg-[#1C4D8D]/80 md:rounded-xl  p-8 max-w-lg mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <h1 className="text-slate-900 text-3xl font-bold">Sign in</h1>
          </div>

          <div className="space-y-6">
            {/* Username */}
            <div>
              <label className="text-slate-900 text-[15px] font-medium mb-2 block">
                Username
              </label>
              <input
                name="UserName"
                value={form.UserName}
                onChange={handleChange}
                placeholder="Enter username"
                className="w-full text-sm text-slate-900 bg-slate-100 focus:bg-transparent px-4 py-3.5 rounded-md border border-gray-200 focus:border-blue-600 outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-slate-900 text-[15px] font-medium mb-2 block">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  name="Password"
                  type={showPassword ? "text" : "password"}
                  value={form.Password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full text-sm text-slate-900 bg-slate-100 focus:bg-transparent pl-4 pr-10 py-3.5 rounded-md border border-gray-200 focus:border-blue-600 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                name="RememberMe"
                checked={form.RememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-slate-300 rounded"
              />
              <label
                htmlFor="rememberMe"
                className="ml-3 text-[15px] text-slate-900"
              >
                Remember me
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-center text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-[15px] font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? "جاري تسجيل الدخول..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
