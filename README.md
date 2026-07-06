# Studio C — Landing Page de Inauguração 💅

Landing page "em breve" do **Studio C — Studio de Beleza**. O QR code na porta
da loja aponta para esta página, que direciona as visitantes para o Instagram,
onde elas acompanham a obra até a inauguração.

## Como funciona

1. A pessoa escaneia o **QR code** colado na porta/vitrine.
2. Abre esta página no celular (logo, mensagem de "em breve").
3. Toca no botão **"Acompanhar no Instagram"** e segue o perfil.

## ✏️ Configurar o seu Instagram

Abra o arquivo [`index.html`](index.html) e, logo no topo, troque
`SEU_INSTAGRAM` pelo seu @ (sem o arroba):

```html
<script>const INSTAGRAM_USER = "SEU_INSTAGRAM";</script>
```

Exemplo: se o perfil for `instagram.com/studioc.beleza`, deixe assim:

```html
<script>const INSTAGRAM_USER = "studioc.beleza";</script>
```

## 🌐 Publicação

A página é publicada automaticamente no **GitHub Pages** a cada push na branch
`main` (workflow em `.github/workflows/pages.yml`). O endereço fica em:

```
https://<seu-usuario>.github.io/<nome-do-repositorio>/
```

É esse endereço que o QR code deve apontar.

## 📱 QR code

O arquivo `qrcode.png` (quando gerado) contém o QR code pronto para imprimir.
Imprima em bom tamanho (mínimo 10×10 cm para leitura à distância) e cole na
porta com um chamado curto, por exemplo: **"Curiosa? Aponte a câmera 💕"**.
