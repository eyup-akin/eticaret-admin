import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

import { apiGet } from '../../services/api';
import { useTema } from '../../context/TemaContext';
import { paraBicimle, sayiBicimle } from '../../utils/bicimlendir';

import Yukleniyor from '../Yukleniyor';
import HataKutusu from '../HataKutusu';
import Tablo from '../Tablo';


import { csvIndir, sayiCsv } from '../../utils/disaAktar';
import RaporUstBilgi from './RaporUstBilgi';
// ============================================================
//  KATEGORİ CİRO DAĞILIMI
//
//  NEDEN PASTA GRAFİĞİ?
//  Pasta grafiği "parça / bütün" ilişkisi anlatır — tam olarak
//  buradaki soru bu: toplam cironun ne kadarı hangi kategoriden?
//
//  Zaman içindeki değişimi gösterseydik çizgi grafiği olurdu.
//  Kategorileri kıyaslasaydık çubuk olurdu. Grafik tipi soruya
//  göre seçilir, güzel göründüğü için değil.
//
//  ⚠️ Pastanın bilinen sınırı: 8-10 dilimden sonra okunmaz hale
//  gelir. Kategori sayısı artarsa çubuk grafiğe geçilmeli.
// ============================================================

// ⭐ DEĞİŞTİ — palet artık burada sabit değil, TEMADAN geliyor.
//
// NEDEN SABİT SIRA, NEDEN RASTGELE RENK DEĞİL?
// Rastgele renk her yenilemede değişir; kullanıcı "geçen sefer mavi
// olan neydi" diye sorar. Sabit sıra, aynı sıradaki kategoriye hep
// aynı rengi verir.
//
// ⚠️ ESKİ PALET RENK KÖRLÜĞÜ TESTİNDEN GEÇMİYORDU.
// Buradaki dizi "birbirinden ayırt edilebilir tonlarda seçildi"
// diye yazılmıştı ama ÖLÇÜLMEMİŞTİ. Ölçünce çıkan sonuç:
//   • turuncu ↔ yeşil, protanopide ΔE 5.8 — ayırt edilemiyor
//   • #7f8c8d kroma tabanının altında — gri okunuyor
//   • yeşil ve turuncu, açık zeminde 3:1 kontrastın altında
//
// Yeni dizi tema.js'te (grafik1..grafik8) ve doğrulayıcıdan geçti.
// Ayrıca temaya taşınmasının ikinci faydası: koyu temada kendi
// basamakları var, artık pasta koyu zeminde de okunuyor.
//
// Göz kararı yerine ölçüm: "birbirinden ayırt edilebilir" cümlesi
// iyi niyetliydi ama yanlıştı.
function paletiOlustur(renkler) {
  return [
    renkler.grafik1,
    renkler.grafik2,
    renkler.grafik3,
    renkler.grafik4,
    renkler.grafik5,
    renkler.grafik6,
    renkler.grafik7,
    renkler.grafik8,
  ];
}



export default function KategoriRaporu({ baslangic, bitis }) {
  const { renkler } = useTema();

  // ⭐ YENİ — palet temadan türetiliyor, tema değişince renkler de
  // değişiyor. Modül seviyesinde sabit dizi olsaydı koyu temada
  // açık tema renkleri kullanılmaya devam ederdi.
  const palet = paletiOlustur(renkler);

  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  async function getir() {
    setYukleniyor(true);
    setHata('');

    try {
      const p = new URLSearchParams();

      if (baslangic !== '') {
        p.append('baslangic', baslangic);
      }

      if (bitis !== '') {
        p.append('bitis', bitis);
      }

      const sonuc = await apiGet('/admin/reports/kategoriler?' + p.toString());
      setVeri(sonuc);
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    getir();
  }, [baslangic, bitis]);

  // ⚠️ Bu fonksiyon bileşenin İÇİNDE olmak zorunda.
  //
  // Dışarı yazsaydık "veri" state'ini göremezdi — state
  // bileşen fonksiyonunun içinde doğar, dışarıdaki bir
  // fonksiyon o kapsama erişemez.
  //
  // Dışarı çıkabilen fonksiyonlar sadece "saf" olanlardır:
  // girdisi parametrelerden gelen, dış dünyaya bakmayanlar
  // (sayiCsv gibi).
  function disaAktar() {
    const basliklar = ['Kategori', 'Satılan Adet', 'Ciro', 'Pay %'];

    const satirlar = veri.kategoriler.map((k) => [
      k.kategoriAdi,
      k.adet,
      sayiCsv(k.ciro),
      sayiCsv(k.yuzde),
    ]);

    csvIndir('kategori-raporu', basliklar, satirlar);
  }

  if (yukleniyor) {
    return <Yukleniyor yazi="Kategori dağılımı hesaplanıyor..." />;
  }

  if (hata !== '') {
    return <HataKutusu mesaj={hata} tekrarDene={getir} />;
  }

  if (!veri) {
    return null;
  }

  // Recharts kendi alan adlarını bekliyor: "name" ve "value".
  // Türkçe alan adlarımızı burada dönüştürüyoruz.
  //
  // Neden API'yi Recharts'a göre yazmadık? API bir sözleşmedir ve
  // bir grafik kütüphanesinin adlandırma tercihine bağlanmamalı.
  // Kütüphane değişirse burada tek satır değişir, backend değişmez.
  const pastaVerisi = veri.kategoriler.map((k) => ({
    name: k.kategoriAdi,
    value: Number(k.ciro),
  }));

  const sutunlar = [
    {
      baslik: 'Kategori',
      hucre: (k, i) => <span className="musteri-ad">{k.kategoriAdi}</span>,
    },
    {
      baslik: 'Satılan Adet',
      hizala: 'sag',
      hucre: (k) => <span className="rapor-sayi">{sayiBicimle(k.adet)}</span>,
    },
    {
      baslik: 'Ciro',
      hizala: 'sag',
      hucre: (k) => <span className="rapor-sayi">{paraBicimle(k.ciro)}</span>,
    },
    {
      baslik: 'Pay',
      hizala: 'sag',
      hucre: (k) => <span className="rapor-sayi">%{k.yuzde}</span>,
    },
  ];

  return (
    <div>
      {/* Hiç veri yoksa grafiği ÇİZMİYORUZ.
          Boş bir pasta "bozuk" görünür; tablo zaten "veri yok"
          mesajını gösterecek. */}
      {veri.kategoriler.length > 0 && (
        <div className="rapor-grafik-kutu">
          <h3 className="rapor-bolum-baslik">
            🥧 Ciro Dağılımı — {veri.baslangic} – {veri.bitis}
          </h3>

          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pastaVerisi}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"

                /* innerRadius > 0 → halka (donut) grafiği.
                   Ortadaki boşluk dilimlerin kalınlığını
                   kıyaslamayı kolaylaştırır; dolu pastada
                   göz merkeze yakın alanı yanlış ölçer. */
                innerRadius={60}
                outerRadius={110}

                /* Dilimler arası ince boşluk — bitişik iki
                   benzer renk birbirine karışmasın. */
                paddingAngle={2}

                /* Dilim üzerinde yüzde yazsın. percent 0-1 arası
                   gelir, 100 ile çarpıp yuvarlıyoruz. */
                label={({ name, percent }) =>
                  `${name} %${(percent * 100).toFixed(0)}`
                }
              >
                {/* Her dilime paletten sırayla renk veriyoruz.
                    % palet.length: kategori sayısı paletten fazlaysa
                    başa dönüp tekrar kullanır — renk biter diye
                    grafik boş kalmaz.

                    ⚠️ Renk tekrarı ideal değil ama pastanın kendi
                    sınırı zaten 8-10 dilim (yukarıdaki nota bak).
                    O sınıra gelindiğinde çözüm renk üretmek değil,
                    grafik tipini değiştirmek. */}
                {pastaVerisi.map((girdi, i) => (
                  <Cell key={i} fill={palet[i % palet.length]} />
                ))}
              </Pie>

              <Tooltip
                formatter={(v) => paraBicimle(v)}
                contentStyle={{
                  backgroundColor: renkler.kartArka,
                  border: '1px solid ' + renkler.kenarlik,
                  borderRadius: 8,
                  color: renkler.yaziKoyu,
                }}
              />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <RaporUstBilgi
        baslangic={veri.baslangic}
        bitis={veri.bitis}
        ekBilgi={'Toplam ciro: ' + paraBicimle(veri.toplamCiro)}
        disaAktar={disaAktar}
      />

      <Tablo
        sutunlar={sutunlar}
        veriler={veri.kategoriler}
        anahtar={(k) => k.kategoriId}
        bosMesaj="Bu dönemde satış yok."
      />
    </div>
  );
}