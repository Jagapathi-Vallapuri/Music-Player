import './App.css'
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            </Routes>
        </Router>
    )
}

export default App
