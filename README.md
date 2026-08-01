# Investment Monitoring System

> Diusulkan oleh: **Nayla Azzah Dakiyah** — *Planning and Budgeting Department*

## Latar Belakang Masalah

1. **Proses investasi belum terintegrasi** — Proses dari PR, PO hingga MassPro belum ada dalam satu sistem. PB Department harus mencari/konfirmasi manual, sehingga status terkini investasi sulit diketahui dan monitoring timeline kurang efektif.
2. **Data benefit diinput manual** — Setiap engineer (PIC) menginput manual, lalu PB Department mengonsolidasi dari beberapa file untuk laporan FS vs Actual. Berisiko *human error*, lambat, dan manajemen tidak bisa mendapat informasi cepat.
3. **Monitoring hanya periodik** — Performa investasi dimonitor bulanan, review bersama engineer hanya 6 bulan sekali. Variance baru diketahui setelah review, penyimpangan tidak cepat ditindaklanjuti.
4. **Belum ada platform terintegrasi** — Tidak ada satu platform untuk progres investasi, performa produksi, dan pencapaian benefit. Sulit mengidentifikasi investasi yang butuh tindakan perbaikan.
5. **Keterlambatan progress** menggeser realisasi benefit dari jadwal Feasibility Study sehingga proyeksi cost saving, cash flow, dan payback period tidak sesuai rencana.

## Tujuan Proyek

- Mengintegrasikan data **investment progress, production performance, benefit realization, dan budget monitoring** ke dalam satu sistem yang terpusat.
- Memungkinkan monitoring investasi lebih cepat lewat pencatatan data terstruktur dan pembaruan informasi berkala.
- Mengotomatisasi perbandingan **target Feasibility Study vs realisasi aktual** agar pencapaian benefit terpantau efisien.
- Menyediakan **dashboard interaktif** dan informasi terintegrasi untuk membantu manajemen mengevaluasi performa investasi dan menentukan tindakan perbaikan.

## Alur Proses Bisnis (To-Be)

1. **User Submit New Investment** → Status: *Draft* → PB Dept dapat notifikasi → update di Executive Dashboard.
2. **PB Dept Review & Calculate FS** → Status: *Under Review* → disetujui → *Ready for Approval*.
3. **BOD / AOP Analyst / BOD AOP Approval** → Status *Approved* atau *Revision Needed* (PB Dept revisi FS) atau *Rejected*.
4. **PB Dept Open Budget** → *Budget Monitoring Dashboard*.
5. **User Create PR** → PB Dept Approve PR → General Purchase Create PO.
6. **Payment Progress** → DP → Payment 1 → 2 → 3 → Retention → jika masih ada sisa budget, notify engineer.
7. **Investment Progress** → Fabrication → Install & Trial → PCR → MassPro → *Investment Progress Dashboard*.
   - Jika terjadi **project delay**, jadwal depresiasi disesuaikan (Depreciation Schedule Adjustment).
8. **Data Integration (MassPro)** → Data dari ERP + IoT masuk ke Engineering Database → Investment Monitoring System.
9. **Monitoring & Evaluasi** → *Production Performance Dashboard*:
   - Highlight **Top 10 Underperforming Investments**
   - Detail status produksi setiap investasi
   - Variance analysis, real-time dashboard, benefit realization, corrective action tracker

## Fitur Utama Sistem

- **Executive Dashboard** — ringkasan status seluruh investasi.
- **Budget Monitoring Dashboard** — pantauan budget, PR, PO, dan progress pembayaran.
- **Investment Progress Dashboard** — progres tahapan Fabrication, Install & Trial, PCR, MassPro.
- **Production Performance Dashboard** — performa produksi per investasi + Top 10 underperforming.
- **Benefit Dashboard** — realisasi benefit / FS vs Actual.
- **Action Tracker** — daftar tindakan perbaikan untuk investasi yang menyimpang.

## Ringkasan Benefit

- Informasi investasi terpusat dan real-time.
- Variance/penyimpangan terdeteksi lebih awal sehingga cepat ditindaklanjuti.
- Mengurangi *human error* dan waktu konsolidasi manual.
- Proyeksi cost saving, cash flow, dan payback period tetap sesuai rencana FS.

---

*Sumber: proyek.pdf*
