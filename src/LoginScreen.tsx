import { useEffect, useState } from 'react';
import { supabase } from './supabase-client';
import { Lock, Mail, Loader2, User, ArrowRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const OTP_SENT_MESSAGE =
  'تم إرسال رمز التحقق إلى بريدك الإلكتروني. الرجاء إدخال الرمز المكون من 6 أرقام.';

const isUnverifiedError = (msg: string) =>
  /email.*not.*confirm|not confirmed|email_not_confirmed|unverified/i.test(msg);

type PasswordAnalyzer = (password: string, userInputs?: string[]) => { score: number };

let passwordAnalyzerPromise: Promise<PasswordAnalyzer> | null = null;

const loadPasswordAnalyzer = () => {
  if (!passwordAnalyzerPromise) {
    passwordAnalyzerPromise = import('zxcvbn').then((module) =>
      ('default' in module ? module.default : module) as PasswordAnalyzer
    );
  }

  return passwordAnalyzerPromise;
};

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  const [passwordStrength, setPasswordStrength] = useState('');

  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (failedAttempts < 5) return;

    setIsLocked(true);
    setLockTimer(120);

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
  }, [failedAttempts]);

  useEffect(() => {
    let isCancelled = false;

    if (!isSignUp || !password) {
      setPasswordStrength('');
      return;
    }

    void loadPasswordAnalyzer().then((analyzer) => {
      if (isCancelled) return;

      const result = analyzer(password);
    setPasswordStrength(result.score < 3 ? 'ضعيفة' : 'قوية');
    });

    return () => {
      isCancelled = true;
    };
  }, [isSignUp, password]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const openOtpFlow = (targetEmail: string) => {
    setOtpEmail(targetEmail);
    setOtpCode('');
    setShowOtpInput(true);
    setResendCooldown(60);
    setError('');
    setMessage(OTP_SENT_MESSAGE);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    if (isSignUp && password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    if (isSignUp) {
      const analyzer = await loadPasswordAnalyzer();
      const result = analyzer(password);
      if (result.score < 3) {
        setError('كلمة المرور ضعيفة جداً. استخدم حروفاً كبيرة وصغيرة وأرقاماً ورموزاً.');
        return;
      }
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user && !data.session) {
          openOtpFlow(email.trim());
          return;
        }

        if (data.session) {
          setFailedAttempts(0);
          setMessage('تم إنشاء الحساب وتسجيل الدخول بنجاح.');
          return;
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (authError) {
          if (isUnverifiedError(authError.message || '')) {
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: email.trim()
            });
            if (resendError) throw resendError;
            openOtpFlow(email.trim());
            return;
          }

          setFailedAttempts((prev) => prev + 1);
          if (authError.message.includes('Invalid login credentials')) {
            throw new Error(`البريد أو كلمة المرور خطأ. (المحاولة ${failedAttempts + 1} من 5)`);
          }
          throw new Error('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
        }

        setFailedAttempts(0);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes('User already registered')) {
        setError('هذا البريد مسجل مسبقاً. انتقل إلى تسجيل الدخول.');
      } else if (msg.includes('Invalid login credentials')) {
        setError(`البريد أو كلمة المرور خطأ. (المحاولة ${failedAttempts + 1} من 5)`);
      } else if (msg.includes('Failed to fetch')) {
        setError('فشل الاتصال بالخادم. تحقق من الإنترنت ثم أعد المحاولة.');
      } else if (isUnverifiedError(msg)) {
        setError('هذا الحساب غير مفعل بعد. اطلب رمز تحقق جديد.');
      } else {
        setError(msg || 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError('يرجى إدخال رمز تحقق مكون من 6 أرقام.');
      return;
    }

    setOtpLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: otpEmail.trim(),
        token: otpCode.trim(),
        type: 'signup'
      });

      if (verifyError) throw verifyError;

      setShowOtpInput(false);
      setIsSignUp(false);
      setFailedAttempts(0);
      setOtpCode('');
      setMessage('تم تفعيل الحساب بنجاح. يمكنك تسجيل الدخول الآن.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/token|otp|expired|invalid/i.test(msg)) {
        setError('رمز التحقق غير صحيح أو منتهي الصلاحية. اطلب رمزاً جديداً.');
      } else {
        setError(msg || 'فشل التحقق من الرمز.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpEmail.trim() || resendCooldown > 0) return;

    setOtpLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: otpEmail.trim()
      });

      if (resendError) throw resendError;

      setMessage('تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني.');
      setResendCooldown(60);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg || 'تعذر إعادة إرسال رمز التحقق.');
    } finally {
      setOtpLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp((prev) => !prev);
    setError('');
    setMessage('');
    setFailedAttempts(0);
    setShowOtpInput(false);
    setOtpCode('');
    setOtpEmail('');
    setResendCooldown(0);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden relative">
        <div className="bg-gradient-to-l from-amber-600 to-amber-700 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10" />
          <h2 className="text-3xl font-bold text-white relative z-10 drop-shadow-md">مجوهرات بابل</h2>
          <p className="mt-2 text-amber-100 text-sm relative z-10">
            {showOtpInput
              ? 'تأكيد البريد الإلكتروني'
              : isSignUp
                ? 'انضم إلينا الآن'
                : 'مرحباً بك مجدداً'}
          </p>
        </div>

        <div className="p-8">
          {showOtpInput ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-100">
                تم إرسال رمز التحقق إلى بريدك الإلكتروني. الرجاء إدخال الرمز المكون من 6 أرقام.
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 mr-1" htmlFor="otp-email">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    id="otp-email"
                    type="email"
                    className="w-full pr-10 pl-3 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700"
                    value={otpEmail}
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 mr-1" htmlFor="otp-code">رمز التحقق (6 أرقام)</label>
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  className="w-full py-3 text-center tracking-[0.45em] bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all text-gray-800"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
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

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
              >
                {otpLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'تأكيد الرمز'}
              </button>

              <button
                type="button"
                onClick={() => void handleResendOtp()}
                disabled={otpLoading || resendCooldown > 0}
                className="w-full py-3 border border-amber-200 text-amber-700 rounded-xl font-semibold disabled:opacity-60"
              >
                {resendCooldown > 0
                  ? `إعادة إرسال الرمز خلال ${resendCooldown} ثانية`
                  : 'إعادة إرسال رمز جديد'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowOtpInput(false);
                  setError('');
                  setMessage('');
                }}
                className="w-full py-3 text-gray-600 hover:text-gray-800 rounded-xl font-semibold"
              >
                العودة لتسجيل الدخول
              </button>
            </form>
          ) : (
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

              {isLocked && (
                <div className="flex flex-col items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg text-sm border border-amber-200 font-bold justify-center animate-pulse">
                  <Clock className="w-4 h-4" />
                  <span>تم إيقاف المحاولات لمدة {lockTimer} ثانية</span>
                  <progress className="w-full" value={120 - lockTimer} max="120" />
                </div>
              )}

              <button
                type="submit"
                disabled={loading || isLocked}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100 mt-4 disabled:bg-gray-400"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : isLocked ? (
                  'يرجى الانتظار...'
                ) : isSignUp ? (
                  'إنشاء حساب جديد'
                ) : (
                  'تسجيل الدخول'
                )}
              </button>

              {loading && (
                <div className="flex items-center justify-center mt-4">
                  <Loader2 className="animate-spin h-6 w-6 text-amber-600" />
                  <span className="ml-2 text-amber-600">جارٍ التحميل...</span>
                </div>
              )}
            </form>
          )}

          {!showOtpInput && (
            <div className="mt-6 text-center border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={toggleAuthMode}
                className="text-amber-700 font-semibold text-sm flex items-center justify-center gap-1 mx-auto py-2 active:opacity-60 transition-opacity"
              >
                {isSignUp ? (
                  <>
                    لديك حساب بالفعل؟ تسجيل الدخول <ArrowRight className="w-4 h-4 rotate-180" />
                  </>
                ) : (
                  <>
                    ليس لديك حساب؟ إنشاء حساب جديد <ArrowRight className="w-4 h-4 rotate-180" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
