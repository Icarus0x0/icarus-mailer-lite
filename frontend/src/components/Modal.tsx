import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-dark-900 bg-opacity-50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>

        <div className={`relative bg-white rounded-lg shadow-2xl w-full ${sizeClasses[size]} border-2 border-primary-500`}>
          <div className="flex items-center justify-between p-6 border-b-2 border-primary-100">
            <h3 className="text-xl font-bold text-dark-900 font-mono">
              <i className="ri-terminal-box-line text-primary-500 mr-2"></i>
              {title}
            </h3>
            <button onClick={onClose} className="text-dark-400 hover:text-primary-500 transition-colors">
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  autoClose?: number;
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose, autoClose = 5000 }) => {
  React.useEffect(() => {
    if (!onClose || !autoClose) return;
    const t = setTimeout(onClose, autoClose);
    return () => clearTimeout(t);
  }, [message]);

  const styles = {
    success: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-900', icon: 'ri-checkbox-circle-line' },
    error: { bg: 'bg-primary-50', border: 'border-primary-500', text: 'text-primary-900', icon: 'ri-error-warning-line' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-900', icon: 'ri-alert-line' },
    info: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900', icon: 'ri-information-line' },
  };
  const style = styles[type];

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] w-full max-w-2xl px-4 ${style.bg} border-l-4 ${style.border} p-4 rounded-r-lg shadow-2xl`}>
      <div className="flex items-start">
        <i className={`${style.icon} ${style.text} text-xl mr-3 mt-0.5`}></i>
        <div className="flex-1">
          <p className={`${style.text} font-medium font-mono text-sm`}>{message}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className={`${style.text} hover:opacity-70 ml-3`}>
            <i className="ri-close-line text-lg"></i>
          </button>
        )}
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-dark-900 bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md border-2 border-dark-200">
          <div className="flex items-center justify-between p-6 border-b-2 border-dark-100">
            <h3 className="text-xl font-bold text-dark-900 font-mono flex items-center">
              <i className="ri-error-warning-line text-primary-500 mr-2 text-2xl"></i>
              {title}
            </h3>
            <button onClick={onClose} className="text-dark-400 hover:text-dark-700 transition-colors">
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <div className="p-6">
            <p className="text-dark-700 font-mono text-sm leading-relaxed">{message}</p>
          </div>

          <div className="flex justify-end space-x-3 p-6 border-t-2 border-dark-100">
            <button
              onClick={onClose}
              className="px-6 py-2 border-2 border-dark-300 text-dark-700 rounded-lg hover:bg-dark-50 transition-colors font-mono font-bold"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-mono font-bold shadow-lg"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
