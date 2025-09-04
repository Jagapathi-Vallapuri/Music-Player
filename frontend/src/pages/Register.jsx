import { register } from "../../client.js";
import { Navigate } from "react-router-dom";

const handleRegister = async (params) => {
    try {
        const { username, email, password } = params;
        const response = await register(username, email, password);
        if (response && response.success) {
            return <Navigate to="/" replace/>;
        }   
    } catch (error) {
        console.error("Registration error:", error);
        throw error;
    }
};

const Register = () => {
    return (
        <>
            <form onSubmit={handleRegister}>
                <input type="text" placeholder="Username" name="username" />
                <input type="email" placeholder="Email" name="email" />
                <input type="password" placeholder="Password" name="password" />
                <button type="submit">Register</button>
            </form>
            <p>
                Already have an account? <a href="/">Login</a>
            </p>
        </>
    )
}

export default Register;