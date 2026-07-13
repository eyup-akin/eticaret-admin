import { useEffect, useState } from 'react';
import { apiGet } from './services/api';
import { API_URL } from './services/config';

// GEÇİCİ TEST EKRANI — Adım 38'de yerine gerçek uygulama gelecek.
// Amaç: servis katmanı backend'e ulaşabiliyor mu, onu görmek.
export default function App() {
  const [urunler, setUrunler] = useState([]);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    async function urunleriGetir() {
      try {
        const veri = await apiGet('/products');
        setUrunler(veri);
      } catch (e) {
        setHata(e.message);
      } finally {
        setYukleniyor(false);
      }
    }

    urunleriGetir();
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <h1>Admin Panel — Bağlantı Testi</h1>

      <p style={{ color: '#666', marginTop: 8 }}>
        Backend adresi: <b>{API_URL}</b>
      </p>

      {yukleniyor && <p style={{ marginTop: 20 }}>Yükleniyor...</p>}

      {hata !== '' && (
        <p style={{ marginTop: 20, color: '#e74c3c' }}>
          HATA: {hata}
        </p>
      )}

      {!yukleniyor && hata === '' && (
        <div style={{ marginTop: 20 }}>
          <p>
            Bağlantı başarılı. Toplam <b>{urunler.length}</b> ürün geldi.
          </p>

          <ul style={{ marginTop: 12, paddingLeft: 20 }}>
            {urunler.slice(0, 5).map((u) => (
              <li key={u.id} style={{ marginBottom: 4 }}>
                {u.name} — {u.price} TL
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}