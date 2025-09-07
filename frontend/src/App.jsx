import './App.css'
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import UserProfile from './pages/UserProfile.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

function App() {

    return (
        <Router>
            <AuthProvider>
                <Header />
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                </Routes>
            </AuthProvider>
        </Router>
    )
}

export default App
