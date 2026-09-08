import { LearningModule } from '../types';

export const MODULES_DATA: LearningModule[] = [
  {
    id: 'mod-1',
    orderIndex: 1,
    title: 'Komposisi Fungsi & Fungsi Invers',
    shortDescription: 'Membedah domain, operasi aljabar fungsi, komposisi (f ∘ g)(x), dan teknik cepat invers aljabar rasional untuk TKA.',
    domain: 'Aljabar & Fungsi',
    estimatedDuration: '45 Menit',
    trackCount: 5,
    questionCount: 15,
    accentColor: '#10B981',
    geometricArtType: 'function-wave',
    slides: [
      {
        id: 's1-1',
        moduleId: 'mod-1',
        orderIndex: 1,
        title: 'Konsep Pemetaan & Domain Alami',
        subtitle: 'Syarat eksistensi fungsi riil',
        category: 'Konsep Dasar',
        contentMarkdown: 'Suatu fungsi f: A → B memasangkan setiap elemen himpunan domain A secara tepat dengan satu elemen di kodomain B. Pada soal TKA, penentuan Domain Alami (Df) sering menguji dua batasan riil utama: penyebut tidak boleh nol, dan nilai di dalam akar pangkat genap harus non-negatif.',
        mathFormulas: ['f(x) = \\frac{P(x)}{Q(x)} \\implies Q(x) \\neq 0', 'g(x) = \\sqrt{R(x)} \\implies R(x) \\ge 0'],
        keyTakeaway: 'Selalu periksa syarat radikan ≥ 0 dan penyebut ≠ 0 sebelum melakukan substitusi.'
      },
      {
        id: 's1-2',
        moduleId: 'mod-1',
        orderIndex: 2,
        title: 'Operasi Komposisi (f ∘ g)(x)',
        subtitle: 'Rantai substitusi fungsi',
        category: 'Penurunan Rumus',
        contentMarkdown: 'Komposisi (f ∘ g)(x) didefinisikan sebagai f(g(x)), di mana output dari g(x) menjadi input bagi f. Sifat penting: komposisi fungsi tidak komutatif (f ∘ g ≠ g ∘ f secara umum), namun bersifat asosiatif: (f ∘ (g ∘ h))(x) = ((f ∘ g) ∘ h)(x).',
        mathFormulas: ['(f \\circ g)(x) = f(g(x))', '(f \\circ g \\circ h)(x) = f(g(h(x)))'],
        keyTakeaway: 'Selesaikan dari fungsi terdalam ke arah luar untuk mencegah kesalahan tanda aljabar.'
      },
      {
        id: 's1-3',
        moduleId: 'mod-1',
        orderIndex: 3,
        title: 'Fungsi Invers f⁻¹(x) & Trik Pecahan Linier',
        subtitle: 'Metode cepat TKA untuk f(x) = (ax + b)/(cx + d)',
        category: 'Trik TKA & Intuisi',
        contentMarkdown: 'Fungsi invers membalikkan relasi: jika y = f(x), maka x = f⁻¹(y). Untuk fungsi pecahan linier, pertukaran posisi dan tanda koefisien a dan d menghasilkan invers seketika tanpa aljabar panjang.',
        mathFormulas: ['f(x) = \\frac{ax + b}{cx + d} \\implies f^{-1}(x) = \\frac{-dx + b}{cx - a}', '(f \\circ g)^{-1}(x) = (g^{-1} \\circ f^{-1})(x)'],
        keyTakeaway: 'Tukar posisi a dan d, lalu ubah tandanya menjadi negatif. Posisi b dan c tetap!'
      },
      {
        id: 's1-4',
        moduleId: 'mod-1',
        orderIndex: 4,
        title: 'Menentukan f(x) jika (f ∘ g)(x) dan g(x) Diketahui',
        subtitle: 'Metode pemisalan variabel sementara',
        category: 'Penurunan Rumus',
        contentMarkdown: 'Jika diketahui (f ∘ g)(x) = H(x) dan ingin dicari f(x), misalkan u = g(x), lalu nyatakan x dalam bentuk u: x = g⁻¹(u). Kemudian substitusikan x tersebut ke dalam H(x) sehingga diperoleh f(u), lalu kembalikan variabel ke x.',
        mathFormulas: ['Misal: u = g(x) \\implies x = g^{-1}(u)', 'f(u) = H(g^{-1}(u)) \\implies f(x) = H(g^{-1}(x))'],
        keyTakeaway: 'Pemisalan variabel sementara mencegah kebingungan substitusi bertingkat.'
      },
      {
        id: 's1-5',
        moduleId: 'mod-1',
        orderIndex: 5,
        title: 'Analisis Soal TKA: Nilai Titik Balik & Invers',
        subtitle: 'Aplikasi pada fungsi kuadrat dan domain terbatas',
        category: 'Contoh Soal TKA',
        contentMarkdown: 'Fungsi kuadrat f(x) = ax² + bx + c tidak memiliki invers pada seluruh bilangan riil karena bukan fungsi satu-satu (injektif). Agar memiliki invers, domain harus dibatasi pada x ≥ -b/(2a) atau x ≤ -b/(2a).',
        mathFormulas: ['x_{puncak} = -\\frac{b}{2a}', 'D_f = [x_{puncak}, \\infty) \\text{ agar bijektif}'],
        keyTakeaway: 'Syarat utama eksistensi fungsi invers adalah fungsi harus bijektif (satu-satu dan pada).'
      }
    ],
    questions: []
  },
  {
    id: 'mod-2',
    orderIndex: 2,
    title: 'Geometri Lingkaran & Garis Singgung',
    shortDescription: 'Penguasaan persamaan lingkaran berpusat di (a,b), kedudukan garis terhadap lingkaran (D), dan rumus garis singgung bergradien m.',
    domain: 'Geometri & Trigonometri',
    estimatedDuration: '50 Menit',
    trackCount: 5,
    questionCount: 15,
    accentColor: '#10B981',
    geometricArtType: 'circle-tangent',
    slides: [
      {
        id: 's2-1',
        moduleId: 'mod-2',
        orderIndex: 1,
        title: 'Bentuk Baku & Umum Persamaan Lingkaran',
        subtitle: 'Pusat (a,b) dan Jari-jari R',
        category: 'Konsep Dasar',
        contentMarkdown: 'Lingkaran adalah tempat kedudukan titik-titik yang berjarak sama terhadap titik pusat. Bentuk baku: (x - a)² + (y - b)² = r². Bentuk umum: x² + y² + Ax + By + C = 0 dengan pusat (-A/2, -B/2) dan r = √(a² + b² - C).',
        mathFormulas: ['(x - a)^2 + (y - b)^2 = r^2', 'r = \\sqrt{\\left(-\\frac{A}{2}\\right)^2 + \\left(-\\frac{B}{2}\\right)^2 - C}'],
        keyTakeaway: 'Pastikan koefisien x² dan y² bernilai 1 sebelum menentukan A, B, dan C.'
      },
      {
        id: 's2-2',
        moduleId: 'mod-2',
        orderIndex: 2,
        title: 'Kedudukan Garis Terhadap Lingkaran',
        subtitle: 'Uji Diskriminan D = b² - 4ac',
        category: 'Penurunan Rumus',
        contentMarkdown: 'Substitusi persamaan garis y = mx + c ke dalam persamaan lingkaran menghasilkan persamaan kuadrat dalam x. D > 0: memotong di dua titik; D = 0: menyinggung (1 titik); D < 0: garis di luar lingkaran.',
        mathFormulas: ['D > 0 \\implies \\text{2 Titik Potong}', 'D = 0 \\implies \\text{Garis Singgung}', 'D < 0 \\implies \\text{Tidak Memotong}'],
        keyTakeaway: 'Garis singgung selalu memiliki nilai diskriminan tepat D = 0.'
      },
      {
        id: 's2-3',
        moduleId: 'mod-2',
        orderIndex: 3,
        title: 'Garis Singgung Bergradien m',
        subtitle: 'Persamaan langsung tanpa eliminasi panjang',
        category: 'Trik TKA & Intuisi',
        contentMarkdown: 'Untuk lingkaran berpusat di (a,b) dan jari-jari r dengan gradien garis m, persamaan garis singgungnya adalah (y - b) = m(x - a) ± r√(1 + m²). Tanda ± menunjukkan selalu ada dua garis singgung sejajar.',
        mathFormulas: ['y - b = m(x - a) \\pm r\\sqrt{1 + m^2}'],
        keyTakeaway: 'Jika dua garis tegak lurus, m₁ · m₂ = -1. Jika sejajar, m₁ = m₂.'
      },
      {
        id: 's2-4',
        moduleId: 'mod-2',
        orderIndex: 4,
        title: 'Garis Singgung Melalui Titik pada Lingkaran (Bagi Adil)',
        subtitle: 'Metode substitusi pembagian adil (x₁x, y₁y)',
        category: 'Trik TKA & Intuisi',
        contentMarkdown: 'Jika titik (x₁, y₁) terletak persis pada lingkaran, gunakan metode bagi adil: x² menjadi x₁x, y² menjadi y₁y, Ax menjadi A(x + x₁)/2, dan By menjadi B(y + y₁)/2.',
        mathFormulas: ['(x_1 - a)(x - a) + (y_1 - b)(y - b) = r^2'],
        keyTakeaway: 'Hanya berlaku jika titik (x₁, y₁) telah terbukti terletak tepat pada keliling lingkaran.'
      },
      {
        id: 's2-5',
        moduleId: 'mod-2',
        orderIndex: 5,
        title: 'Garis Singgung Persekutuan Dua Lingkaran',
        subtitle: 'Persekutuan Luar (GSPL) dan Dalam (GSPD)',
        category: 'Contoh Soal TKA',
        contentMarkdown: 'GSPL = √(d² - (R - r)²), sedangkan GSPD = √(d² - (R + r)²), di mana d adalah jarak antara kedua pusat lingkaran. Soal TKA sering menguji panjang sabuk katrol atau rantai mesin.',
        mathFormulas: ['GSPL = \\sqrt{d^2 - (R - r)^2}', 'GSPD = \\sqrt{d^2 - (R + r)^2}'],
        keyTakeaway: 'Persekutuan dalam selalu lebih pendek daripada persekutuan luar karena pengurangnya (R + r)² lebih besar.'
      }
    ],
    questions: []
  },
  {
    id: 'mod-3',
    orderIndex: 3,
    title: 'Matriks & Transformasi Geometri',
    shortDescription: 'Operasi aljabar matriks, determinan, invers 2x2, serta representasi transformasi: refleksi, rotasi matriks, dan komposisi.',
    domain: 'Matriks & Vektor',
    estimatedDuration: '45 Menit',
    trackCount: 5,
    questionCount: 15,
    accentColor: '#10B981',
    geometricArtType: 'matrix-grid',
    slides: [
      {
        id: 's3-1',
        moduleId: 'mod-3',
        orderIndex: 1,
        title: 'Determinan & Sifat Aljabar Matriks',
        subtitle: 'Sifat perkalian determinan det(AB) = det(A) · det(B)',
        category: 'Konsep Dasar',
        contentMarkdown: 'Untuk matriks A = [[a, b], [c, d]], determinan det(A) = ad - bc. Sifat penting TKA: det(Aᵀ) = det(A), det(A⁻¹) = 1/det(A), dan det(kA) = kⁿ det(A) untuk matriks ordo n×n.',
        mathFormulas: ['\\det(A) = ad - bc', '\\det(AB) = \\det(A) \\cdot \\det(B)', '\\det(kA) = k^2 \\det(A) \\quad (\\text{ordo } 2\\times 2)'],
        keyTakeaway: 'Ingat faktor k kuadrat ketika mengeluarkan skalar dari determinan ordo 2×2.'
      },
      {
        id: 's3-2',
        moduleId: 'mod-3',
        orderIndex: 2,
        title: 'Invers Matriks 2×2 & Persamaan Matriks',
        subtitle: 'Solusi AX = B dan XA = B',
        category: 'Penurunan Rumus',
        contentMarkdown: 'Jika AX = B, maka X = A⁻¹B. Jika XA = B, maka X = BA⁻¹. Perkalian matriks tidak komutatif, sehingga posisi perkalian invers di kiri atau di kanan harus dijaga dengan cermat.',
        mathFormulas: ['A^{-1} = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}', 'AX = B \\implies X = A^{-1}B'],
        keyTakeaway: 'Matriks singular tidak memiliki invers karena determinannya sama dengan 0.'
      },
      {
        id: 's3-3',
        moduleId: 'mod-3',
        orderIndex: 3,
        title: 'Matriks Transformasi Standar',
        subtitle: 'Refleksi, Rotasi Sudut θ, dan Dilatasi',
        category: 'Konsep Dasar',
        contentMarkdown: 'Setiap transformasi geometri bidang dapat dinyatakan sebagai matriks 2×2. Rotasi R(O, θ) = [[cos θ, -sin θ], [sin θ, cos θ]]. Refleksi sumbu X = [[1, 0], [0, -1]], refleksi y = x = [[0, 1], [1, 0]].',
        mathFormulas: ['R_\\theta = \\begin{pmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{pmatrix}', 'M_{y=x} = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}'],
        keyTakeaway: 'Transformasi matriks mengubah koordinat titik melalui perkalian [x\', y\']ᵀ = M [x, y]ᵀ.'
      },
      {
        id: 's3-4',
        moduleId: 'mod-3',
        orderIndex: 4,
        title: 'Komposisi Transformasi Geometri (T₂ ∘ T₁)',
        subtitle: 'Urutan pengerjaan dari kanan ke kiri',
        category: 'Trik TKA & Intuisi',
        contentMarkdown: 'Jika titik ditransformasikan oleh T₁ dilanjutkan oleh T₂, matriks transformasi totalnya adalah M = M₂ · M₁ (matriks T₂ dikalikan di sebelah kiri matriks T₁).',
        mathFormulas: ['(T_2 \\circ T_1) \\iff M = M_2 \\cdot M_1'],
        keyTakeaway: 'Jangan tertukar urutan perkalian: transformasi pertama ada di paling kanan!'
      },
      {
        id: 's3-5',
        moduleId: 'mod-3',
        orderIndex: 5,
        title: 'Transformasi Kurva & Luas Bangun Datar',
        subtitle: 'Efek determinan matriks terhadap perubahan luas',
        category: 'Contoh Soal TKA',
        contentMarkdown: 'Luas bayangan suatu bangun datar setelah ditransformasikan oleh matriks M adalah L\' = |det(M)| × L_awal. Nilai mutlak determinan merepresentasikan faktor perbesaran luas bidang.',
        mathFormulas: ['L_{bayangan} = |\\det(M)| \\times L_{awal}'],
        keyTakeaway: 'Rotasi dan refleksi mempertahankan luas karena |det(M)| = 1.'
      }
    ],
    questions: []
  },
  {
    id: 'mod-4',
    orderIndex: 4,
    title: 'Barisan, Deret & Notasi Sigma (Σ)',
    shortDescription: 'Membedah pola aritmetika tingkat tinggi, geometri konvergen, sifat penjumlahan notasi Sigma, dan strategi eliminasi deret teleskopik.',
    domain: 'Kalkulus & Notasi Sigma',
    estimatedDuration: '45 Menit',
    trackCount: 5,
    questionCount: 15,
    accentColor: '#10B981',
    geometricArtType: 'sigma-series',
    slides: [
      {
        id: 's4-1',
        moduleId: 'mod-4',
        orderIndex: 1,
        title: 'Sifat-Sifat Notasi Sigma (Σ)',
        subtitle: 'Aturan linearitas dan pergeseran indeks',
        category: 'Konsep Dasar',
        contentMarkdown: 'Notasi sigma melambangkan penjumlahan berurutan. Sifat linear: ∑(c · aₖ) = c · ∑ aₖ dan ∑(aₖ ± bₖ) = ∑ aₖ ± ∑ bₖ. Sifat pergeseran indeks: ∑_{k=1}^n aₖ = ∑_{k=1+p}^{n+p} a_{k-p}.',
        mathFormulas: ['\\sum_{k=1}^n c = n \\cdot c', '\\sum_{k=1}^n k = \\frac{n(n+1)}{2}', '\\sum_{k=1}^n k^2 = \\frac{n(n+1)(2n+1)}{6}'],
        keyTakeaway: 'Pergeseran batas bawah dan atas sebesar +p memerlukan penggantian indeks k menjadi (k - p).'
      },
      {
        id: 's4-2',
        moduleId: 'mod-4',
        orderIndex: 2,
        title: 'Barisan & Deret Aritmetika Bertingkat',
        subtitle: 'Metode beda bertingkat dan Un = an² + bn + c',
        category: 'Penurunan Rumus',
        contentMarkdown: 'Bila beda barisan belum konstan pada tingkat pertama tetapi konstan pada tingkat kedua bernilai 2a, suku ke-n berbentuk polinomial kuadrat Un = an² + bn + c.',
        mathFormulas: ['2a = \\text{Beda tingkat 2}', '3a + b = U_2 - U_1', 'a + b + c = U_1'],
        keyTakeaway: 'Rumus cepat 2a, 3a+b, a+b+c menyelesaikan barisan bertingkat dua dalam hitungan detik.'
      },
      {
        id: 's4-3',
        moduleId: 'mod-4',
        orderIndex: 3,
        title: 'Deret Geometri Tak Hingga Konvergen',
        subtitle: 'Syarat mutlak rasio |r| < 1',
        category: 'Trik TKA & Intuisi',
        contentMarkdown: 'Deret geometri tak hingga mempunyai jumlah jika dan hanya jika rasio -1 < r < 1. Rumus jumlah: S_∞ = a / (1 - r). Untuk deret suku-suku genap: S_genap = ar / (1 - r²).',
        mathFormulas: ['S_\\infty = \\frac{a}{1 - r}, \\quad |r| < 1', 'S_{ganjil} = \\frac{a}{1 - r^2}, \\quad S_{genap} = \\frac{ar}{1 - r^2}'],
        keyTakeaway: 'Rasio dapat dicari langsung dari rasio S_genap / S_ganjil = r.'
      },
      {
        id: 's4-4',
        moduleId: 'mod-4',
        orderIndex: 4,
        title: 'Deret Teleskopik & Pecahan Parsial',
        subtitle: 'Teknik saling meniadakan suku berurutan',
        category: 'Trik TKA & Intuisi',
        contentMarkdown: 'Pecahan 1 / (k(k+1)) dapat dipecah menjadi 1/k - 1/(k+1). Saat dijumlahkan, suku-suku di tengah saling menghabisi, menyisakan hanya suku pertama dan suku terakhir.',
        mathFormulas: ['\\sum_{k=1}^n \\frac{1}{k(k+1)} = \\left(1 - \\frac{1}{2}\\right) + \\left(\\frac{1}{2} - \\frac{1}{3}\\right) + \\dots = 1 - \\frac{1}{n+1}'],
        keyTakeaway: 'Uraikan penyebut faktorial menjadi pecahan parsial selisih sebelum menjumlahkan.'
      },
      {
        id: 's4-5',
        moduleId: 'mod-4',
        orderIndex: 5,
        title: 'Aplikasi TKA: Pertumbuhan & Peluruhan Eksponensial',
        subtitle: 'Penerapan konsep bunga majemuk dan pembelahan',
        category: 'Contoh Soal TKA',
        contentMarkdown: 'Pertumbuhan populasi atau investasi bunga majemuk mengikuti deret geometri: M_n = M₀(1 + i)ⁿ, sedangkan peluruhan zat radioaktif mengikuti M_n = M₀(1 - p)ⁿ atau M₀ · (1/2)^(t/T).',
        mathFormulas: ['M_n = M_0 (1 + i)^n', 'M_t = M_0 \\left(\\frac{1}{2}\\right)^{\\frac{t}{T_{1/2}}}'],
        keyTakeaway: 'Identifikasi apakah proses merupakan pertambahan tetap (aritmetika) atau perkalian faktor (geometri).'
      }
    ],
    questions: []
  },
  {
    id: 'mod-5',
    orderIndex: 5,
    title: 'Logika & Penalaran Matematis TKA',
    shortDescription: 'Penguasaan tabel kebenaran, ekuivalensi implikasi (kontraposisi), negasi kuantor, dan penarikan kesimpulan silogisme untuk tes skolastik.',
    domain: 'Penalaran Matematis TKA',
    estimatedDuration: '45 Menit',
    trackCount: 5,
    questionCount: 15,
    accentColor: '#10B981',
    geometricArtType: 'logic-topology',
    slides: [
      {
        id: 's5-1',
        moduleId: 'mod-5',
        orderIndex: 1,
        title: 'Implikasi & Ekuivalensi Logis',
        subtitle: 'Kontraposisi, Konvers, dan Invers',
        category: 'Konsep Dasar',
        contentMarkdown: 'Pernyataan kondisional p → q bernilai salah HANYA JIKA premis p bernilai benar tetapi kesimpulan q bernilai salah. Ekuivalensi terpenting dalam soal TKA: p → q ≡ ~p ∨ q ≡ ~q → ~p (kontraposisi).',
        mathFormulas: ['p \\implies q \\equiv \\sim p \\lor q', 'p \\implies q \\equiv \\sim q \\implies \\sim p \\quad (\\text{Kontraposisi})'],
        keyTakeaway: 'Kontraposisi selalu memiliki nilai kebenaran yang sama persis dengan pernyataan aslinya.'
      },
      {
        id: 's5-2',
        moduleId: 'mod-5',
        orderIndex: 2,
        title: 'Negasi Pernyataan Majemuk & Kuantor',
        subtitle: 'Hukum De Morgan dan Kuantor Universal vs Eksistensial',
        category: 'Penurunan Rumus',
        contentMarkdown: 'Negasi dari konjungsi: ~(p ∧ q) ≡ ~p ∨ ~q. Negasi dari implikasi: ~(p → q) ≡ p ∧ ~q. Negasi dari kuantor: ~(∀x, P(x)) ≡ ∃x, ~P(x) ("tidak semua" berarti "ada setidaknya satu yang bukan").',
        mathFormulas: ['\\sim (p \\implies q) \\equiv p \\land \\sim q', '\\sim (\\forall x, P(x)) \\equiv \\exists x, \\sim P(x)'],
        keyTakeaway: 'Ingat bahwa ingkaran dari "Jika p maka q" BUKAN "Jika ~p maka ~q", melainkan "p dan tidak q".'
      },
      {
        id: 's5-3',
        moduleId: 'mod-5',
        orderIndex: 3,
        title: 'Tiga Metode Sah Penarikan Kesimpulan',
        subtitle: 'Modus Ponens, Modus Tollens, dan Silogisme',
        category: 'Konsep Dasar',
        contentMarkdown: '1. Modus Ponens: Premis 1 (p → q), Premis 2 (p) ∴ Kesimpulan (q). 2. Modus Tollens: Premis 1 (p → q), Premis 2 (~q) ∴ Kesimpulan (~p). 3. Silogisme: Premis 1 (p → q), Premis 2 (q → r) ∴ Kesimpulan (p → r).',
        mathFormulas: ['\\text{Ponens: } [(p \\implies q) \\land p] \\implies q', '\\text{Tollens: } [(p \\implies q) \\land \\sim q] \\implies \\sim p', '\\text{Silogisme: } [(p \\implies q) \\land (q \\implies r)] \\implies (p \\implies r)'],
        keyTakeaway: 'Waspadai kekeliruan menegaskan konsekuen (Affirming the Consequent) yang tidak valid.'
      },
      {
        id: 's5-4',
        moduleId: 'mod-5',
        orderIndex: 4,
        title: 'Penalaran Analitik & Diagram Venn Himpunan',
        subtitle: 'Strategi membaca kondisi inklusi dan eksklusi soal TKA',
        category: 'Trik TKA & Intuisi',
        contentMarkdown: 'Banyak soal penalaran umum TKA yang membingungkan dapat diterjemahkan menjadi diagram Venn atau relasi himpunan. Pernyataan "Semua A adalah B" berarti himpunan A berada di dalam B (A ⊆ B). "Beberapa A adalah B" berarti irisan A ∩ B ≠ ∅.',
        mathFormulas: ['\\text{Semua } A \\text{ adalah } B \\iff A \\subseteq B', '\\text{Beberapa } A \\text{ adalah } B \\iff A \\cap B \\neq \\emptyset'],
        keyTakeaway: 'Gambarkan lingkaran Venn untuk melihat tumpang tindih kategori secara visual.'
      },
      {
        id: 's5-5',
        moduleId: 'mod-5',
        orderIndex: 5,
        title: 'Pola Bilangan & Logika Kuantitatif TKA',
        subtitle: 'Identifikasi pola selang-seling dan deret Fibonacci bertingkat',
        category: 'Contoh Soal TKA',
        contentMarkdown: 'Pada TKA bagian kuantitatif, pola barisan angka sering memadukan dua operasi bergantian (misalnya: +3, ×2, +3, ×2) atau dua deret yang melompati satu angka (indeks ganjil dan genap berjalan independen).',
        mathFormulas: ['x_n = a x_{n-1} + b', 'U_{2k} = f(k) \\quad \\text{dan} \\quad U_{2k-1} = g(k)'],
        keyTakeaway: 'Bila pola tidak langsung terbaca, cobalah membagi deret menjadi dua larik berselang satu posisi.'
      }
    ],
    questions: []
  }
];
