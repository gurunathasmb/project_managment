import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';

// Public Pages
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/SignUp';

// Student Pages
import StudentDashboard from './components/Student/StudentDashboard';
import SProjectStatus from './components/Student/SProjectStatus';
import SDocumentation from './components/Student/SDocumentation';
import SFunds from './components/Student/SFunds';
import SProfile from './components/Student/SProfile';
import SDiscussions from './components/Student/SDiscussions';

// Teacher Pages
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import TProjectStatus from './components/Teacher/TProjectStatus';
import TDocumentation from './components/Teacher/TDocumentation';
import TFunds from './components/Teacher/TFunds';
import TProfile from './components/Teacher/TProfile';

function App() {
  const PrivateRoute = ({ element, allowedRole }) => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user && user.role === allowedRole ? element : <Navigate to="/login" />;
  };

  return (
    <div className="App">
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Student */}
        <Route path="/student/dashboard" element={<PrivateRoute element={<StudentDashboard />} allowedRole="student" />} />
        <Route path="/student/project-status" element={<PrivateRoute element={<SProjectStatus />} allowedRole="student" />} />
        <Route path="/student/documentation" element={<PrivateRoute element={<SDocumentation />} allowedRole="student" />} />
        <Route path="/student/discussions" element={<PrivateRoute element={<SDiscussions />} allowedRole="student" />} />
        <Route path="/student/funds" element={<PrivateRoute element={<SFunds />} allowedRole="student" />} />
        <Route path="/student/profile" element={<PrivateRoute element={<SProfile />} allowedRole="student" />} />

        {/* Teacher */}
        <Route path="/teacher/dashboard" element={<PrivateRoute element={<TeacherDashboard />} allowedRole="teacher" />} />
        <Route path="/teacher/project-status" element={<PrivateRoute element={<TProjectStatus />} allowedRole="teacher" />} />
        <Route path="/teacher/documentation" element={<PrivateRoute element={<TDocumentation />} allowedRole="teacher" />} />
        <Route path="/teacher/funds" element={<PrivateRoute element={<TFunds />} allowedRole="teacher" />} />
        <Route path="/teacher/profile" element={<PrivateRoute element={<TProfile />} allowedRole="teacher" />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;