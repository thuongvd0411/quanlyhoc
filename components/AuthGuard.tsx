
import React, { useState, useEffect } from 'react';

const API_URL = "https://script.google.com/macros/s/AKfycbzojyLK8je1IsaOZWh18ljiw4Nb7sQt4wcWITrn6HmRIAAw2iZ0sw0Z4RBWqf3JIdeDwA/exec";

interface Props {
  children: React.ReactNode;
}

const AuthGuard: React.FC<Props> = ({ children }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  // Helper: Get or Create Device ID
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('edu_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('edu_device_id', deviceId);
    }
    return deviceId;
  };

  // Helper: Call API
  const verifyLicense = async (inputToken: string) => {
    setIsChecking(true);
    setError('');
    
    try {
      const deviceId = getDeviceId();
      const deviceInfo = navigator.userAgent;
      
      // Construct URL with query parameters
      const url = new URL(API_URL);
      url.searchParams.append('token', inputToken);
      url.searchParams.append('deviceId', deviceId);
      url.searchParams.append('deviceInfo', deviceInfo);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.ok) {
        setIsVerified(true);
        localStorage.setItem('edu_license_token', inputToken);
      } else {
        setIsVerified(false);
        setError(data.message || 'Lỗi xác thực không xác định.');
        // If the saved token is invalid, clear it so user can re-enter
        if (inputToken === localStorage.getItem('edu_license_token')) {
            localStorage.removeItem('edu_license_token');
        }
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra mạng.');
    } finally {
      setIsChecking(false);
      setIsLoading(false);
    }
  };

  // Effect: Check for saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('edu_license_token');
    if (savedToken) {
      setToken(savedToken);
      verifyLicense(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    verifyLicense(token.trim());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Đang xác thực bản quyền...</p>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-[40px] shadow-2xl border border-slate-100 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg mx-auto mb-6">E</div>
        
        <h1 className="text-2xl font-black text-slate-900 mb-2">SmartEducation</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Hệ Thống Quản Lý Giáo Dục v5</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã kích hoạt bản quyền</label>
            <input 
              type="text" 
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setError('');
              }}
              placeholder="Nhập mã token..." 
              className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition text-center text-lg"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-left">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p className="text-xs font-bold text-red-600 leading-relaxed">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isChecking || !token}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-200"
          >
            {isChecking ? 'Đang Kiểm Tra...' : 'Kích Hoạt Ứng Dụng'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50">
          <p className="text-[10px] text-slate-300 font-bold">Device ID: <span className="font-mono">{getDeviceId()}</span></p>
        </div>
      </div>
    </div>
  );
};

export default AuthGuard;
