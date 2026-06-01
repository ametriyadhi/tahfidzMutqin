import React, { useState } from 'react';
import { useHomeMurajaahReport } from '../hooks/useQueries';
import { api } from '../lib/api';
import { Search, Calendar, CheckCircle2, XCircle, AlertCircle, Award, FileSpreadsheet } from 'lucide-react';
import { cn } from '../lib/utils';

export const MutabaahMurojaahReport: React.FC = () => {
  const { data: reportData = [], isLoading, error } = useHomeMurajaahReport();
  
  // Local Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState<'all' | 'subuh' | 'magrib'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'executed' | 'pending' | 'failed'>('all');

  const filteredData = reportData.filter((item: any) => {
    // 1. Search filter (student name or target)
    const matchesSearch = 
      item.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.targetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ustadz?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Shift filter
    const matchesShift = 
      selectedShift === 'all' || 
      item.shift.toLowerCase() === selectedShift;

    // 3. Status filter
    let matchesStatus = true;
    if (selectedStatus === 'executed') {
      matchesStatus = item.feedbackAt && item.isExecuted;
    } else if (selectedStatus === 'pending') {
      matchesStatus = !item.feedbackAt;
    } else if (selectedStatus === 'failed') {
      matchesStatus = item.feedbackAt && !item.isExecuted;
    }

    return matchesSearch && matchesShift && matchesStatus;
  });

  const getFormatDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('id-ID', options);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fadeIn p-6">
      {/* Header and Summary stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-600" />
            Laporan Mutaba'ah Muraja'ah di Rumah
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Data pemantauan hafalan mandiri harian santri bersama orang tua
          </p>
        </div>

        {/* Quick summary metrics */}
        <div className="flex gap-2">
          <div className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-2xl text-xs font-bold border border-emerald-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Terlaksana: {reportData.filter((i: any) => i.feedbackAt && i.isExecuted).length}
          </div>
          <div className="bg-amber-50 text-amber-800 px-4 py-2 rounded-2xl text-xs font-bold border border-amber-100">
            Menunggu Verifikasi: {reportData.filter((i: any) => !i.feedbackAt).length}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari santri, target, atau pengajar..."
            className="w-full bg-slate-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 font-semibold"
          />
        </div>

        {/* Shift */}
        <select
          value={selectedShift}
          onChange={(e: any) => setSelectedShift(e.target.value)}
          className="bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 font-bold cursor-pointer"
        >
          <option value="all">Semua Waktu (Subuh/Maghrib)</option>
          <option value="subuh">Subuh</option>
          <option value="magrib">Maghrib</option>
        </select>

        {/* Status */}
        <select
          value={selectedStatus}
          onChange={(e: any) => setSelectedStatus(e.target.value)}
          className="bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 font-bold cursor-pointer"
        >
          <option value="all">Semua Status</option>
          <option value="executed">Sudah Terlaksana</option>
          <option value="pending">Menunggu Orangtua</option>
          <option value="failed">Tidak Melaksanakan</option>
        </select>
      </div>

      {/* Table Container */}
      {isLoading ? (
        <div className="py-20 text-center text-gray-400 text-sm font-bold animate-pulse">
          Memuat data laporan mutaba'ah...
        </div>
      ) : error ? (
        <div className="py-12 flex flex-col items-center justify-center text-center text-red-500">
          <AlertCircle className="w-10 h-10 mb-2" />
          <p className="font-extrabold">Gagal mengambil data laporan</p>
          <p className="text-xs text-gray-400 mt-1">Silakan refresh kembali halaman ini</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="py-16 text-center bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
          <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500">Belum ada rekaman mutaba'ah</p>
          <p className="text-xs text-gray-400 mt-1">Tidak ada data yang cocok dengan kriteria filter saat ini</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-gray-600 text-xs font-black uppercase tracking-wider">
                <th className="px-5 py-4 font-extrabold text-[10px]">Hari / Tanggal</th>
                <th className="px-5 py-4 font-extrabold text-[10px]">Santri & NIS</th>
                <th className="px-5 py-4 font-extrabold text-[10px]">Pemberi Tugas</th>
                <th className="px-5 py-4 font-extrabold text-[10px]">Shift</th>
                <th className="px-5 py-4 font-extrabold text-[10px]">Target Muraja'ah</th>
                <th className="px-5 py-4 font-extrabold text-[10px]">Mutaba'ah Orangtua</th>
                <th className="px-5 py-4 font-extrabold text-[10px]">TTD Ortu</th>
                <th className="px-5 py-4 font-extrabold text-[10px]">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
              {filteredData.map((item: any) => {
                const isVerified = !!item.feedbackAt;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Hari / Tanggal */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-extrabold text-gray-900 text-xs">{getFormatDate(item.assignedDate)}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Penugasan Harian</p>
                        </div>
                      </div>
                    </td>

                    {/* Santri */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-black text-slate-800 text-sm">{item.student?.name}</p>
                      <p className="text-xs text-gray-400 font-bold mt-0.5">NIS: {item.student?.nis || '-'}</p>
                    </td>

                    {/* Ustadz */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500 font-bold">
                      {item.ustadz?.name || 'Musyrif'}
                    </td>

                    {/* Shift */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        item.shift.toLowerCase() === 'subuh' 
                          ? "bg-sky-50 text-sky-700 border border-sky-100" 
                          : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                      )}>
                        {item.shift}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="px-5 py-4">
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[9px] font-black uppercase tracking-wider mb-1">
                          {item.targetType}
                        </span>
                        <p className="font-bold text-sm text-slate-800">{item.targetName}</p>
                      </div>
                    </td>

                    {/* Mutabaah Orangtua */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {isVerified ? (
                        <div className="space-y-1">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold",
                            item.isExecuted 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          )}>
                            {item.isExecuted ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Melaksanakan
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> Tidak Melaksanakan
                              </>
                            )}
                          </span>

                          {item.isExecuted && (
                            <div className="flex gap-1 flex-wrap">
                              <span className={cn(
                                "inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold",
                                item.isTargetMet ? "bg-teal-50 text-teal-700" : "bg-orange-50 text-orange-700"
                              )}>
                                {item.isTargetMet ? 'Sesuai Target' : 'Kurang Target'}
                              </span>
                              <span className={cn(
                                "inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold",
                                item.isFluent ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                              )}>
                                {item.isFluent ? 'Lancar' : 'Kurang Lancar'}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-400 rounded-full text-[10px] font-extrabold">
                          Menunggu Disimak
                        </span>
                      )}
                    </td>

                    {/* TTD Ortu */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {isVerified ? (
                        <div className="flex flex-col items-start bg-slate-50 border border-slate-100 rounded-lg p-2 max-w-[120px]">
                          <span className="font-mono text-[9px] text-gray-400 italic block mb-0.5">Digital Sign</span>
                          <span className="font-bold text-xs text-gray-700 truncate w-full">{item.parentSignature}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic font-medium">—</span>
                      )}
                    </td>

                    {/* Keterangan */}
                    <td className="px-5 py-4 max-w-[200px] break-words text-xs text-gray-500 font-medium">
                      {item.parentNotes || <span className="text-gray-300 italic">Tidak ada catatan</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
