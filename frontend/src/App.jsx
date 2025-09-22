import './App.css'
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import UserProfile from './pages/UserProfile.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import AlbumPage from './pages/Album.jsx';
import AlbumsPage from './pages/Albums.jsx';
import PlaylistsPage from './pages/Playlists.jsx';
import PlaylistDetailPage from './pages/PlaylistDetail.jsx';
import UploadSongPage from './pages/UploadSong.jsx';
import SearchPage from './pages/Search.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import PlayerBar from './components/PlayerBar.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

const AuthedPlayer = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <PlayerBar /> : null;
};

function App() {

    return (
        <Router>
            <AuthProvider>
                <Header />
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/albums" element={<ProtectedRoute><AlbumsPage /></ProtectedRoute>} />
                    <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
                    <Route path="/playlists" element={<ProtectedRoute><PlaylistsPage /></ProtectedRoute>} />
                    <Route path="/playlists/:id" element={<ProtectedRoute><PlaylistDetailPage /></ProtectedRoute>} />
                    <Route path="/upload" element={<ProtectedRoute><UploadSongPage /></ProtectedRoute>} />
                    <Route path="/album/:id" element={<ProtectedRoute><AlbumPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                    <Route path="/settings/password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
                </Routes>
                <AuthedPlayer />
            </AuthProvider>
        </Router>
    )
}

export default App
