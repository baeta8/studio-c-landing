# Studio C — Site oficial

Site institucional do Studio C, estúdio de beleza no Centro de Barra Mansa (RJ). Página estática em HTML, CSS e JavaScript, com foco em apresentar os serviços e facilitar o agendamento pelo WhatsApp.

## Recursos

- Serviços, galeria do espaço, avaliações públicas e informações de localização.
- Agendamento por WhatsApp com seleção de serviço, data e horário.
- Layout adaptável para celular e computador.
- Metadados para busca local, dados estruturados `BeautySalon`, `robots.txt` e `sitemap.xml`.
- Imagens otimizadas e carregamento adiado das imagens fora da primeira tela.

## Visualizar localmente

Na pasta do projeto, inicie um servidor estático:

```bash
python -m http.server 8787
```

Depois, acesse `http://localhost:8787`.

## Publicação

O GitHub Actions publica o conteúdo da branch `main` no GitHub Pages. O fluxo está em `.github/workflows/pages.yml` e pode ser acompanhado pela aba **Actions** do repositório.
