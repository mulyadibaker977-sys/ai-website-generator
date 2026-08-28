export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          AI Website Generator
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Buat website hanya dengan mengetik permintaan.  
          Versi sederhana untuk pelajar & orang awam.
        </p>

        <div className="bg-white rounded-xl shadow-md p-6 text-left">
          <p className="text-sm text-gray-500 mb-2">Contoh permintaan:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Buatkan landing page untuk toko kue</li>
            <li>Buat portofolio sederhana untuk desainer</li>
            <li>Website sekolah dengan warna biru</li>
          </ul>
        </div>

        <p className="mt-8 text-sm text-gray-400">
          Fitur chat & generator AI akan segera ditambahkan...
        </p>
      </div>
    </main>
  );
}
