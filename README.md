# Firma Adı BIM web sitesi: "Pafta seti"

Site bir BIM çizim seti gibi tasarlandı: her sayfa bir pafta (A-000 Kapak, A-100 Hizmetler, A-200 Projeler, A-210 Proje detay, A-300 Hakkımızda, A-900 İletişim).
Statik bir site olduğu için derleme gerekmez. Klasörü olduğu gibi Netlify, Cloudflare Pages, GitHub Pages ya da cPanel'e yükleyin.

## Dosyalar
- `*.html`: Sayfalar (TR/EN)
- `assets/style.css`: Tasarım sistemi (açık/koyu tema)
- `assets/model.js`: Kendini kuran izometrik bina modeli (canvas)
- `assets/site.js`: Dil, menü, görünürlük animasyonları
- `assets/logo.svg`, `assets/logo.png`: Logo

## Yayından önce değiştirilecekler
- "Firma Adı" ve `firmaadi.com` alan adı (sayfa başlıkları, canonical, sitemap, robots)
- İletişim bilgileri, rakamlar, projeler, ofisler (örnek olarak işaretli)
- İletişim formu şu an mesaj göndermiyor; Formspree ya da Netlify Forms gibi bir servise bağlanmalı.

## Sade sürüm

Özel nişangâh imleci, koordinat çizgileri ve sayfa geçiş perdesi kaldırıldı. Arka plan ızgarası, kenar cetvelleri ve sabit antet sadeleştirildi; başlıklar küçültüldü ve menü basitleştirildi. Türkçe/İngilizce seçenekleri ve model etkileşimleri korundu.

Sites yayını: https://bim-sade-tasarim.docile-mule-7951.chatgpt.site

Kaynakları derlemek için `python source/build.py` çalıştırın ve `source/out/deploy/` içeriğini depo köküne kopyalayın.
