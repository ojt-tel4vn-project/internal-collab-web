import Image from "next/image";

export default function Home() {
  return (
    <>
      <div className="grid grid-cols-2 ">
        {/*Image section*/}
        <div className="outline-black outline-2 h-screen relative">
          <img src="https://www.betterup.com/hubfs/Happy-collegues-working-on-project-together-workplace-environments.jpg" alt="Workplace" className="h-screen object-cover" />
          <div className="absolute bottom-10 left-10 max-w-lg text-white p-6">
            <h3 className="text-3xl font-bold mb-3 tracking-tight">Empowering Our People</h3>
            <p className="text-white/90 text-lg font-light leading-relaxed">
              Connect, collaborate, and grow with the tools designed to support your journey.
            </p>
          </div>
        </div>
        {/*Login section */}
        <div className="flex flex-col h-screen px-14 py-10">
          {/* 1. Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-200 text-white shadow-lg">
              <Image src="/Logo.webp" alt="Logo" width={90} height={90} />
            </div>
            <span className="text-lg font-semibold">CollabHub</span>
          </div>

          {/* 2. Login form */}
          <div className="flex-1 flex flex-col justify-center max-w-md m-auto">
            <h1 className="text-3xl font-bold mb-3">Welcome Back</h1>
            <p className="text-slate-500 mb-8">
              Access your personalized dashboard to manage leave requests, track time, and celebrate team achievements.
            </p>

            {/* Form */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Email address</label>
              <input
                type="email"
                placeholder="name@company.com"
                className="w-full rounded-lg border px-4 py-3"
              />
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg border px-4 py-3"
              />
              <a href="#" className="text-sm text-blue-600 hover:underline">Forgot Password?</a>
              <button className="w-full bg-blue-800 text-white py-3 rounded-lg font-medium">
                Sign in to Portal
              </button>
            </div>
          </div>


          {/* 4. Footer */}
          <div className="text-xs text-slate-400">
            © 2026 CollabHub Inc. · Privacy Policy · Terms
          </div>
        </div>


      </div>
    </>
  );
}
