// Rol bazlı isimler kullanıyoruz ("beyaz" değil "arkaPlan"),
// çünkü koyu temada aynı rol farklı renge dönüşecek.

export const acikTema = {
  ad: 'acik',

  anaRenk: '#2563eb',
  anaRenkKoyu: '#1d4ed8',
  anaRenkUstuYazi: '#ffffff',

  arkaPlan: '#f5f6fa',
  kartArka: '#ffffff',
  acikKart: '#f8f8f8',
  acikGri: '#f2f2f2',

  yaziKoyu: '#333333',
  yaziOrta: '#666666',
  yaziGri: '#999999',

  kenarlik: '#e5e7eb',
  inputKenar: '#dddddd',

  basari: '#27ae60',
  uyari: '#f39c12',
  hata: '#e74c3c',
  pasif: '#cccccc',

  // Admin panele özel
  menuArka: '#1f2937',
  menuYazi: '#d1d5db',
  menuAktifArka: '#2563eb',
  menuAktifYazi: '#ffffff',
};

export const koyuTema = {
  ad: 'koyu',

  anaRenk: '#3b82f6',
  anaRenkKoyu: '#2563eb',
  anaRenkUstuYazi: '#ffffff',

  arkaPlan: '#121212',
  kartArka: '#1e1e1e',
  acikKart: '#2a2a2a',
  acikGri: '#2a2a2a',

  yaziKoyu: '#f5f5f5',
  yaziOrta: '#b0b0b0',
  yaziGri: '#888888',

  kenarlik: '#333333',
  inputKenar: '#444444',

  basari: '#2ecc71',
  uyari: '#f1c40f',
  hata: '#e74c3c',
  pasif: '#555555',

  // Admin panele özel
  menuArka: '#0f0f0f',
  menuYazi: '#b0b0b0',
  menuAktifArka: '#3b82f6',
  menuAktifYazi: '#ffffff',
};

export const temalar = {
  acik: acikTema,
  koyu: koyuTema,
};