import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmailScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get("email");

  useEffect(() => {
    if (!email) {
      navigate("/login");
      return;
    }

    const verify = async () => {
      try {
        await axios.post("https://your-backend-url.com/verify-email", { email });
      } catch (err) {
        console.error("Verification failed", err);
      } finally {
        navigate("/login");
      }
    };

    verify();
  }, [email, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Verifying your email...</h2>
    </div>
  );
}
