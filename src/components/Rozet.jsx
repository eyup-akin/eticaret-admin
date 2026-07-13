import './Rozet.css';

// Backend'den gelen ham durum metinlerini
// güzel yazı + renk çiftine çeviriyoruz.
const DURUMLAR = {
  hazirlaniyor: { yazi: 'Hazırlanıyor', renk: '#f39c12' },
  kargoda:      { yazi: 'Kargoda',      renk: '#2563eb' },
  teslim_edildi:{ yazi: 'Teslim Edildi', renk: '#27ae60' },
  iptal:        { yazi: 'İptal',        renk: '#e74c3c' },

  odendi:       { yazi: 'Ödendi',       renk: '#27ae60' },
  beklemede:    { yazi: 'Beklemede',    renk: '#f39c12' },
  basarili:     { yazi: 'Başarılı',     renk: '#27ae60' },
  basarisiz:    { yazi: 'Başarısız',    renk: '#e74c3c' },
};

export default function Rozet({ durum }) {
  // Tanımadığımız bir durum gelirse ham halini gri göster
  const bilgi = DURUMLAR[durum] || { yazi: durum, renk: '#999999' };

  return (
    <span
      className="rozet"
      style={{
        backgroundColor: bilgi.renk + '22', // saydam arka plan
        color: bilgi.renk,
      }}
    >
      {bilgi.yazi}
    </span>
  );
}