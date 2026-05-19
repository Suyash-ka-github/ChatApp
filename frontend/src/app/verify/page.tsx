'use client'

import axios from 'axios';
import { ChevronLeft, Loader2, Lock } from 'lucide-react'
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
const VerificationPage = () => {

  const [loading, setLoading] = useState<boolean>(false);

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);

  const [error, setError] = useState<string>('');

  const [resendLoading, setResendLoading] = useState<boolean>(false);

  const [timer, setTimer] = useState<number>(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = useSearchParams().get('email') || '';
  
  const router = useRouter();

  useEffect(() => {

    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);

  }, [timer]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    setError('');

    if (otp.join('').length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    console.log('Submitting OTP:', otp.join(''), 'for email:', email);
    try {

      const { data } = await axios.post(
        'http://localhost:5000/api/v1/verify',
        {
          email,
          otp: String(otp.join(''))
        }
      );

      console.log(data);
      const token = data.token;
      if(!token){
        setError('No token received from server');
        return;
      }
      Cookies.set('token', token, { expires: 7, secure: false, path: '/' });
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

    } catch (error: any) {

      setError(
        error?.response?.data?.message ||
        'Invalid OTP. Please try again.'
      );

    } finally {

      setLoading(false);
    }
  };

  const handleResendOtp = async () => {

    setError('');

    setResendLoading(true);

    try {

      const { data } = await axios.post(
        'http://localhost:5000/api/v1/login',
        { email }
      );

      console.log(data);

      setTimer(60);

      setOtp(['', '', '', '', '', '']);

      inputRefs.current[0]?.focus();

    } catch (error: any) {

      setError(
        error?.response?.data?.message ||
        'Failed to resend OTP'
      );

    } finally {

      setResendLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {

    const value = e.target.value;

    // Allow only single digit
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];

    newOtp[index] = value;

    setOtp(newOtp);

    // Move forward
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {

    // Backspace navigation
    if (
      e.key === 'Backspace' &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {

  e.preventDefault();

  const pasteData = e.clipboardData
    .getData('text/plain')
    .replace(/\D/g, '') // remove non-digits
    .slice(0, 6);       // keep only first 6 digits

  if (pasteData.length === 6) {

    setOtp(pasteData.split(''));

    inputRefs.current[5]?.focus();
  }
};

  return (

    <div className='min-h-screen bg-gray-900 flex items-center justify-center p-4'>

      <div className='max-w-md w-full'>

        <div className='bg-gray-800 border border-gray-700 rounded-lg p-8'>

          <div className='text-center mb-8 relative'>
            <button className='absolute top-0 left-0 p-2 text-gray-300 hover:text-white'>
            <ChevronLeft className='w-6 h-6'/></button>
            <div className='mx-auto w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center mb-6'>
              <Lock size={40} className='text-white' />
            </div>

            <h1 className='text-4xl font-bold text-white mb-3'>
              Verify Your Email
            </h1>

            <p className='text-gray-300'>
              Enter the verification code sent to your email
            </p>

          </div>

          <form className='space-y-6' onSubmit={handleSubmit}>

            <div>

              <label className='block text-sm font-medium text-gray-300 mb-4'>
                Enter OTP
              </label>

              <div className='flex justify-between gap-2'>

                {otp.map((digit, index) => (

                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type='text'
                    inputMode='numeric'
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    className='w-12 h-12 bg-gray-700 border border-gray-500 text-white text-center text-xl rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                  />

                ))}

              </div>

              {error && (
                <div className='mt-4 bg-red-500/10 border border-red-500 text-red-400 text-sm p-3 rounded-lg'>
                  {error}
                </div>
              )}

            </div>

            <button
              type='submit'
              disabled={loading || otp.join('').length !== 6}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:cursor-not-allowed disabled:bg-gray-500'
            >

              {loading ? (

                <div className='flex items-center justify-center gap-2'>
                  <Loader2 className='w-5 h-5 animate-spin' />
                  Verifying...
                </div>

              ) : (

                'Verify OTP'

              )}

            </button>

            <div className='text-center'>

              {timer > 0 ? (

                <p className='text-gray-400 text-sm'>
                  Resend OTP in{' '}
                  <span className='text-white font-semibold'>
                    {timer}s
                  </span>
                </p>

              ) : (

                <button
                  type='button'
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className='text-blue-400 hover:text-blue-300 text-sm font-medium transition'
                >

                  {resendLoading ? (

                    <div className='flex items-center justify-center gap-2'>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      Sending OTP...
                    </div>

                  ) : (

                    'Resend OTP'

                  )}

                </button>

              )}

            </div>

          </form>

        </div>

      </div>

    </div>
  )
}

export default VerificationPage;