import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Access the boot logger we defined in index.html
const log = (window as any).bootLog || console.log;

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component to catch render errors
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly declare state and props to resolve "Property ... does not exist" errors in specific environments
  public state: ErrorBoundaryState = { hasError: false, error: null };
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Force assign props to ensure visibility in specific TypeScript/React configurations
    this.props = props;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    log("React Boundary Caught: " + error.message, 'error');
  }

  handleClearData = () => {
      localStorage.clear();
      window.location.reload();
  };

  render() {
    // Access state after explicit declaration in class body
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-900 text-white p-6 text-center font-sans">
          <div className="bg-red-800 p-6 rounded-2xl shadow-2xl max-w-md border border-red-700">
            <h1 className="text-2xl font-bold mb-4">Qualcosa è andato storto</h1>
            <p className="text-sm mb-4 opacity-80">Si è verificato un errore critico nell'applicazione.</p>
            <pre className="bg-black/30 p-3 rounded text-left text-xs font-mono overflow-auto max-h-32 mb-6 border border-white/10">
              {this.state.error?.toString()}
            </pre>
            <div className="flex gap-3 justify-center">
                <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-white text-red-900 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                >
                    Riprova
                </button>
                <button 
                    onClick={this.handleClearData} 
                    className="px-4 py-2 bg-red-700 text-white font-bold rounded-lg hover:bg-red-600 transition-colors border border-red-500"
                >
                    Cancella Dati & Riavvia
                </button>
            </div>
          </div>
        </div>
      );
    }

    // Access props after defining ErrorBoundary as a generic component
    return this.props.children;
  }
}

try {
  log("index.tsx: Script started.");

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  log("index.tsx: Root element found. Initializing React...");

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );

  log("index.tsx: React render called successfully.");

} catch (error: any) {
  console.error("Critical React Mount Error:", error);
  if ((window as any).bootLog) {
      (window as any).bootLog("React Mount Error: " + (error.message || error), 'error');
      (window as any).bootLog(error.stack || '', 'error');
  }
}