import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary - حدود الخطأ
 * التقاط الأخطاء في المكونات الفرعية وعرض واجهة بديلة
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // يمكن إرسال الخطأ إلى خدمة تتبع الأخطاء هنا
    // logErrorToService(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6" dir="rtl">
          <div className="max-w-md w-full bg-[#0a0a0a] border border-red-500/20 rounded-3xl p-8 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">
              عذراً، حدث خطأ ما
            </h2>
            
            <p className="text-gray-400 mb-6 leading-relaxed">
              نعتذر عن الإزعاج. يمكنك محاولة إعادة تحميل الصفحة أو العودة إلى الصفحة الرئيسية.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-black/50 rounded-xl p-4 mb-6 text-left overflow-auto max-h-40">
                <p className="text-red-400 text-sm font-mono mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-gray-500 text-xs font-mono">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-6 py-3 bg-gold-600 text-black rounded-xl font-bold hover:bg-gold-500 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                إعادة تحميل
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/10"
              >
                <Home className="w-5 h-5" />
                الصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;