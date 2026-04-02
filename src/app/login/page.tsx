"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { User, KeyRound, LogIn, UserPlus } from "lucide-react";

export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!loginId || !password) {
      setError("IDとパスワードを入力してください");
      return;
    }

    // 英数字のみかチェック（簡易的）
    if (!/^[a-zA-Z0-9_]+$/.test(loginId)) {
        setError("IDは英数字とアンダーバーのみ使用できます");
        return;
    }

    const email = `${loginId.toLowerCase()}@soccer-reflex.com`;

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("IDまたはパスワードが間違っています");
      } else if (err.code === "auth/email-already-in-use") {
        setError("このIDはすでに使われています");
      } else if (err.code === "auth/weak-password") {
        setError("パスワードは6文字以上にしてください");
      } else {
        setError("エラーが発生しました: " + err.message);
      }
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.9)), url("https://images.unsplash.com/photo-1518605368461-1e1e11411545?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div 
        className="w-full max-w-md p-8 sm:p-10 rounded-3xl relative overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>

        <div className="text-center mb-8">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-md mb-4 shadow-lg border border-white/30">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>SoccerReflex</h1>
          <p className="text-blue-100 font-medium">
            {isRegistering ? "選手データを記録するアカウントを作成" : "AIコーチと一緒に振り返りを始めよう"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-md border border-red-500/50 text-red-100 text-sm rounded-xl text-center font-medium animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-white/90 mb-2 ml-1 tracking-wide">
              ログインID <span className="text-white/60 font-normal">(英数字)</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                <User className="h-5 w-5 text-blue-300" />
              </div>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="block w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/20 transition-all outline-none"
                placeholder={isRegistering ? "好きなIDを決めてください (例: taro123)" : "IDを入力"}
              />
            </div>
            {isRegistering && (
                <p className="text-xs text-white/60 mt-2 ml-1" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '1.2em' }}>💡</span> 保護者の方はIDに「admin」を入れてください
                </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-white/90 mb-2 ml-1 tracking-wide">
              パスワード <span className="text-white/60 font-normal">(6文字以上)</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                <KeyRound className="h-5 w-5 text-blue-300" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/20 transition-all outline-none"
                placeholder="••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full relative overflow-hidden group flex justify-center items-center gap-2 py-4 px-4 rounded-2xl text-base font-bold text-white transition-all transform hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 mt-8"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)',
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)'
            }}
          >
            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
            {isRegistering ? (
              <><UserPlus className="h-5 w-5 relative z-10" /> <span className="relative z-10">新しくアカウントを作る</span></>
            ) : (
              <><LogIn className="h-5 w-5 relative z-10" /> <span className="relative z-10">自分の記録を開く</span></>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/20 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-white/80 hover:text-white font-bold transition-colors border-b border-transparent hover:border-white pb-1"
          >
            {isRegistering
              ? "すでにアカウントを持っている方はこちら"
              : "初めての方はこちらからアカウント作成"}
          </button>
        </div>
      </div>
    </div>
  );
}
