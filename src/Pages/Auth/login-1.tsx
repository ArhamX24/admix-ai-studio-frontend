import { useState } from "react";
import { Button } from "../../Components/ui/button";
import { Input } from "../../Components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/Contexts/AuthContext";
import icon from "../../../public/logo.jpg";
import { useFormik } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { Loader } from "lucide-react";

interface LogoProps {
  src: string;
  alt: string;
  title?: string;
}

interface LoginProps {
  heading?: string;
  logo?: LogoProps;
  signupText?: string;
  loginText?: string;
}

const Login: React.FC<LoginProps> = ({
  heading,
  logo = {
    src: icon,
    alt: "logo",
    title: "shadcnblocks.com",
  },
  loginText = "Login",
  signupText = "Don't Have An Account ? ",
}) => {
  const [eyeOpen, setEyeOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  // Formik setup with enhanced TypeScript validation
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
    }),
    onSubmit: async (values: { email: string; password: string }, { setSubmitting: setFormikSubmitting }) => {
      try {
        setSubmitting(true);
        setFormikSubmitting(true);

        // Show loading alert
        Swal.fire({
          title: 'Logging in...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
          background: '#1e293b',
          color: '#fff'
        });

        // Call AuthContext login (handles token storage + role redirect)
        const result = await authLogin(values.email, values.password);

        // Close loading alert
        Swal.close();

        if (result.success) {
          // Success alert
          await Swal.fire({
            icon: 'success',
            title: 'Login Successful!',
            text: 'Redirecting to your dashboard...',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
            background: '#1e293b',
            color: '#fff',
            iconColor: '#10b981'
          });
          
          // AuthContext handles role-based navigation automatically
        } else {
          // Error alert
          await Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: result.message || 'Invalid email or password',
            confirmButtonText: 'Try Again',
            confirmButtonColor: '#3b82f6',
            background: '#1e293b',
            color: '#fff',
            iconColor: '#ef4444'
          });
        }
      } catch (error: any) {
        // Close loading alert if still open
        Swal.close();
        
        // Error alert
        await Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          html: `
            <p>${error.response?.data?.message || 'Something went wrong'}</p>
            <small style="color: #94a3b8;">Please check your credentials and try again.</small>
          `,
          confirmButtonText: 'Try Again',
          confirmButtonColor: '#3b82f6',
          background: '#1e293b',
          color: '#fff',
          iconColor: '#ef4444'
        });
      } finally {
        setSubmitting(false);
        setFormikSubmitting(false);
      }
    },
  });

  return (
    <section className="h-screen bg-black/90">
      <div className="flex h-full items-center justify-center">
        <div className="relative bg-transparent/20 flex w-full max-w-sm flex-col items-center gap-y-8 rounded-md border px-6 py-12 shadow-md border-slate-800">
          <div className="flex flex-col items-center gap-y-2">
            {/* Logo */}
            <div className="flex items-center gap-1 lg:justify-start">
              <img src={logo.src} alt={logo.alt} className="h-20 rounded-2xl" />
            </div>
            {heading && <h1 className="text-3xl font-semibold">{heading}</h1>}
          </div>

          <form onSubmit={formik.handleSubmit} className="flex w-full flex-col gap-8">
            <div className="flex flex-col gap-4">
              {/* Email Input */}
              <div className="flex flex-col gap-2">
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={submitting}
                  className={
                    formik.touched.email && formik.errors.email
                      ? "border-red-500"
                      : ""
                  }
                />
                {formik.touched.email && formik.errors.email && (
                  <span className="text-xs text-red-500">
                    {formik.errors.email}
                  </span>
                )}
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center cursor-pointer gap-2">
                  <Input
                    type={eyeOpen ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={submitting}
                    className={
                      formik.touched.password && formik.errors.password
                        ? "border-red-500"
                        : ""
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setEyeOpen(!eyeOpen)}
                    disabled={submitting}
                    className="p-2 hover:bg-gray-800 rounded-md transition-colors"
                  >
                    {eyeOpen ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="#A8A5A5"
                        className="w-6 h-6"
                      >
                        <path d="M17.8827 19.2968C16.1814 20.3755 14.1638 21.0002 12.0003 21.0002C6.60812 21.0002 2.12215 17.1204 1.18164 12.0002C1.61832 9.62282 2.81932 7.5129 4.52047 5.93457L1.39366 2.80777L2.80788 1.39355L22.6069 21.1925L21.1927 22.6068L17.8827 19.2968ZM5.9356 7.3497C4.60673 8.56015 3.6378 10.1672 3.22278 12.0002C4.14022 16.0521 7.7646 19.0002 12.0003 19.0002C13.5997 19.0002 15.112 18.5798 16.4243 17.8384L14.396 15.8101C13.7023 16.2472 12.8808 16.5002 12.0003 16.5002C9.51498 16.5002 7.50026 14.4854 7.50026 12.0002C7.50026 11.1196 7.75317 10.2981 8.19031 9.60442L5.9356 7.3497ZM12.9139 14.328L9.67246 11.0866C9.5613 11.3696 9.50026 11.6777 9.50026 12.0002C9.50026 13.3809 10.6196 14.5002 12.0003 14.5002C12.3227 14.5002 12.6309 14.4391 12.9139 14.328ZM20.8068 16.5925L19.376 15.1617C20.0319 14.2268 20.5154 13.1586 20.7777 12.0002C19.8603 7.94818 16.2359 5.00016 12.0003 5.00016C11.1544 5.00016 10.3329 5.11773 9.55249 5.33818L7.97446 3.76015C9.22127 3.26959 10.5793 3.00016 12.0003 3.00016C17.3924 3.00016 21.8784 6.87992 22.8189 12.0002C22.5067 13.6998 21.8038 15.2628 20.8068 16.5925ZM11.7229 7.50857C11.8146 7.50299 11.9071 7.50016 12.0003 7.50016C14.4855 7.50016 16.5003 9.51488 16.5003 12.0002C16.5003 12.0933 16.4974 12.1858 16.4919 12.2775L11.7229 7.50857Z"></path>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="#A8A5A5"
                        className="w-6 h-6"
                      >
                        <path d="M12.0003 3C17.3924 3 21.8784 6.87976 22.8189 12C21.8784 17.1202 17.3924 21 12.0003 21C6.60812 21 2.12215 17.1202 1.18164 12C2.12215 6.87976 6.60812 3 12.0003 3ZM12.0003 19C16.2359 19 19.8603 16.052 20.7777 12C19.8603 7.94803 16.2359 5 12.0003 5C7.7646 5 4.14022 7.94803 3.22278 12C4.14022 16.052 7.7646 19 12.0003 19ZM12.0003 16.5C9.51498 16.5 7.50026 14.4853 7.50026 12C7.50026 9.51472 9.51498 7.5 12.0003 7.5C14.4855 7.5 16.5003 9.51472 16.5003 12C16.5003 14.4853 14.4855 16.5 12.0003 16.5ZM12.0003 14.5C13.381 14.5 14.5003 13.3807 14.5003 12C14.5003 10.6193 13.381 9.5 12.0003 9.5C10.6196 9.5 9.50026 10.6193 9.50026 12C9.50026 13.3807 10.6196 14.5 12.0003 14.5Z"></path>
                      </svg>
                    )}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <span className="text-xs text-red-500">
                    {formik.errors.password}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="mt-2 w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-purple-600 hover:opacity-90 disabled:opacity-50"
                  disabled={submitting || formik.isSubmitting}
                >
                  {submitting ? <Loader className="animate-spin" /> : loginText}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export { Login };