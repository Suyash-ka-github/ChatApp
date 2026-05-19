"use client";
import { Loader2, Mail } from 'lucide-react'
import React from 'react'
import { useRouter } from 'next/navigation';
import axios from 'axios';

const LoginPage = () => {
  const [email,setEmail] = React.useState<string>("");
  const [loading,setLoading] = React.useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {data} = await axios.post('http://localhost:5000/api/v1/login',{
        email,
      });

      alert(data.message);
      router.push(`/verify?email=${email}`);
    } catch (error) {
      console.error('Error submitting email:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-900 flex items-center justify-center p-4'>
      <div className='max-w-md w-full'>
        <div className='bg-gray-800 border border-gray-700 rounded-lg p-8'>
          <div className='text-center mb-8'>
            <div className='mx-auto w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center mb-6'>
              <Mail size={40} className='text-white' />
            </div>
            <h1 className='text-4xl font-bold text-white mb-3'>Welcome To ChatApp</h1>
            <p className='text-gray-300'>Enter your email to continue your journey</p>
          </div>
          <form className='space-y-6' onSubmit={handleSubmit}>
            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-300 mb-1'> Email address:</label>
              <input
                type='email'
                id='email'
                className='bg-gray-700 border border-gray-500 placeholder:text-gray-400 text-white focus:ring-blue-500 focus:border-blue-500 block w-full p-3 rounded-lg'
                placeholder='you@example.com'
                required
                onChange={(e)=>{setEmail(e.target.value)}}
              />
            </div>
            <button
              type='submit'
              className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:cursor-not-allowed disabled:bg-gray-400'
              disabled={loading}
              value={email}
            > {loading? <div className='flex items-center justify-center gap-2'><Loader2 className='w-5 h-5' /> Sending OTP to your email...</div>:<div>Send Verification Code</div>}
              
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
