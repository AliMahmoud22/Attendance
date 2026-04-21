import { useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logoImage  from "../assets/1950-hospital-removebg-preview.png";
import { Sun,Moon } from "lucide-react";

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [theme,setTheme] = useState("light");
    const { user, logout } = useAuth();
    const isAuth = !!user;

    const toggleTheme = ()=>{
        const newTheme = theme == "light" ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark", newTheme == "dark" );
        localStorage.setItem("theme",newTheme);
    }

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme") || "light";
        setTheme(storedTheme);
        document.documentElement.classList.toggle("dark",storedTheme=="dark");
        // const header = document.getElementById("header");
        // const main = document.getElementById("main-content");
        // const setPad = () => {
        //     if (!header || !main) return;
        //     main.style.paddingTop = `${header.offsetHeight}px`;
        // };

        // setPad();

        // const ro = new ResizeObserver(setPad);
        // if (header) ro.observe(header);
        // window.addEventListener("resize", setPad);

        // return () => {
        //     ro.disconnect();
        //     window.removeEventListener("resize", setPad);
        // };
    }, []);

    return (
        <motion.header
            id="header"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            // className="fixed top-0 left-0 w-full z-50 backdrop-blur-sm shadow-sm bg-[#1C4D8D]/90 dark:bg-[#0f172a]/90"
            className="
            fixed top-0 left-0 w-full z-50 
            backdrop-blur-md shadow-md
            bg-[#1C4D8D]/95 dark:bg-gray-900/95
            border-b border-white/10 dark:border-gray-700"
        >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between py-3 gap-3">
                    {/* Left side: return + logo */}
                        
                    <div className="flex items-center gap-10">
                        {/* <button onClick={toggleTheme} className="rounded-full p-2 shadow-md shadow-green-400 cursor-pointer text-gray-600 hover:text-green-400 transition-all ease-in-out">
                            {theme =="light"?<Moon/> : <Sun/>}
                            </button> */}
                            <button
                                onClick={toggleTheme}
                                className="rounded-full p-2 border border-gray-300 dark:border-gray-600 
                                text-gray-600 bg-gray-100 dark:bg-[#0f172a]/90 dark:text-gray-300 cursor-pointer
                                hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                                >
                                {theme === "light" ? <Moon size={20}/> : <Sun size={20 }/>}
                            </button>
                        <Link to="/" className="flex items-center text-lg sm:text-2xl font-bold text-white">
                       
                            <img
                                src={logoImage}
                                className="h-8 sm:h-10 w-auto"
                                alt="Logo"
                            />
                            <span className="ms-2 hidden sm:inline">الصفحة الرئيسية</span>
                        </Link>
                    </div>

                    {/* Right side: desktop nav */}
                    <nav className="hidden md:flex items-center space-x-4 space-x-reverse">
                        {isAuth ? (
                            <button
                                onClick={logout}
                                className="px-3 py-1 rounded border border-red-200 font-bold text-gray-600 hover:bg-white/80 bg-white hover:text-gray-400 transition-all"
                            >
                                تسجيل الخروج
                            </button>
                        ) : (
                            <Link to="/account/login" className="px-3 py-2 rounded border border-white bg-white text-green-800 font-bold  hover:bg-white/40 transition">تسجيل دخول</Link>
          
                        )}
                    </nav>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden text-white"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        <i className="bi bi-list text-2xl"></i>
                    </button>
                </div>

                {/* Mobile menu dropdown with animation */}
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="md:hidden overflow-hidden flex flex-col space-y-2 pb-3"
                        >
                            {isAuth ? (
                                <button onClick={logout}>
                                    تسجيل الخروج
                                </button>
                            ) : (
                                    <Link to="/account/login" className="px-3 py-2 rounded border border-white font-bold text-white hover:bg-white/40 transition" >تسجيل دخول</Link>

                                

                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.header>
    );
}
