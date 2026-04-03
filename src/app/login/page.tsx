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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!loginId || !password) {
      setError("IDとパスワードを入力してください");
      setIsLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(loginId)) {
        setError("IDは英数字とアンダーバーのみ使用できます");
        setIsLoading(false);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(rgba(240, 249, 255, 0.7), rgba(224, 242, 254, 0.9)), url("https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: 'var(--text-main)'
      }}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '40px',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          border: 'none',
          borderRadius: '24px'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '6px',
          background: 'var(--primary-gradient)'
        }}></div>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', justifyContent: 'center', alignItems: 'center',
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'var(--primary-gradient)',
            marginBottom: '16px',
            boxShadow: '0 8px 16px rgba(59,130,246,0.3)',
          }}>
            <User size={40} color="white" />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px', color: '#0f172a', letterSpacing: '-0.02em' }}>SoccerReflex</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>
            {isRegistering ? "選手データを記録するアカウントを作成" : "AIコーチと一緒に振り返りを始めよう"}
          </p>
        </div>

        {error && (
          <div style={{
            marginBottom: '24px', padding: '16px', background: '#fee2e2', color: '#b91c1c',
            borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.95rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '1rem', fontWeight: 'bold', color: '#334155' }}>
              ログインID <span style={{ fontWeight: 'normal', fontSize: '0.85rem', color: '#64748b' }}>(英数字)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', color: '#94a3b8' }}>
                <User size={22} />
              </div>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '48px', height: '56px', fontSize: '1.1rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                placeholder={isRegistering ? "好きなID (例: taro123)" : "IDを入力"}
              />
            </div>
            {isRegistering && (
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <span style={{ fontSize: '1.3em' }}>💡</span> 保護者の方はIDに「admin」を入れてください
                </p>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '1rem', fontWeight: 'bold', color: '#334155' }}>
              パスワード <span style={{ fontWeight: 'normal', fontSize: '0.85rem', color: '#64748b' }}>(6文字以上)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', color: '#94a3b8' }}>
                <KeyRound size={22} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '48px', height: '56px', fontSize: '1.1rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                placeholder="••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ height: '60px', fontSize: '1.2rem', marginTop: '16px', borderRadius: '16px', opacity: isLoading ? 0.7 : 1 }}
          >
            {isRegistering ? (
              <><UserPlus size={24} /> 新しくアカウントを作る</>
            ) : (
              <><LogIn size={24} /> {isLoading ? "ログイン中..." : "ログイン"}</>
            )}
          </button>
        </form>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
            style={{
              background: 'none', border: 'none', color: 'var(--primary-color)',
              fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', padding: '8px'
            }}
          >
            {isRegistering
              ? "すでにアカウントをお持ちの場合はこちら"
              : "初めての方はこちらからアカウント作成"}
          </button>
        </div>
      </div>
    </div>
  );
}
