import React from 'react';
import Sidebar from '@/Components/Sidebar';
import { Outlet } from 'react-router';

const Home = () => {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      
      <main className="flex-1 lg:ml-20 transition-all duration-300">
        <Outlet/>
      </main>
    </div>
  );
};

export default Home;
