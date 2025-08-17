import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          console.error('Auth callback error:', error, errorDescription);
          toast.error('เกิดข้อผิดพลาดในการยืนยันอีเมล');
          navigate('/login');
          return;
        }

        // Check for access_token in URL hash (Supabase Auth callback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          console.log('✅ Email verification successful');
          toast.success('ยืนยันอีเมลสำเร็จ! คุณสามารถเข้าสู่ระบบได้แล้ว');
          
          // Store tokens if needed (optional, Supabase client handles this)
          localStorage.setItem('supabase.auth.token', accessToken);
          if (refreshToken) {
            localStorage.setItem('supabase.auth.refresh_token', refreshToken);
          }
          
          navigate('/login', { state: { verified: true } });
        } else {
          console.log('✅ Email verification callback received');
          toast.success('ยืนยันอีเมลสำเร็จ! กรุณาเข้าสู่ระบบ');
          navigate('/login', { state: { verified: true } });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('เกิดข้อผิดพลาดในการยืนยันอีเมล');
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          กำลังยืนยันอีเมล...
        </h2>
        <p className="mt-2 text-gray-600">
          กรุณารอสักครู่
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
