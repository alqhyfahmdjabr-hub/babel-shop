import { useEffect, useState } from 'react';
import { supabase } from './supabase-client';
import { WHATSAPP_COUNTRY_CODE } from './constants/contact';
import type { ContactInfo } from './types/types';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  User
} from 'lucide-react';

const OTP_SENT_MESSAGE =
  'تم إرسال رمز التحقق إلى بريدك الإلكتروني. الرجاء إدخال الرمز المكوّن من 6 أرقام.';

const SUPPORT_MESSAGE = 'مرحباً، أحتاج مساعدة في تسجيل الدخول إلى تطبيق مجوهرات بابل.';

const isUnverifiedError = (msg: string) =>
  /email.*not.*confirm|not confirmed|email_not_confirmed|unverified/i.test(msg);

type PasswordAnalyzer = (password: string, userInputs?: string[]) => { score: number };

type LoginScreenProps = {
  contact: ContactInfo;
};

let passwordAnalyzerPromise: Promise<PasswordAnalyzer> | null = null;

const loadPasswordAnalyzer = () => {
  if (!passwordAnalyzerPromise) {
    passwordAnalyzerPromise = import('zxcvbn').then((module) =>
      ('default' in module ? module.default : module) as PasswordAnalyzer
    );
  }

  return passwordAnalyzerPromise;
};

export default function LoginScreen({ contact }: LoginScreenProps) {
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const supportPhone = contact.workers[0]?.phone ?? contact.manager;
  const supportWhatsappHref = `https://wa.me/${WHATSAPP_COUNTRY_CODE}${supportPhone}?text=${encodeURIComponent(SUPPORT_MESSAGE)}`;
  const heroSubtitle = showOtpInput
    ? 'أدخل الرمز المرسل إلى بريدك لإكمال التفعيل بأمان.'
    : isSignUp
      ? 'أنشئ حسابك وابدأ الوصول إلى الأسعار والطلبات دون تعطيل مسار التحقق الحالي.'
      : 'سجّل دخولك للوصول إلى التسعير المباشر والطلبات المحفوظة داخل التطبيق.';

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

  const resetFeedback = () => {
    setError('');
    setMessage('');
  };

  const resetOtpView = () => {
    setShowOtpInput(false);
    setOtpCode('');
    setOtpEmail('');
    setResendCooldown(0);
  };

  const switchAuthMode = (nextIsSignUp: boolean) => {
    if (nextIsSignUp === isSignUp) return;

    setIsSignUp(nextIsSignUp);
    setPassword('');
    setConfirmPassword('');
    setPasswordStrength('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFailedAttempts(0);
    resetFeedback();
    resetOtpView();
  };

  const openOtpFlow = (targetEmail: string) => {
    setOtpEmail(targetEmail);
    setOtpCode('');
    setShowOtpInput(true);
    setResendCooldown(60);
    resetFeedback();
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
    resetFeedback();

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
        setError('هذا البريد مسجل مسبقاً. يمكنك الانتقال إلى تسجيل الدخول.');
      } else if (msg.includes('Invalid login credentials')) {
        setError(`البريد أو كلمة المرور خطأ. (المحاولة ${failedAttempts + 1} من 5)`);
      } else if (msg.includes('Failed to fetch')) {
        setError('فشل الاتصال بالخادم. تحقّق من الإنترنت ثم أعد المحاولة.');
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
      setError('يرجى إدخال رمز تحقق مكوّن من 6 أرقام.');
      return;
    }

    setOtpLoading(true);
    resetFeedback();

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: otpEmail.trim(),
        token: otpCode.trim(),
        type: 'signup'
      });

      if (verifyError) throw verifyError;

      resetOtpView();
      setIsSignUp(false);
      setFailedAttempts(0);
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
    resetFeedback();

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
      setError(msg || 'تعذّرت إعادة إرسال رمز التحقق.');
    } finally {
      setOtpLoading(false);
    }
  };

  const goBackToAuth = () => {
    resetFeedback();
    resetOtpView();
  };

  const Notice = ({
    kind,
    text
  }: {
    kind: 'error' | 'success';
    text: string;
  }) => {
    const noticeStyles =
      kind === 'error'
        ? 'border-red-500/20 bg-red-500/10 text-red-200'
        : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200';
    const Icon = kind === 'error' ? AlertCircle : CheckCircle;

    return (
      <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${noticeStyles}`}>
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="leading-6">{text}</span>
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[#040404]" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.16),_transparent_38%),linear-gradient(180deg,#060606_0%,#020202_100%)]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]" />

      <div className="relative flex min-h-[100dvh] items-center justify-center px-[max(1rem,env(safe-area-inset-left,0px))] py-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
        <div className="w-full max-w-[28rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0A0A0A]/95 shadow-[0_30px_100px_-55px_rgba(0,0,0,0.95)] backdrop-blur-xl">
          <div className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.22),transparent_45%),linear-gradient(180deg,#151007_0%,#0a0a0a_78%)] p-5 sm:p-6">
            <div className="absolute inset-0 opacity-[0.08] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="space-y-2 text-right">
                <p className="text-[11px] uppercase tracking-[0.35em] text-gold-300/70">Secure Access</p>
                <h2 className="font-serif text-[clamp(2.1rem,10vw,2.9rem)] text-gold-100">مجوهرات بابل</h2>
                <p className="max-w-xs text-sm leading-7 text-gold-100/75">{heroSubtitle}</p>
              </div>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold-500/20 bg-black/25 text-gold-200 shadow-[0_0_30px_rgba(212,175,55,0.08)]">
                {showOtpInput ? <Mail className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
              </div>
            </div>

            {!showOtpInput && (
              <div className="relative z-10 mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-black/25 p-1">
                <button
                  type="button"
                  onClick={() => switchAuthMode(false)}
                  className={`rounded-[1rem] px-4 py-3 text-sm font-bold transition-all ${
                    !isSignUp
                      ? 'bg-gold-500 text-black shadow-[0_14px_30px_-18px_rgba(212,175,55,0.75)]'
                      : 'text-gold-100/75 hover:bg-white/[0.05]'
                  }`}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => switchAuthMode(true)}
                  className={`rounded-[1rem] px-4 py-3 text-sm font-bold transition-all ${
                    isSignUp
                      ? 'bg-gold-500 text-black shadow-[0_14px_30px_-18px_rgba(212,175,55,0.75)]'
                      : 'text-gold-100/75 hover:bg-white/[0.05]'
                  }`}
                >
                  إنشاء حساب
                </button>
              </div>
            )}
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {showOtpInput ? (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="rounded-[1.5rem] border border-gold-500/15 bg-gold-500/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gold-100">رمز التحقق نشط الآن</p>
                      <p className="mt-1 text-xs leading-6 text-gray-400">أدخل الرمز المرسل إلى بريدك لإكمال التفعيل بدون تغيير مسار OTP الحالي.</p>
                    </div>
                    <div className="rounded-xl border border-gold-500/20 bg-black/20 px-3 py-2 text-center">
                      <span className="block text-[11px] text-gray-400">إعادة الإرسال</span>
                      <span className="text-sm font-bold text-gold-200">{resendCooldown > 0 ? `${resendCooldown}s` : 'متاح'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="mr-1 text-xs font-bold text-gray-400" htmlFor="otp-email">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-500/60" />
                    <input
                      id="otp-email"
                      type="email"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-4 pr-12 text-sm text-gray-200 outline-none"
                      value={otpEmail}
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="mr-1 text-xs font-bold text-gray-400" htmlFor="otp-code">
                    رمز التحقق
                  </label>
                  <input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    className="w-full rounded-2xl border border-white/10 bg-[#050505] px-4 py-4 text-center text-xl tracking-[0.45em] text-gold-100 outline-none transition-colors focus:border-gold-500/40"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                {error && <Notice kind="error" text={error} />}
                {message && <Notice kind="success" text={message} />}

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-500 px-4 py-4 text-sm font-bold text-black transition-all hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {otpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  <span>{otpLoading ? 'جارٍ التحقق...' : 'تأكيد الرمز'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleResendOtp()}
                  disabled={otpLoading || resendCooldown > 0}
                  className="w-full rounded-2xl border border-gold-500/20 bg-gold-500/5 px-4 py-3 text-sm font-semibold text-gold-200 transition-colors hover:bg-gold-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resendCooldown > 0 ? `إعادة الإرسال خلال ${resendCooldown} ثانية` : 'إعادة إرسال رمز جديد'}
                </button>

                <button
                  type="button"
                  onClick={goBackToAuth}
                  className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-gray-400 transition-colors hover:text-white"
                >
                  العودة إلى شاشة الدخول
                </button>
              </form>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <label className="mr-1 text-xs font-bold text-gray-400" htmlFor="full-name">
                      الاسم الكامل
                    </label>
                    <div className="relative">
                      <User className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-500/60" />
                      <input
                        id="full-name"
                        type="text"
                        required
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-4 pr-12 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/40"
                        placeholder="الاسم الكريم"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isLocked}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="mr-1 text-xs font-bold text-gray-400" htmlFor="email">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-500/60" />
                    <input
                      id="email"
                      type="email"
                      required
                      inputMode="email"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-4 pr-12 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/40"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLocked}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="mr-1 text-xs font-bold text-gray-400" htmlFor="password">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-500/60" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-12 pr-12 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/40"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLocked}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gold-300"
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <label className="mr-1 text-xs font-bold text-gray-400" htmlFor="confirm-password">
                      تأكيد كلمة المرور
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-500/60" />
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-12 pr-12 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/40"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLocked}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gold-300"
                        aria-label={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        title={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                )}

                {password && isSignUp && (
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                    <span className="text-gray-400">قوة كلمة المرور</span>
                    <span className={passwordStrength === 'ضعيفة' ? 'font-bold text-red-300' : 'font-bold text-emerald-300'}>
                      {passwordStrength}
                    </span>
                  </div>
                )}

                {error && <Notice kind="error" text={error} />}
                {message && <Notice kind="success" text={message} />}

                {isLocked && (
                  <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>تم إيقاف المحاولات مؤقتاً لمدة {lockTimer} ثانية.</span>
                    </div>
                    <progress className="mt-3 w-full" value={120 - lockTimer} max="120" />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || isLocked}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-500 px-4 py-4 text-sm font-bold text-black transition-all hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  <span>
                    {loading
                      ? 'جارٍ المعالجة...'
                      : isLocked
                        ? 'يرجى الانتظار'
                        : isSignUp
                          ? 'إنشاء حساب جديد'
                          : 'تسجيل الدخول'}
                  </span>
                </button>

                <p className="text-center text-[11px] leading-6 text-gray-500">
                  {isSignUp
                    ? 'بعد إنشاء الحساب سيصلك رمز OTP مباشرة على البريد الإلكتروني الحالي.'
                    : 'إذا كان حسابك غير مفعل سنعيد إرسال رمز OTP تلقائياً دون تغيير التدفق.'}
                </p>
              </form>
            )}

            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2 text-gold-100">
                <Sparkles className="h-4 w-4 text-gold-400" />
                <span className="text-sm font-bold">مساعدة في الدخول</span>
              </div>
              <p className="text-xs leading-6 text-gray-400">
                إذا واجهت مشكلة في الدخول أو التحقق، يمكنك التواصل مباشرة دون إضافة ميزة استرجاع كلمة المرور حالياً.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <a
                  href={supportWhatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/15"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>واتساب</span>
                </a>
                <a
                  href={`tel:${contact.manager}`}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-gold-500/20 bg-gold-500/10 px-4 py-3 text-sm font-semibold text-gold-100 transition-colors hover:bg-gold-500/15"
                >
                  <Phone className="h-4 w-4" />
                  <span>اتصال</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
