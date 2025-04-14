'use client';
import React from 'react';

const Register = () => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Если все поля пустые - очищаем базу данных
    if (!username.trim() && !email.trim() && !password.trim()) {
      try {
        const response = await fetch('http://localhost:8000/api/v0/clear_db');
        const data = await response.json();
        alert(data.message);
        return;
      } catch (error) {
        alert('Ошибка при очистке базы данных');
        return;
      }
    }

    try {
      const response = await fetch('http://localhost:8000/api/v0/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      alert('Ошибка при регистрации');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h1>Register</h1>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '300px'
      }}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          style={{ padding: '10px' }}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          style={{ padding: '10px' }}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          style={{ padding: '10px' }}
        />
        <button type="submit" style={{
          padding: '10px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}>
          Register
        </button>
      </form>
      <p>
        Already have an account? <a href="/login">Login here</a>
      </p>
      <p style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
        Подсказка: оставьте все поля пустыми для очистки базы данных
      </p>
    </div>
  );
};

export default Register; 