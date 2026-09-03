"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { accordionVariants } from "@/lib/motion";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "Siapa saja yang dapat menggunakan aplikasi SIP-CUTI PG Trangkil?",
    answer:
      "Aplikasi ini dikhususkan bagi staf administrasi bagian dan bagian SDM & Umum (Pimpinan/Admin) untuk mengelola data permohonan dan kuota saldo cuti seluruh karyawan pimpinan maupun pelaksana di lingkungan PT Kebon Agung - Pabrik Gula Trangkil.",
  },
  {
    question: "Kapan hak cuti tahunan karyawan ditambahkan secara otomatis?",
    answer:
      "Sesuai kebijakan unit kerja, penambahan saldo cuti tahunan (12 hari) dapat berjalan otomatis terjadwal setelah karyawan memenuhi masa kerja minimal 1 tahun, serta didukung opsi penambahan manual tersinkronisasi via menu Tambah Saldo.",
  },
  {
    question: "Bagaimana ketentuan cuti besar (6 tahunan) dihitung di dalam sistem?",
    answer:
      "Sistem secara cerdas membaca tanggal pengangkatan karyawan. Saat masa kerja mencapai kelipatan 6 tahun, hak cuti besar akan otomatis terhitung dan tersedia untuk dipergunakan sesuai regulasi ketenagakerjaan instansi.",
  },
  {
    question: "Apakah sisa saldo cuti tahun sebelumnya dapat diakumulasikan (Carry Over)?",
    answer:
      "Ya. Fitur Automasi Saldo pada modul Pengaturan memungkinkan konfigurasi carry over otomatis (misalnya maksimal akumulasi 6 hari hak cuti tahunan) dengan batas waktu berlakunya yang dapat diatur fleksibel.",
  },
  {
    question: "Bagaimana alur penginputan cuti yang dilakukan oleh Admin Bagian?",
    answer:
      "Admin Bagian cukup membuka menu 'Pengambilan Cuti', memilih karyawan yang bersangkutan, menentukan tanggal serta jenis cuti (Tahunan, Besar, atau Inhaldagen), dan sistem akan langsung memvalidasi kecukupan saldo serta memotong ledger mutasi secara otomatis.",
  },
  {
    question: "Apa perbedaan hak akses antara Admin Utama (SDM) dan Admin Bagian?",
    answer:
      "Admin Utama memiliki akses penuh mengelola master karyawan, master bagian, stasiun, manajemen user, konfigurasi automasi saldo, dan laporan global. Sementara Admin Bagian memiliki akses operasional input cuti, cek rincian saldo, dan laporan khusus pada departemen kerjanya masing-masing.",
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {FAQ_DATA.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className={`border rounded-xl transition-[border-color,background-color,box-shadow] duration-200 overflow-hidden ${
              isOpen
                ? "border-[#0789D1]/30 bg-[#E8F5FC]/30 shadow-2xs"
                : "border-[#E8F5FC] bg-white hover:border-[#0789D1]/20"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
            >
              <span className="text-xs sm:text-sm font-bold text-[#263238] flex items-center gap-2.5">
                <HelpCircle
                  className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                    isOpen ? "text-[#0789D1]" : "text-[#6B7280]"
                  }`}
                />
                {item.question}
              </span>
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ${
                  isOpen
                    ? "rotate-180 bg-[#0789D1] text-white"
                    : "bg-[#F3F6F8] text-[#6B7280]"
                }`}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="faq-content"
                  variants={accordionVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 pt-1 text-xs text-[#6B7280] leading-relaxed border-t border-[#E8F5FC]">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
