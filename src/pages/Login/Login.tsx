import { Box, TextField, Button, Checkbox, Typography, CircularProgress } from '@mui/material';
import loginPhoto from '../../assets/images/login.jpg';
import GoogleIcon from '@mui/icons-material/Google';
import { Link, Navigate } from 'react-router-dom';
import * as Yup from "yup";
import { useFormik } from 'formik';
import { useState } from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showWaitingPopup, setShowWaitingPopup] = useState(false);
    const [showRejectedPopup, setShowRejectedPopup] = useState(false);
    const togglePasswordVisibility = () => setShowPassword(prev => !prev);

    function validationSchema() {
        return Yup.object({
            email: Yup.string()
                .email('البريد الإلكتروني غير صالح')
                .required('البريد الإلكتروني مطلوب'),
            password: Yup.string()
                .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
                .matches(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
                .matches(/[a-z]/, 'يجب أن تحتوي على حرف صغير')
                .matches(/[0-9]/, 'يجب أن تحتوي على رقم')
                .matches(/[@$!%*?&#]/, 'يجب أن تحتوي على رمز خاص')
                .required('كلمة المرور مطلوبة'),
        });
    }
    const navigate = useNavigate();
    const login = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema,
        onSubmit: async (values) => {
            setLoading(true);
            try {
                const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
                const user = userCredential.user;

                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const role = userData.role;

                    if (role === 'admin') {
                        navigate('/admin');
                    } else if (role === 'student') {
                        navigate('/profileStd');
                    } else if (role === 'teacher') {
                        const teacherRef = doc(db, 'users', user.uid);
                        const teacherSnap = await getDoc(teacherRef);
                        const status = teacherSnap.exists() ? teacherSnap.data().status : null;
                        if (status === 'تم القبول') {
                            navigate('/profileTeacher');
                        } else if (status === 'تم الرفض') {
                            setShowRejectedPopup(true);
                        } else {
                            setShowWaitingPopup(true);
                        }
                    } else {
                        alert('نوع الحساب غير معروف');
                    }
                }

            } catch (error) {
                console.error("خطأ في تسجيل الدخول:", error.message);
                alert('فشل تسجيل الدخول: تأكد من البيانات');
            } finally {
                setLoading(false);
            }
        }

    });




    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    name: user.displayName,
                    avatar: user.photoURL,
                    role: 'student',
                });

                navigate('/profileStd');
                return;
            }

            const userData = userSnap.data();
            const role = userData.role;

            if (role === 'student') {
                navigate('/profileStd');
            } else if (role === 'teacher') {
                navigate('/profileTeacher');
            } else {
                alert('نوع الحساب غير معروف');
            }

        } catch (error) {
            console.error("خطأ في تسجيل الدخول باستخدام Google:", error.message);
            alert("حدث خطأ أثناء تسجيل الدخول باستخدام Google");
        }
    };

    const handleCloseDialog = () => {
        setShowWaitingPopup(false);
        setShowRejectedPopup(false);
    };

    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: 'background.default',
        }}>
            <Box sx={{
                display: 'flex',
                width: '800px',
                backgroundColor: 'background.paper',
                padding: '10px',
                boxShadow: 3,
                borderRadius: 1,
            }}>
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '20px',
                }}>
                    <Typography variant="h6" align="center" gutterBottom color="text.primary">
                        مرحبًا مجددًا!
                    </Typography>
                    <Typography sx={{
                        fontSize: '1rem',
                        color: 'text.secondary',
                        textAlign: 'center',
                        marginBottom: '30px',
                    }}>
                        تسجيل الدخول لمواصلة التعلم
                    </Typography>
                    <form onSubmit={login.handleSubmit}>
                        <TextField
                            label="البريد الإلكتروني"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            id='email'
                            name='email'
                            type='email'
                            value={login.values.email}
                            onChange={login.handleChange}
                            error={Boolean(login.errors.email && login.touched.email)}
                            helperText={login.errors.email && login.touched.email ? login.errors.email : ''}
                        />
                        <TextField
                            label="كلمة المرور"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={login.values.password}
                            onChange={login.handleChange}
                            error={Boolean(login.errors.password && login.touched.password)}
                            helperText={login.errors.password && login.touched.password ? login.errors.password : ''}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <IconButton sx={{ mr: 1 }} onClick={togglePasswordVisibility} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
                            <Box display="flex" alignItems="center">
                                <Checkbox />
                                <Typography>تذكرني</Typography>
                            </Box>
                            <Link to="/ForgetPassword" style={{ textDecoration: 'none', color: '#1976d2' }}>
                                نسيت كلمة السر؟
                            </Link>
                        </Box>
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ mt: 2, py: 1.5 }}
                            type='submit'
                            disabled={!login.dirty || !login.isValid || loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'تسجيل الدخول'}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<GoogleIcon />}
                            fullWidth
                            sx={{ mt: 2, '& .MuiButton-startIcon': { marginLeft: '8px' } }}
                            onClick={handleGoogleSignIn}
                        >
                            تسجيل الدخول باستخدام جوجل
                        </Button>
                        <Typography align="center" mt={2}>
                            ليس لديك حساب؟{' '}
                            <Link to="/register" style={{ textDecoration: 'none', color: '#1976d2' }}>
                                سجل الآن
                            </Link>
                        </Typography>
                    </form>
                    <Dialog open={showWaitingPopup} onClose={handleCloseDialog}>
                        <DialogTitle>بانتظار المراجعة</DialogTitle>
                        <DialogContent>
                            <Typography>
                                تم تسجيل حسابك كمعلم بنجاح. سيتم مراجعته من قبل الإدارة، وسيتم إعلامك فور الموافقة.
                            </Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog} color="primary">
                                حسنًا
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <Dialog open={showRejectedPopup} onClose={handleCloseDialog}>
                        <DialogTitle>تم رفض الحساب</DialogTitle>
                        <DialogContent>
                            <Typography>
                                نأسف، لقد تم رفض طلبك كمعلم من قبل الإدارة. يمكنك التواصل معنا لمزيد من المعلومات.
                            </Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog} color="primary">
                                حسنًا
                            </Button>
                        </DialogActions>
                    </Dialog>


                </Box>
                <Box sx={{
                    flex: 1,
                    backgroundImage: `url(${loginPhoto})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                }} />
            </Box>
        </Box>
    );
};

export default Login;