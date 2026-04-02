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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SoccerReflex</h1>
          <p className="text-gray-500">
            {isRegistering ? "新しいアカウントを作成" : "あなたのアカウントにログイン"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ログインID (英数字)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                placeholder="taro123"
              />
            </div>
            {isRegistering && <p className="text-xs text-gray-500 mt-1">好きなIDを決めて入力してください</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード (6文字以上)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {isRegistering ? (
              <><UserPlus className="h-5 w-5" /> アカウント作成</>
            ) : (
              <><LogIn className="h-5 w-5" /> ログイン</>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {isRegistering
              ? "すでにアカウントを持っている場合はログイン画面へ"
              : "初めての方はこちらからアカウント作成"}
          </button>
        </div>
      </div>
    </div>
  );
}
