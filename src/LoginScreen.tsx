
import { useState, useEffect } from 'react';
import { supabase } from './supabase-client';
import { Lock, Mail, Loader2, User, ArrowRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import zxcvbn from 'zxcvbn';

export default function LoginScreen() {
    const [isSignUp, setIsSignUp] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // 🔒 متغيرات الحماية من التخمين
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockTimer, setLockTimer] = useState(0);

    // حالة قوة كلمة المرور
    const [passwordStrength, setPasswordStrength] = useState('');

    // التحقق من حالة القفل عند التخمين الخاطئ
    useEffect(() => {
        if (failedAttempts >= 5) {
            setIsLocked(true);
            setLockTimer(120); // قفل لمدة 120 ثانية
            const interval = setInterval(() => {
                setLockTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setIsLocked(false);
                        setFailedAttempts(0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [failedAttempts]);

    // تحديث قوة كلمة المرور عند تغييرها
    useEffect(() => {
        if (password) {
            const result = zxcvbn(password);
            setPasswordStrength(result.score < 3 ? 'ضعيفة' : 'قوية');
        } else {
            setPasswordStrength('');
        }
    }, [password]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        // منع المحاولة إذا كان الحساب مقفلاً مؤقتاً
        if (isLocked) return;

        // ✅ التحقق من تطابق كلمات المرور في التسجيل
        if (isSignUp && password !== confirmPassword) {
            setError('كلمات المرور غير متطابقة!');
            return;
        }

        // ✅ التحقق من قوة كلمة المرور في التسجيل
        if (isSignUp) {
            const result = zxcvbn(password);
            if (result.score < 3) {
                setError('كلمة المرور ضعيفة جداً! يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز.');
                return;
            }
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            if (isSignUp) {
                // --- إنشاء حساب جديد ---
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email: email.trim(),
                    password: password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });

                if (signUpError) throw signUpError;
                if (data.session) {
                    return;
                } else if (data.user && !data.session) {
                    setMessage('تم إنشاء الحساب! تحقق من بريدك الإلكتروني  لتفعيلة.');
                    setIsSignUp(false);
                }
            } else {
                // --- تسجيل الدخول ---
                const { error: authError } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password: password,
                });

                if (authError) {
                    setFailedAttempts(prev => prev + 1);
                    if (authError.message.includes('Invalid login credentials')) {
                        throw new Error(`بيانات الدخول غير صحيحة. المحاولة ${failedAttempts + 1} من 5.`);
                    } else {
                        throw new Error('حدث خطأ أثناء محاولة تسجيل الدخول. يرجى المحاولة مرة أخرى.');
                    }
                }
                // النجاح: سيقوم App.tsx بالتعامل مع الانتقال
                setFailedAttempts(0);
            }
        } catch (err: any) {
            if (err.message.includes('User already registered')) {
                setError('هذا البريد مسجل مسبقاً. يرجى تسجيل الدخول بدلاً من ذلك.');
            } else if (err.message.includes('Invalid login credentials')) {
                setError(`البريد أو كلمة المرور خطأ. (المحاولة ${failedAttempts + 1} من 5)`);
            } else if (err.message.includes('Failed to fetch')) {
                setError('فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت الخاص بك.');
            } else {
                setError(err.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 p-4" dir="rtl">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden relative">

                <div className="bg-gradient-to-l from-amber-600 to-amber-700 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
                    <h2 className="text-3xl font-bold text-white relative z-10 drop-shadow-md">مجوهرات بابل</h2>
                    <p className="mt-2 text-amber-100 text-sm relative z-10">
                        {isSignUp ? 'انضم إلينا الآن' : 'مرحباً بك يا  مجدداً'}
                    </p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleAuth} className="space-y-5">

                        {isSignUp && (
                            <div className="space-y-2 animate-fade-in-down">
                                <label className="text-xs font-bold text-gray-500 mr-1">الاسم الكامل</label>
                                <div className="relative">
                                    <User className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pr-10 pl-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                                        placeholder="الاسم الكريم"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        disabled={isLocked}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 mr-1">البريد الإلكتروني</label>
                            <div className="relative">
                                <Mail className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    inputMode="email"
                                    className="w-full pr-10 pl-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLocked}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 mr-1">كلمة المرور</label>
                            <div className="relative">
                                <Lock className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pr-10 pl-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLocked}
                                />
                            </div>
                        </div>

                        {isSignUp && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 mr-1">تأكيد كلمة المرور</label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pr-10 pl-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={isLocked}
                                    />
                                </div>
                            </div>
                        )}

                        {/* عرض قوة كلمة المرور */}
                        {password && (
                            <div className={`text-sm mt-2 ${passwordStrength === 'ضعيفة' ? 'text-red-600' : 'text-green-600'}`}>
                                قوة كلمة المرور: {passwordStrength}
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100 animate-pulse">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        {message && (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg text-sm border border-green-100">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{message}</span>
                            </div>
                        )}

                        {/* رسالة القفل الأمني */}
                        {isLocked && (
                            <div className="flex flex-col items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg text-sm border border-amber-200 font-bold justify-center animate-pulse">
                                <Clock className="w-4 h-4" />
                                <span>عفواً، تم إيقاف المحاولات لمدة {lockTimer} ثانية</span>
                                <progress className="w-full" value={120 - lockTimer} max="120"></progress>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || isLocked}
                            className="w-full py-4 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100 mt-4 disabled:bg-gray-400"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isLocked ? 'يرجى الانتظار...' : (isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'))}
                        </button>

                        {/* Add loading indicator in the UI */}
                        {loading && (
                            <div className="flex items-center justify-center mt-4">
                                <Loader2 className="animate-spin h-6 w-6 text-amber-600" />
                                <span className="ml-2 text-amber-600">جاري التحميل...</span>
                            </div>
                        )}
                    </form>

                    <div className="mt-6 text-center border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError('');
                                setMessage('');
                                setFailedAttempts(0);
                            }}
                            className="text-amber-700 font-semibold text-sm flex items-center justify-center gap-1 mx-auto py-2 active:opacity-60 transition-opacity"
                        >
                            {isSignUp ? (
                                <>لديك حساب بالفعل؟ تسجيل الدخول <ArrowRight className="w-4 h-4 rotate-180" /></>
                            ) : (
                                <>ليس لديك حساب؟ إنشاء حساب جديد <ArrowRight className="w-4 h-4 rotate-180" /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
