import { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/ui/Toast"; // تأكد من المسار الصحيح للـ Toast الخاص بك

const ToastContext = createContext(null);

let globalShowToast = () => {};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  // حفظ الدالة في متغير خارجي للاستخدام خارج الـ components (زي ملف api.js)
  globalShowToast = showToast;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
// تصدير الدالة للاستخدام في ملفات الـ JS العادية
export { globalShowToast };
