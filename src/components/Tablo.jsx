import './Tablo.css';

// sutunlar : [{ baslik: 'Ürün Adı', hucre: (satir) => satir.name, hizala: 'sag' }]
// veriler  : [{ id: 1, name: '...' }, ...]
// anahtar  : (satir) => satir.id     — React'in her satırı tanıması için
// bosMesaj : veri yoksa gösterilecek yazı
export default function Tablo({ sutunlar, veriler, anahtar, bosMesaj = 'Kayıt bulunamadı.' }) {

  // Veri yoksa tabloyu hiç çizme, mesaj göster
  if (!veriler || veriler.length === 0) {
    return (
      <div className="tablo-kutu">
        <div className="tablo-bos">{bosMesaj}</div>
      </div>
    );
  }

  function hizaSinifi(hizala) {
    if (hizala === 'sag') {
      return 'tablo-sag';
    }

    if (hizala === 'orta') {
      return 'tablo-orta';
    }

    return '';
  }

  return (
    <div className="tablo-kutu">
      <div className="tablo-kaydir">
        <table className="tablo">

          <thead>
            <tr>
              {sutunlar.map((sutun, i) => (
                <th key={i} className={hizaSinifi(sutun.hizala)}>
                  {sutun.baslik}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {veriler.map((satir) => (
              <tr key={anahtar(satir)}>
                {sutunlar.map((sutun, i) => (
                  <td key={i} className={hizaSinifi(sutun.hizala)}>
                    {sutun.hucre(satir)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}