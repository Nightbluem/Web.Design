# Güvenlik

Bu site statik bir sitedir: sunucu tarafında kod, veritabanı ya da kullanıcı hesabı yoktur. Saldırı yüzeyi bu yüzden çok küçüktür.

## Sitede alınan önlemler
- **İçerik Güvenlik Politikası (CSP):** Her sayfada yalnızca sitenin kendi dosyaları ve Google Fonts yüklenebilir. Sayfaya sonradan sokulmaya çalışılan script'ler tarayıcı tarafından engellenir (her sayfanın kendi script'i SHA-256 özetiyle izinlidir).
- **Çerçeve koruması:** Site başka bir sitenin içine (iframe) gömülürse kendi penceresine geçer (clickjacking'e karşı).
- **Referrer politikası:** Başka sitelere giderken yalnızca alan adı paylaşılır, tam adres paylaşılmaz.
- **Form:** İletişim formu şu an hiçbir yere veri göndermez; alan uzunlukları sınırlıdır. Kullanıcı girdisi sayfaya HTML olarak yazılmaz.
- **Üçüncü taraf script yok:** Analitik, reklam ya da dış JavaScript kütüphanesi kullanılmıyor.
- **HTTPS:** GitHub Pages siteyi yalnızca HTTPS ile sunar; `upgrade-insecure-requests` ile karışık içerik engellenir.
- **security.txt:** Güvenlik açığı bildirimleri için `/.well-known/security.txt`.

## DDoS
GitHub Pages, GitHub'ın küresel CDN'i (Fastly) üzerinden sunulur; temel DDoS trafiğini bu altyapı karşılar. Daha güçlü koruma için:
1. Bir alan adı alın (örneğin firmaadi.com).
2. Alan adını **Cloudflare**'e (ücretsiz plan yeterli) ekleyin ve DNS'i GitHub Pages'e yönlendirin.
3. Cloudflare'de "Under Attack Mode", "Bot Fight Mode" ve WAF kurallarını açın.
4. GitHub'da **Settings → Pages → Custom domain** alanına alan adını yazın ve **Enforce HTTPS**'i işaretleyin.

## Hesap güvenliği (sizin yapmanız gerekenler)
- GitHub hesabınızda **iki adımlı doğrulamayı (2FA)** açın.
- **Settings → Branches** bölümünden `Web_BIM` dalına koruma kuralı ekleyin (zorla gönderim ve silme kapalı).
- Depoya yalnızca güvendiğiniz kişileri ekleyin.

## Form servisine bağlarken
Formu Formspree, Netlify Forms gibi bir servise bağladığınızda CSP'deki `form-action` ve `connect-src` satırlarına o servisin adresini ekleyin ve servisin spam korumasını (reCAPTCHA/hCaptcha ya da honeypot) açın.
