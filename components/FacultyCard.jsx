"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, GraduationCap, Phone, Building2, ArrowRight } from "lucide-react";

export default function FacultyCard({ faculty, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group relative rounded-2xl overflow-hidden glass-card h-full flex flex-col"
    >
      {/* Blue Accent Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-500/5 pointer-events-none" />

      {/* Faculty Image */}
      <div className="relative h-56 overflow-hidden bg-slate-50 border-b border-slate-100">
        <img
          src={faculty.image}
          alt={faculty.name}
          className="w-full h-full object-contain object-center bg-white p-2 group-hover:scale-105 transition-transform duration-500"
        />

        {/* Department Badge */}
        <span className="absolute bottom-2 left-2 px-3 py-1 text-[10px] font-bold uppercase rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-slate-800 shadow-sm">
          {faculty.department}
        </span>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col flex-grow">
        <div>
          <div className="flex justify-between items-start gap-4 mb-3">
            <div>
              <h3 className="text-slate-900 font-bold text-xl group-hover:text-blue-900 transition-colors">
                {faculty.name}
              </h3>

              <p className="text-blue-900 font-semibold text-sm mt-1">
                {faculty.designation}
              </p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-900">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          {/* <p className="text-sm text-slate-600 leading-relaxed mb-5">
            {faculty.bio}
          </p> */}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Building2 className="w-4 h-4 text-blue-900" />
              {faculty.department}
            </div>

            {/* <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-blue-900" />
              {faculty.email}
            </div> */}

            <div className="flex items-center gap-2 text-sm text-slate-600">
  <Phone className="w-4 h-4" />
  {faculty.contact_no || "N/A"}
</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-5 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Experience: {faculty.experience}
          </span>

          <Link
             href={`/student/facultyinfo/${faculty.id}`}
            className="text-blue-900 font-bold flex items-center gap-1 hover:text-blue-700 transition-colors"
          >
            View Profile
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}