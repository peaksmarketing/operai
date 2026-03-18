'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase-browser';

const P = "#2b6876";

function FiLink() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>; }
function FiLayers() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>; }
function FiShield() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>; }
function FiTrend() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>; }

const features = [
  { Ic: FiLink, title: "業務フローをAIが自動接続", desc: "受注・請求・仕訳をAIが一気通貫で自動処理" },
  { Ic: FiLayers, title: "AI統合モジュール管理", desc: "営業・在庫・会計・人事をAIが横断分析" },
  { Ic: FiTrend, title: "AI経営参謀でリアルタイム分析", desc: "売上予測・異常検知・回収リスクをAIが自動診断" },
  { Ic: FiShield, title: "中小企業に最適なAI設計", desc: "専任IT不要、AIがデータを自動で統合・最適化" },
];

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // login or signup
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async () => {
    if (!email || !pass) { setError('メールアドレスとパスワードを入力してください'); return; }
    setLoading(true);
    setError('');

    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({ email, password: pass });
      if (err) { setError(err.message); setLoading(false); return; }
      setError('');
      alert('確認メールを送信しました。メール内のリンクをクリックしてアカウントを有効化してください。');
      setMode('login');
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (err) { setError('メールアドレスまたはパスワードが正しくありません'); setLoading(false); return; }
    router.push('/dashboard');
  };

  const handleDemo = async () => {
    setLoading(true);
    setError('');
    // Demo login with a pre-set demo account
    const { error: err } = await supabase.auth.signInWithPassword({
      email: 'demo@operai.app',
      password: 'demo1234',
    });
    if (err) {
      // If demo account doesn't exist, create it
      const { error: signUpErr } = await supabase.auth.signUp({
        email: 'demo@operai.app',
        password: 'demo1234',
        options: { data: { name: '管理者', role: 'company' } },
      });
      if (signUpErr) { setError('デモアカウントの作成に失敗しました'); setLoading(false); return; }
      // Try login again
      const { error: retryErr } = await supabase.auth.signInWithPassword({
        email: 'demo@operai.app',
        password: 'demo1234',
      });
      if (retryErr) { setError('デモログインに失敗しました。しばらくしてから再度お試しください。'); setLoading(false); return; }
    }
    router.push('/dashboard');
  };

  const inputSt = {
    width: '100%', padding: '12px 14px',
    border: '1px solid #e0e0de', borderRadius: 10,
    fontSize: 14, background: '#fff', color: '#1a1a1a',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8f8f6' }}>
      {/* Left Panel */}
      <div style={{
        flex: '0 0 480px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 56px',
        background: `linear-gradient(160deg, ${P} 0%, #1e4f5a 50%, #1a3d47 100%)`,
        color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -120, left: -60, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 56 }}>
            <img src="/logo.svg" alt="Operai" style={{ height: 56, filter: 'brightness(0) invert(1)' }} />
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.35, margin: '0 0 16px', letterSpacing: -0.5 }}>
            AIが経営を自動化する、<br />統合業務プラットフォーム。
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.65)', margin: '0 0 44px', maxWidth: 340 }}>
            二重入力・転記ミス・Excelの限界。<br />
            OperaiのAIが業務データを統合・分析し、<br />
            受注から決算まで自動で実行。<br />
            経営判断をリアルタイムに支援します。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {features.map((f, i) => {
              const FIcon = f.Ic;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <FIcon />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{f.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 40 }}>
          &copy; {new Date().getFullYear()} Peaks Marketing Co., Ltd.
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: '#1a1a1a' }}>
              {mode === 'signup' ? 'アカウント作成' : 'アカウントにログイン'}
            </h2>
            <p style={{ fontSize: 14, color: '#999', margin: 0 }}>
              {mode === 'signup' ? 'Operaiのアカウントを作成します' : 'Operaiで業務を開始しましょう'}
            </p>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fdecea', color: '#A32D2D', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>メールアドレス</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.co.jp" style={inputSt}
                onFocus={e => { e.target.style.borderColor = P; }} onBlur={e => { e.target.style.borderColor = '#e0e0de'; }}
                onKeyDown={e => { if (e.key === 'Enter') handleAuth(); }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>パスワード</label>
              <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="••••••••" style={inputSt}
                onFocus={e => { e.target.style.borderColor = P; }} onBlur={e => { e.target.style.borderColor = '#e0e0de'; }}
                onKeyDown={e => { if (e.key === 'Enter') handleAuth(); }} />
            </div>

            <button onClick={handleAuth} disabled={loading}
              style={{ width: '100%', padding: '13px 0', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', background: P, color: '#fff', opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s', marginTop: 4 }}>
              {loading ? '処理中...' : mode === 'signup' ? 'アカウント作成' : 'ログイン'}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              style={{ border: 'none', background: 'none', color: P, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              {mode === 'signup' ? 'すでにアカウントをお持ちの方' : 'アカウントを新規作成'}
            </button>
          </div>

          <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 24, lineHeight: 1.8 }}>
            ログインすることで、<a href="/terms" style={{ color: '#999', textDecoration: 'underline' }}>利用規約</a>および<a href="https://peaksmarketing.co.jp/privacy/" target="_blank" rel="noopener" style={{ color: '#999', textDecoration: 'underline' }}>プライバシーポリシー</a>に同意したものとみなされます。
          </p>
        </div>
      </div>
    </div>
  );
}
