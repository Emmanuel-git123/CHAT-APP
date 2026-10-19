
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API_URL = "http://localhost:8080/api/auth";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.token) {
        throw new Error("The server did not return an authentication token.");
      }

      localStorage.setItem("token", data.token);

      toast.success("Logged in successfully!");
      navigate("/chat");
    } catch (error) {
      toast.error(error.message || "Couldn't connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-slate-400 mt-2">Log in to continue chatting.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm mb-2">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="Your password"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <button type="submit" disabled={loading}className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl py-3 font-semibold transition">{loading ? "Logging in..." : "Log in"}</button>
        </form>

        <p className="text-sm text-center text-slate-400 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300">Create one</Link>
        </p>
      </div>
    </div>
  );
}
