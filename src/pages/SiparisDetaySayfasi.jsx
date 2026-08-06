import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiGet, apiPut } from '../services/api';
import { paraBicimle, sayiBicimle, tarihBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Buton from '../components/Buton';
import Rozet from '../components/Rozet';
import OnayPenceresi from '../components/OnayPenceresi';
import KargoyaVerModal from '../components/KargoyaVerModal';   // ⭐ YENİ

import KargoEtiketi from '../components/KargoEtiketi';

import './SiparisDetaySayfasi.css';

// Durum kodlarını okunabilir yazıya çeviriyoruz.
// Hangi geçişin MÜMKÜN olduğuna backend karar veriyor (izinliGecisler),
// biz sadece onu güzel gösteriyoruz.
const DURUM_YAZILARI = {
  hazirlaniyor: 'Hazırlanıyor',
  kargoda: 'Kargoya Ver',
  teslim_edildi: 'Teslim Edildi Olarak İşaretle',
  iptal: 'İptal',
};

export default function SiparisDetaySayfasi() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [siparis, setSiparis] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  const [islemde, setIslemde] = useState(false);

  // İptal
  const [iptalSebebi, setIptalSebebi] = useState('');
  const [iptalOnayi, setIptalOnayi] = useState(false);

  // ⭐ YENİ — kargoya verme penceresi açık mı?
  const [kargoModalAcik, setKargoModalAcik] = useState(false);

  // ⭐ YENİ — takip numarası panoya kopyalandı mı? (geçici geri bildirim)
  const [kopyalandi, setKopyalandi] = useState(false);

  // Etiket verisi — yazdırma anında çekilir, sayfa açılışında değil.
  // Sebep: admin siparişlerin çoğunu görüntüler ama etiket basmaz.
  // Herkese peşin çekmek gereksiz yük olurdu.
  const [etiketVerisi, setEtiketVerisi] = useState(null);

  async function etiketYazdir() {
    try {
      const veri = await apiGet('/admin/orders/etiket?ids=' + id);
      setEtiketVerisi(veri);
    } catch (e) {
      setHata(e.message);
    }
  }

  async function siparisiGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      const veri = await apiGet('/admin/orders/' + id);
      setSiparis(veri);
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    siparisiGetir();
  }, [id]);

  // Etiket verisi geldiğinde yazdırma penceresini aç.
  //
  // Neden useEffect? setEtiketVerisi HEMEN ekrana yansımaz — React
  // state güncellemesini bir sonraki render'a bırakır. Hemen window.print()
  // çağırsaydık etiket henüz DOM'da olmazdı ve BOŞ sayfa basılırdı.
  // useEffect render bittikten sonra çalışır, o an etiket hazırdır.
  useEffect(() => {
    if (etiketVerisi) {
      window.print();
      setEtiketVerisi(null);  // yazdırma bitince temizle
    }
  }, [etiketVerisi]);

  // ⭐ YENİ — "Kopyalandı" yazısını 2 saniye sonra sil.
  //
  // Neden setTimeout'u doğrudan kopyala fonksiyonunun içine koymadık?
  // Koysaydık, admin üst üste iki kez kopyaladığında iki zamanlayıcı
  // birden çalışır ve ikincisi henüz süresi dolmadan birincisi yazıyı
  // silerdi. Effect'in temizlik fonksiyonu eski zamanlayıcıyı iptal
  // ederek bunu engelliyor.
  useEffect(() => {
    if (!kopyalandi) {
      return;
    }

    const sayac = setTimeout(() => setKopyalandi(false), 2000);
    return () => clearTimeout(sayac);
  }, [kopyalandi]);

  // ---------- DURUMU İLERLET ----------
  //
  // ⭐ DEĞİŞTİ: "kargoda" geçişi artık doğrudan istek atmıyor.
  //
  // Backend bu geçişte firma + takip numarası zorunlu kılıyor. Elimizde
  // olmayan veriyle istek atıp 400 yemek yerine önce pencereyi açıp
  // veriyi topluyoruz. Diğer geçişler (teslim_edildi) ek bilgi
  // istemediği için eskisi gibi tek tıkla ilerliyor.
  async function durumuIlerlet(yeniDurum) {
    if (yeniDurum === 'kargoda') {
      setHata('');
      setBasari('');
      setKargoModalAcik(true);
      return;
    }

    setIslemde(true);
    setHata('');
    setBasari('');

    try {
      await apiPut('/admin/orders/' + id + '/status', { status: yeniDurum });

      setBasari('Kargo durumu güncellendi. ✅');
      await siparisiGetir();
    } catch (e) {
      setHata(e.message);
    } finally {
      setIslemde(false);
    }
  }

  // ⭐ YENİ — modal "Kargoya Ver" dediğinde çalışır
  async function kargoyaVer(firma, takipNo) {
    setIslemde(true);
    setHata('');
    setBasari('');

    try {
      await apiPut('/admin/orders/' + id + '/status', {
        status: 'kargoda',
        shippingCompany: firma,
        trackingNumber: takipNo,
      });

      // Pencereyi ancak İSTEK BAŞARILI OLUNCA kapatıyoruz.
      //
      // Hemen kapatsaydık ve sunucu reddetseydi (geçersiz firma, geçiş
      // hatası), admin girdiği bilgileri kaybeder ve baştan yazardı.
      // Hata durumunda pencere açık kalıyor, mesaj arkada görünüyor.
      setKargoModalAcik(false);
      setBasari(`Sipariş kargoya verildi. Takip no: ${takipNo} ✅`);

      await siparisiGetir();
    } catch (e) {
      setHata(e.message);
    } finally {
      setIslemde(false);
    }
  }

  // ⭐ YENİ — takip numarasını panoya kopyala
  async function takipNoKopyala() {
    try {
      await navigator.clipboard.writeText(siparis.takipNo);
      setKopyalandi(true);
    } catch {
      // Pano erişimi HTTPS veya localhost dışında engellidir.
      // Kopyalanamazsa numara zaten ekranda yazıyor, admin elle seçebilir.
      // Bu yüzden hata mesajı basmıyoruz — çözemeyeceği bir uyarı
      // vermek gereksiz gürültü.
      setHata('Panoya kopyalanamadı, numarayı elle seçebilirsin.');
    }
  }

  // ---------- İPTAL ----------
  async function siparisiIptalEt() {
    setIslemde(true);
    setHata('');
    setBasari('');

    try {
      await apiPut('/admin/orders/' + id + '/cancel', {
        reason: iptalSebebi.trim(),
      });

      setBasari('Sipariş iptal edildi. Stok iade edildi, ödeme geri alındı. ✅');
      setIptalOnayi(false);
      setIptalSebebi('');

      await siparisiGetir();
    } catch (e) {
      setHata(e.message);
      setIptalOnayi(false);
    } finally {
      setIslemde(false);
    }
  }

  if (yukleniyor) {
    return <Yukleniyor yazi="Sipariş detayı getiriliyor..." />;
  }

  if (siparis === null) {
    return (
      <div>
        <HataKutusu mesaj={hata} tekrarDene={siparisiGetir} />

        <div style={{ marginTop: 16 }}>
          <Buton tip="ikincil" onClick={() => navigate('/siparisler')}>
            ← Siparişlere Dön
          </Buton>
        </div>
      </div>
    );
  }

  const sebepGecerli =
    iptalSebebi.trim().length >= 5 && iptalSebebi.trim().length <= 500;

  return (
    <div>
      {/* ---------- ÜST ---------- */}
      <div className="detay-ust">
        <div>
          <h1 className="sayfa-baslik">Sipariş {siparis.siparisNo}</h1>

          <p className="sayfa-altyazi" style={{ marginBottom: 0 }}>
            {tarihBicimle(siparis.tarih)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Buton tip="ikincil" onClick={etiketYazdir}>
            🏷️ Etiket Yazdır
          </Buton>

          <Buton tip="ikincil" onClick={() => navigate('/siparisler')}>
            ← Siparişlere Dön
          </Buton>
        </div>
      </div>

      {basari !== '' && <div className="basari-kutusu">{basari}</div>}

      {hata !== '' && (
        <div style={{ marginBottom: 16 }}>
          <HataKutusu mesaj={hata} />
        </div>
      )}

      {/* ⭐ YENİ — MÜŞTERİ NOTU
          
          Neden en üstte ve tam genişlikte?
          Bu notun tek amacı kargo hazırlayan kişinin onu OKUMASI.
          Sağ sütundaki bir kutuya koysaydık, ekranı hızlıca tarayan
          biri kaçırabilirdi ve "kapıya bırakın" notu işe yaramazdı.
          Bilginin yeri, kaçırılmasının maliyetiyle orantılı olmalı.
          
          Koşullu: notu olmayan siparişlerde boş kutu göstermiyoruz. */}
      {siparis.musteriNotu && (
        <div className="musteri-notu-kutu">
          <div className="musteri-notu-baslik">
            📝 Müşteri Notu — kargo hazırlanırken dikkate al
          </div>

          <div className="musteri-notu-metin">{siparis.musteriNotu}</div>
        </div>
      )}

      <div className="detay-izgara">

        {/* ============ SOL SÜTUN ============ */}
        <div>

          {/* --- ÜRÜNLER --- */}
          <div className="kutu">
            <div className="kutu-baslik">📦 Sipariş Edilen Ürünler</div>

            <table className="kalem-tablo">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th className="sag">Adet</th>
                  <th className="sag">Birim Fiyat</th>
                  <th className="sag">Ara Toplam</th>
                </tr>
              </thead>

              <tbody>
                {siparis.kalemler.map((k) => (
                  <tr key={k.urunId}>
                    <td><b>{k.urunAdi}</b></td>
                    <td className="sag">{sayiBicimle(k.adet)}</td>
                    <td className="sag">{paraBicimle(k.birimFiyat)}</td>
                    <td className="sag">{paraBicimle(k.araToplam)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ⭐ YENİ — TUTAR ÖZETİ (döküm)

                Eskiden burada TEK satır vardı: "Sipariş Toplamı".
                Yukarıdaki kalem tablosunun ara toplamları ile o rakam
                birbirini tutmuyordu ve sebebini görmenin yolu yoktu —
                aradaki fark indirim mi, kargo mu belli değildi.

                Bu, destek talebine dönüşen türden bir belirsizlik:
                müşteri "neden 499,90 çekildi" diye arayınca operatör
                ekranda cevabı bulamıyordu.

                ⚠️ HESAP SIRASI: ara toplam → indirim → kargo → toplam.
                Kargo indirimden SONRA çünkü kupon kargoya uygulanmıyor
                (bkz. SepetHesaplayici). Kargoyu indirimin üstüne
                koysaydık ekran, sunucunun yapmadığı bir hesabı
                anlatıyor olurdu.

                ⚠️ Tüm değerler DONDURULMUŞ: sipariş anında Order
                tablosuna yazıldılar. Kuponun ya da mağaza kargo
                ücretinin bugünkü hali burayı DEĞİŞTİRMEZ. */}
            <div className="ozet-blok">
              <div className="ozet-satiri">
                <span className="ozet-etiket">Ara toplam</span>
                <span className="ozet-deger">{paraBicimle(siparis.araToplam)}</span>
              </div>

              {/* İndirim satırı sadece indirim varsa.
                  "İndirim: 0,00 ₺" yazmak gürültü olurdu. */}
              {siparis.indirim > 0 && (
                <div className="ozet-satiri">
                  <span className="ozet-etiket">
                    İndirim{siparis.kuponKodu ? ` (${siparis.kuponKodu})` : ''}
                  </span>
                  <span className="ozet-deger ozet-indirim">
                    −{paraBicimle(siparis.indirim)}
                  </span>
                </div>
              )}

              {/* Kargo satırı KOŞULSUZ — indirimin aksine.

                  0 olduğunda satırı gizlemek yerine "Ücretsiz"
                  yazıyoruz. Operatör için "kargo alınmamış" ile
                  "kargo bilgisi yok" farklı şeyler; boşluk bırakmak
                  ikincisi gibi okunurdu. */}
              <div className="ozet-satiri">
                <span className="ozet-etiket">Kargo</span>

                {siparis.kargoUcreti > 0 ? (
                  <span className="ozet-deger">{paraBicimle(siparis.kargoUcreti)}</span>
                ) : (
                  <span className="ozet-deger ozet-ucretsiz">Ücretsiz</span>
                )}
              </div>
            </div>

            <div className="toplam-satiri">
              <span className="toplam-etiket">Sipariş Toplamı</span>
              <span className="toplam-tutar">{paraBicimle(siparis.tutar)}</span>
            </div>

            {/* ⭐ YENİ — KDV DÖKÜMÜ

                ⚠️ TOPLAMIN ALTINDA, ÜSTÜNDE DEĞİL — bilinçli.

                Ara toplam/indirim/kargo satırları toplama GİDEN
                adımlar; onları toplamın üstüne koyduk. KDV ise
                toplama hiçbir şey EKLEMİYOR: fiyatlar KDV dahil
                olduğu için vergi zaten o rakamın içinde.

                Üste koysaydık operatör onu da toplanan bir kalem
                sanır, "ara toplam + kargo + KDV = toplam" diye
                okumaya çalışır ve hesabı tutturamazdı.

                ⚠️ varMi false ise blok HİÇ çizilmiyor. Bu özellik
                eklenmeden önceki siparişlerde oran bilinmiyor;
                "KDV: 0,00 TL" yazmak eksik değil YANLIŞ bilgi olurdu.

                ⚠️ Oran başına ayrı satır: sepette %1 gıda ile %20
                elektronik birlikte olabilir. Tek bir "KDV" satırı
                göstermek, fatura kesilirken gereken kırılımı gizlerdi. */}
            {siparis.kdv?.varMi && (
              <div className="kdv-blok">
                <div className="kdv-baslik">KDV Dökümü (fiyata dahil)</div>

                {siparis.kdv.satirlar.map((s) => (
                  <div className="ozet-satiri" key={s.oran}>
                    <span className="ozet-etiket">
                      KDV %{s.oran} — matrah {paraBicimle(s.matrah)}
                    </span>
                    <span className="ozet-deger">{paraBicimle(s.vergi)}</span>
                  </div>
                ))}

                {/* Toplam satırı SADECE birden fazla oran varsa.
                    Tek oran varsa üstteki satırla birebir aynı sayı
                    olurdu — aynı bilgiyi iki kez göstermek okuyanı
                    "acaba farklı bir şey mi?" diye durdurur. */}
                {siparis.kdv.satirlar.length > 1 && (
                  <div className="ozet-satiri kdv-toplam">
                    <span className="ozet-etiket">Toplam KDV</span>
                    <span className="ozet-deger">
                      {paraBicimle(siparis.kdv.toplamVergi)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="durum-ipucu">
              💡 Buradaki fiyatlar <b>sipariş anındaki</b> fiyatlardır.
              Ürünün fiyatı sonradan değişse bile bu kayıt değişmez.
            </div>
          </div>

          {/* --- 3 BİLGİ KARTI YAN YANA --- */}
          <div className="bilgi-izgara">

            {/* MÜŞTERİ */}
            <div className="kutu">
              <div className="kutu-baslik">👤 Müşteri</div>

              <div className="bilgi-satiri">
                <span className="bilgi-etiket">Ad Soyad</span>
                <span className="bilgi-deger">{siparis.musteri?.fullName || '—'}</span>
              </div>

              <div className="bilgi-satiri">
                <span className="bilgi-etiket">E-posta</span>
                <span className="bilgi-deger">{siparis.musteri?.email || '—'}</span>
              </div>

              <div className="bilgi-satiri">
                <span className="bilgi-etiket">Müşteri No</span>
                <span className="bilgi-deger">#{siparis.musteri?.id || '—'}</span>
              </div>
            </div>

            {/* ADRES */}
            <div className="kutu">
              <div className="kutu-baslik">📍 Teslimat Adresi</div>

              {siparis.adres ? (
                <>
                  <div className="bilgi-satiri">
                    <span className="bilgi-etiket">Alıcı</span>
                    <span className="bilgi-deger">
                      {siparis.adres.aliciAdi || '—'}
                    </span>
                  </div>

                  <div className="bilgi-satiri">
                    <span className="bilgi-etiket">Başlık</span>
                    <span className="bilgi-deger">{siparis.adres.title}</span>
                  </div>

                  <div className="bilgi-satiri">
                    <span className="bilgi-etiket">Şehir</span>
                    <span className="bilgi-deger">{siparis.adres.city}</span>
                  </div>

                  <div className="bilgi-satiri">
                    <span className="bilgi-etiket">Telefon</span>
                    <span className="bilgi-deger">
                      {siparis.adres.telefon || '—'}
                    </span>
                  </div>

                  <div className="bilgi-satiri">
                    <span className="bilgi-etiket">Adres</span>
                    <span className="bilgi-deger">{siparis.adres.fullAddress}</span>
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--yaziGri)', fontSize: 14 }}>
                  Adres kaydı bulunamadı.
                </div>
              )}
            </div>

            {/* ÖDEME */}
            <div className="kutu">
              <div className="kutu-baslik">💳 Ödeme</div>

              <div className="bilgi-satiri">
                <span className="bilgi-etiket">Durum</span>
                <span className="bilgi-deger">
                  <Rozet durum={siparis.odemeDurumu} />
                </span>
              </div>

              <div className="bilgi-satiri">
                <span className="bilgi-etiket">Kart</span>
                <span className="bilgi-deger kart-mono">
                  •••• {siparis.kartSon4 || '????'}
                </span>
              </div>

              {siparis.odeme && (
                <div className="bilgi-satiri">
                  <span className="bilgi-etiket">Ödeme Tarihi</span>
                  <span className="bilgi-deger">
                    {tarihBicimle(siparis.odeme.odemeTarihi)}
                  </span>
                </div>
              )}

              <div className="durum-ipucu">
                🔒 Kartın yalnızca son 4 hanesi saklanır.
              </div>
            </div>

          </div>
        </div>

        {/* ============ SAĞ SÜTUN ============ */}
        <div>

          {/* --- KARGO DURUMU --- */}
          <div className="kutu">
            <div className="kutu-baslik">🚚 Kargo Durumu</div>

            <div style={{ marginBottom: 16 }}>
              <Rozet durum={siparis.durum} />
            </div>

            {/* ⭐ YENİ — KARGO BİLGİLERİ
                
                Sadece takip numarası varsa çiziliyor. Sipariş
                "hazırlanıyor" iken bu blok hiç yok — boş satırlar
                göstermek yerine bloğu hiç çizmemek daha temiz. */}
            {siparis.takipNo && (
              <div className="kargo-bilgi">
                <div className="bilgi-satiri">
                  <span className="bilgi-etiket">Firma</span>
                  <span className="bilgi-deger">{siparis.kargoFirmasi || '—'}</span>
                </div>

                <div className="bilgi-satiri">
                  <span className="bilgi-etiket">Takip No</span>

                  <span className="bilgi-deger">
                    <span className="takip-no-mono">{siparis.takipNo}</span>

                    {/* Kopyala butonu: numara uzun ve elle seçmek zor.
                        Metin butonun İÇİNDE değişiyor — ayrı bir bildirim
                        kutusu açmak bu kadar küçük bir onay için abartı
                        olurdu. Geri bildirim eylemin olduğu yerde. */}
                    <button
                      className="kopyala-buton"
                      onClick={takipNoKopyala}
                      title="Takip numarasını kopyala"
                    >
                      {kopyalandi ? '✅ Kopyalandı' : '📋 Kopyala'}
                    </button>
                  </span>
                </div>

                <div className="bilgi-satiri">
                  <span className="bilgi-etiket">Kargoya Verildi</span>
                  <span className="bilgi-deger">
                    {tarihBicimle(siparis.kargoyaVerilmeTarihi)}
                  </span>
                </div>

                {/* Teslim tarihi yalnızca teslim edilince dolar */}
                {siparis.teslimTarihi && (
                  <div className="bilgi-satiri">
                    <span className="bilgi-etiket">Teslim Edildi</span>
                    <span className="bilgi-deger">
                      {tarihBicimle(siparis.teslimTarihi)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Sunucu hangi geçişlere izin veriyorsa O butonlar çıkar.
                Kural burada değil, backend'de. Biz sadece uyguluyoruz. */}
            {siparis.izinliGecisler.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {siparis.izinliGecisler.map((d) => (
                  <Buton
                    key={d}
                    onClick={() => durumuIlerlet(d)}
                    disabled={islemde}
                    style={{ width: '100%' }}
                  >
                    {islemde ? 'İşleniyor...' : '➡️ ' + (DURUM_YAZILARI[d] || d)}
                  </Buton>
                ))}
              </div>
            ) : (
              <div className="son-durum">
                Bu sipariş <b>son durumunda</b>. Kargo durumu artık değiştirilemez.
              </div>
            )}

            <div className="durum-ipucu">
              Sipariş yalnızca ileri gider:
              <br />
              Hazırlanıyor → Kargoda → Teslim Edildi
            </div>
          </div>

          {/* --- İPTAL --- */}
          {siparis.durum === 'iptal' ? (
            // ZATEN İPTAL EDİLMİŞ → sebebi göster
            <div className="iptal-bilgi-kutu">
              <div className="iptal-baslik">⛔ Sipariş İptal Edildi</div>

              <div className="bilgi-satiri" style={{ padding: '4px 0' }}>
                <span className="bilgi-etiket">İptal Tarihi</span>
                <span className="bilgi-deger">
                  {tarihBicimle(siparis.iptalTarihi)}
                </span>
              </div>

              <div style={{ fontSize: 13, color: 'var(--yaziOrta)', marginTop: 10 }}>
                İptal sebebi:
              </div>

              <div className="iptal-sebep-metin">
                "{siparis.iptalSebebi}"
              </div>
            </div>
          ) : siparis.iptalEdilebilir ? (
            // İPTAL EDİLEBİLİR → form göster
            <div className="iptal-kutu">
              <div className="iptal-baslik">⛔ Siparişi İptal Et</div>

              <div className="iptal-aciklama">
                İptal edilince: ürünlerin <b>stoğu geri eklenir</b>,
                ödeme <b>iade</b> olarak işaretlenir ve tutar <b>gelirden düşer</b>.
                Bu işlem geri alınamaz.
              </div>

              <textarea
                className="iptal-alan"
                value={iptalSebebi}
                onChange={(e) => setIptalSebebi(e.target.value)}
                placeholder="İptal sebebini yaz... (örn: Müşteri telefonla iptal talep etti)"
                maxLength={500}
                disabled={islemde}
              />

              <div className="karakter-sayaci">
                {iptalSebebi.trim().length} / 500 (en az 5 karakter)
              </div>

              <Buton
                tip="tehlike"
                onClick={() => setIptalOnayi(true)}
                disabled={!sebepGecerli || islemde}
                style={{ width: '100%' }}
              >
                {islemde ? 'İptal ediliyor...' : '⛔ Siparişi İptal Et'}
              </Buton>
            </div>
          ) : (
            // İPTAL EDİLEMEZ (teslim edilmiş)
            <div className="kutu">
              <div className="kutu-baslik">⛔ İptal</div>

              <div className="son-durum">
                Bu sipariş <b>teslim edilmiş</b>. Teslim edilen siparişler
                iptal edilemez — iade süreci ayrı yürütülür.
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ---------- ⭐ KARGOYA VERME PENCERESİ ---------- */}
      {/* Firma listesini sipariş detayıyla birlikte aldık, ayrı istek yok.
          ?? [] : sunucu bir sebeple göndermezse modal patlamasın,
          kendi uyarısını göstersin. */}
      <KargoyaVerModal
        acik={kargoModalAcik}
        firmalar={siparis.kargoFirmalari ?? []}
        kapat={() => setKargoModalAcik(false)}
        kaydet={kargoyaVer}
        islemde={islemde}
      />

      {/* ---------- İPTAL ONAY PENCERESİ ---------- */}
      <OnayPenceresi
        acik={iptalOnayi}
        baslik="Siparişi iptal et"
        mesaj={
          `${siparis.siparisNo} numaralı siparişi iptal etmek üzeresin. ` +
          `Stok geri eklenecek, ${paraBicimle(siparis.tutar)} tutarındaki ödeme iade edilecek. ` +
          `Bu işlem geri alınamaz.`
        }
        onayla={siparisiIptalEt}
        iptal={() => setIptalOnayi(false)}
        islemde={islemde}
      />

      {/* YAZDIRMA ALANI — ekranda görünmez, sadece yazdırırken basılır.
          @media print kuralı bu sınıfı arıyor. */}
      {etiketVerisi && (
        <div className="yazdirma-alani">
          {etiketVerisi.etiketler.map((e) => (
            <KargoEtiketi
              key={e.id}
              etiket={e}
              magaza={etiketVerisi.magaza}
            />
          ))}
        </div>
      )}

    </div>
  );
}