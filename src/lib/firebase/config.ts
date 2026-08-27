import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Firebase Web SDK 設定。
// これらの値はクライアントバンドルに埋め込まれる公開情報であり、秘匿する必要はない。
// セキュリティは Firestore ルールと Firebase Auth の認可ドメインで担保される。
//
// aws-feed / azure-feed とは別の Firebase プロジェクトを使う。既読データのキー (postId) が
// "YYYY/MM/DD/YYYY-MM-DD-news" 形式で両サイト共通のため、同じプロジェクトを
// 共有すると 各サイトの既読が混ざってしまう。
//
// 値はクライアントに配信される公開情報なのでフォールバックとして直接持つ。
// ローカルで別プロジェクトに向けたい場合は .env.local（git 管理外）で上書きする。
const rawConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyCDL4FatQSnh9kCjeaFm7usiEt4vvSlMLs',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'gcp-feed.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'gcp-feed',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'gcp-feed.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '267239512751',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:267239512751:web:205e5eae515c60b286125a',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-YGSQGM38K4',
};

/**
 * Firebase の設定が投入済みかどうか。
 * false の間はログイン UI を出さず、既読は localStorage のみで動作させる。
 */
export const isFirebaseConfigured = Boolean(rawConfig.apiKey && rawConfig.appId);

// 未設定のまま getAuth() を呼ぶと auth/invalid-api-key で静的書き出しが落ちるため、
// ダミー値で初期化だけ通す。機能の有効・無効は isFirebaseConfigured で制御する。
const firebaseConfig = isFirebaseConfigured
  ? rawConfig
  : { ...rawConfig, apiKey: 'not-configured', appId: 'not-configured' };

// Next.js の Fast Refresh / SSR で多重初期化されないようにする
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
