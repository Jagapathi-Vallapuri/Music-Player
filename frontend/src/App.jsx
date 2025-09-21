import './App.css'
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import UserProfile from './pages/UserProfile.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import AlbumPage from './pages/Album.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import PlayerBar from './components/PlayerBar.jsx';
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
                    <Route path="/album/:id" element={<ProtectedRoute><AlbumPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                    <Route path="/settings/password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
                </Routes>
                <PlayerBar />
            </AuthProvider>
        </Router>
    )
}

export default App
